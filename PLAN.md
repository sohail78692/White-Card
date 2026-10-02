# PLAN.md: "White Card" Secure Personal Identity Wallet

> This file is the single source of truth. It contains the agent instructions, the full spec, the technical plan, the phases, and the acceptance checklist. Read it fully before doing anything, and re-read it whenever you are unsure.

---

## 0. Agent Instructions (read first)

You are a senior full-stack engineer and security-minded product designer. Build the entire project described below, end to end, autonomously, without waiting for my approval between phases.

### Hard rules
1. **Free tiers only.** MongoDB Atlas M0, Vercel Hobby (or any free Node host), and a free email tier. No paid services, paid APIs, or paid packages. If something needs payment, pick a free alternative and record it in `DECISIONS.md`.
2. **Never hardcode secrets.** Read them from `.env.local`. Before anything else, make sure `.env.local` is in `.gitignore`. Create `.env.example` documenting every variable.
3. **Never store or log plaintext document numbers.** Mask them in the UI by default.
4. **No government branding.** No emblems, no "Republic of India" text, nothing implying official issuance. See Section 1.
5. **Do not ask me questions unless truly blocked.** Make sensible decisions and record each in `DECISIONS.md`.
6. **No placeholders, no TODOs, no "rest of code here".** Every file must be complete and working.
7. **Do not print secrets or full source files in chat.** Write them to the workspace.

### Workflow
1. Keep a `PROGRESS.md` checklist of the phases in Section 9. Update it after each phase so work can resume if interrupted.
2. After each phase run lint, type-check, and the tests written so far. Fix every failure before moving on.
3. Start the dev server and use the browser agent to test the real flow: sign up, add a document, create a share, open the `/v/...` link as a verifier, revoke it, and confirm the revoked token is rejected. Fix any bugs found.
4. At the end run the Acceptance Checklist (Section 11) item by item. Report PASS or FAIL with evidence for each. Fix every FAIL and re-run.
5. If interrupted, re-read this file and `PROGRESS.md`, then continue from the first unfinished phase.

### Final output
- A working app that starts with `npm run dev`.
- `README.md` with free-tier setup steps (Atlas, email provider, Vercel) and how to run it.
- A short summary of what is done, what is incomplete, and manual steps I must do (Atlas IP allowlist, generating keys).

---

## 1. Mission and Positioning

Build a REAL, deployable web app (not a demo) where a person stores their own identity documents (Driving License, PAN Card, Voter ID, Ration Card) in one encrypted wallet and shares only the minimum required information with verifiers via signed, expiring, revocable tokens.

- This is a **private wallet, not a government-issued ID.** Use neutral branding ("White Card Wallet"). Footer on every page: *"Personal document wallet – not a government-issued ID."*
- All documents are **"Self-declared"**. Include a `VerificationProvider` interface with only a `ManualProvider` implemented, so DigiLocker / NSDL / Parivahan providers can be plugged in later. **Never display "Verified" unless a provider confirmed it.**
- Follow DPDP Act 2023 principles: explicit consent, purpose limitation, data minimization, right to export, right to erasure.
- "Zero-knowledge" is not claimed. UI copy says **"Share only what's needed"** (selective disclosure).
- Seed and sample data must be obviously fictional.

---

## 2. Tech Stack (free-tier, hard constraint)

| Concern | Choice |
|---|---|
| Framework | Next.js 14+ (App Router), TypeScript strict |
| Styling | Tailwind CSS, Lucide icons, inline SVG only (no external images or fonts) |
| Database | MongoDB Atlas M0 via official `mongodb` driver; cached connection for serverless |
| Hosting | Vercel Hobby (non-commercial use; note in README) or any free Node host |
| Auth | WebAuthn passkeys (`@simplewebauthn/server` + `/browser`) + email OTP fallback; httpOnly, Secure, SameSite=Lax session cookies stored in MongoDB; CSRF protection (double-submit token or Origin check) |
| Email | Swappable adapter: Resend free tier or Brevo free SMTP via Nodemailer. No SMS. |
| Rate limiting | MongoDB counters with TTL indexes (no Redis, no in-memory) |
| Crypto | Node `crypto` (AES-256-GCM, HKDF, HMAC-SHA256); `jose` for Ed25519 JWTs |
| QR | `qrcode` (generate), `jsqr` + `getUserMedia` (scan) |
| Validation | Zod on every API input |
| Tests | Vitest (unit/integration), optional Playwright for core flow |
| Logging | `pino` with PII redaction. No Sentry or other paid monitoring. |
| Scheduling | Vercel Cron (free tier) calling a `CRON_SECRET`-protected route |

---

## 3. Environment Variables (`.env.example`)

```
MONGODB_URI=            # Atlas M0 connection string (URL-encode special chars in password)
MONGODB_DB=whitecard
MASTER_KEY=             # 64 hex chars (32 bytes): openssl rand -hex 32
SIGNING_PRIVATE_KEY=    # base64 PKCS8 Ed25519 private key (generate with scripts/gen-keys.ts)
SIGNING_KEY_ID=key-1    # kid for rotation
APP_URL=http://localhost:3000
RP_ID=localhost         # WebAuthn relying party id (domain in prod)
RP_NAME=White Card Wallet
EMAIL_PROVIDER=resend   # resend | brevo
EMAIL_API_KEY=
EMAIL_FROM=
CRON_SECRET=            # random string guarding /api/cron/*
```

Provide `scripts/gen-keys.ts` that prints a MASTER_KEY, an Ed25519 keypair (private for env, public exposed via JWKS), and a CRON_SECRET. Validate all env vars with Zod at startup and fail fast with clear messages.

---

## 4. Architecture and Data Model

### 4.1 Folder structure (adjust if needed, record changes in DECISIONS.md)

```
/app
  (marketing)/page.tsx            landing + sign in/up
  (app)/wallet/                   wallet card + dashboard
  (app)/vault/                    document CRUD
  (app)/share/                    create/manage shares + consent
  (app)/privacy/                  audit + consent history + export/delete
  v/[token]/page.tsx              public share view (disclosed claims only)
  verify/                         verifier portal (register, scanner, role views)
  api/...                         route handlers
  .well-known/jwks.json/route.ts
/lib
  db.ts  env.ts  crypto/{aead,keys,hkdf}.ts  tokens.ts  audit.ts
  auth/{session,passkeys,otp,csrf}.ts  ratelimit.ts  email/{index,resend,brevo}.ts
  providers/{VerificationProvider,ManualProvider}.ts  validators/documents.ts
/components  /scripts  /tests  /public (manifest, icons as SVG/PNG generated locally)
```

### 4.2 MongoDB collections and indexes (created by `scripts/setup-indexes.ts`)

| Collection | Key fields | Indexes |
|---|---|---|
| `users` | email (unique, lowercase), name, dobEnc, wrappedDek, walletId, createdAt | `email` unique; `walletId` unique |
| `credentials` | userId, credentialId, publicKey, counter, transports, label | `credentialId` unique; `userId` |
| `sessions` | userId, tokenHash, ua, ip, createdAt, expiresAt | `tokenHash` unique; TTL on `expiresAt` |
| `otps` | email, codeHash, attempts, expiresAt | TTL on `expiresAt` |
| `rate_limits` | key, count, expiresAt | `key` unique; TTL on `expiresAt` |
| `documents` | userId, type, numberEnc, numberBlindIdx, maskedNumber, issuer, detailsEnc, expiry, status (self_declared/expired), createdAt | `(userId, numberBlindIdx)` unique; `(userId, type)` |
| `attachments` | userId, documentId, nameEnc, mime, size, dataEnc | `userId`; `documentId` |
| `shares` | jti, userId, preset, fields[], purpose, audience, singleUse, usedAt, revokedAt, expiresAt, createdAt | `jti` unique; `userId`; TTL on `purgeAt` (expiresAt + 7 days) |
| `consents` | userId, shareId, fields[], purpose, audience, duration, at | `userId` |
| `verifiers` | name, type (police/fps/polling/bank/other), contactEmail, apiKeyHash, blocked, createdAt | `apiKeyHash` unique |
| `blocklist` | userId, verifierId | `(userId, verifierId)` unique |
| `audit_logs` | userId, seq, ts, actor, action, fields[], result, prevHash, hash | `(userId, seq)` unique; `(userId, ts)` |
| `ration_ledger` | userId, documentId, month (YYYY-MM), item, qtyKg, verifierId, ts | `(documentId, month)` |
| `ration_balances` | documentId, month, rice, wheat (remaining kg) | `(documentId, month)` unique |
| `polling_checkins` | userId, electionId, verifierId, ts | `(userId, electionId)` unique |

### 4.3 Encryption design
- `MASTER_KEY` (env) wraps a random **per-user DEK** (32 bytes) using AES-256-GCM; store `wrappedDek` on the user.
- Sensitive fields (document numbers, address, details, DOB, attachment bytes and names) are encrypted with the user's DEK using AES-256-GCM, a fresh 12-byte IV per encryption, stored as `v1.iv.tag.ciphertext` (base64url). Bind the context (userId + field name) as AAD.
- Duplicate detection without plaintext: `numberBlindIdx = HMAC-SHA256(blindKey, normalizedNumber)` where `blindKey` is derived from `MASTER_KEY` via HKDF with info `"blind-index"`.
- Key rotation: version prefix in ciphertext; `scripts/rotate-master-key.ts` re-wraps all DEKs with a new master key. Document the steps in the README.
- Never log plaintext; pino redaction paths for `number`, `dob`, `address`, `email`, `otp`, `authorization`, `cookie`.

### 4.4 Share token design
- Ed25519 key from `SIGNING_PRIVATE_KEY`; public JWK served at `/.well-known/jwks.json` with `kid`.
- JWT claims: `iss` (APP_URL), `sub` (opaque wallet id, not email), `jti`, `iat`, `exp` (default 5 min, max 24 h), `aud` (verifier type or id), `purpose`, `preset`, `claims` (only the disclosed fields).
- The QR encodes a **link** `/v/{jwt}`, never raw personal data beyond the signed minimal claims.
- Verification order: signature and `kid` → `exp`/`iat` → `shares` lookup by `jti` → `revokedAt` → single-use (atomic `findOneAndUpdate` setting `usedAt` where `usedAt` is null) → verifier not on user's blocklist → write audit entry → return only disclosed claims.
- **Age 18+ preset** discloses only `{ over18: boolean }`, computed server-side from the encrypted DOB. No DOB, name, address, or numbers.
- Presets: Full ID, Age 18+, Address only, Driving authorization (license validity + vehicle classes), Ration entitlement (scheme, family count, remaining quota), plus a custom field picker.

### 4.5 Audit hash chain
- Per user, `seq` increments from 0. `hash = SHA-256(prevHash + canonicalJSON({userId, seq, ts, actor, action, fields, result}))`; genesis `prevHash` = 64 zeros.
- Unique `(userId, seq)` index prevents forks. Retry on duplicate key.
- Store field **names**, never values.
- The app exposes **no update or delete code path** for `audit_logs`. README notes that DB-level write restriction needs a paid Atlas tier, so the hash chain is the tamper-evidence layer.
- `GET /api/audit/verify` recomputes the chain and returns `{ intact: true }` or `{ intact: false, firstBrokenIndex }`.
- Account deletion erases the user's audit chain along with all other data (right to erasure), after offering export.

### 4.6 Atomic operations
- **Ration dispense:** one conditional update: `findOneAndUpdate({documentId, month, rice: {$gte: qty}}, {$inc: {rice: -qty}})` plus a ledger insert inside a MongoDB transaction (M0 supports them). Reject over-allocation. Balances reset monthly on first access of a new month from the declared quota.
- **Polling check-in:** insert into `polling_checkins`; duplicate key on `(userId, electionId)` means "Already checked in".

---

## 5. Features

### 5.1 Accounts and Wallet
- Sign up / sign in with passkey or email OTP (6 digits, 10 min expiry, 5 attempts, hashed in DB). Profile (name, DOB, address). Passkey management. Session list with revoke. Sign out.
- **Wallet card:** 3D flip card (`perspective`, `preserve-3d`, `backface-visibility: hidden`), flip on click, Enter/Space, and a "Flip Card" button (`aria-pressed` synced). Ratio 1.586:1, max-width 420px.
  - Front: platinum/matte-white gradient, SVG EMV chip with trace lines, NFC icon, status dot, neutral header "WHITE CARD WALLET", wallet ID, user name, "linked documents" count, holographic seal whose gradient shifts with pointer position (CSS vars on `pointermove`).
  - Back: magnetic stripe, rotating QR that encodes a short-lived share link (regenerates on expiry with countdown), emergency contact field (user-set), microtext line.
  - Subtle tilt on hover. All motion disabled under `prefers-reduced-motion` (use fades).

### 5.2 Document Vault
- Types: Strictly the 4 core Indian documents: **Driving License (DL)**, **PAN Card**, **Voter ID (EPIC)**, and **Ration Card** (removed extraneous types: Passport, Ayushman Bharat, e-Shram, UDID, and custom).
- Type-specific validation (regex): DL, PAN (`^[A-Z]{5}[0-9]{4}[A-Z]$`), Voter ID (`^[A-Z]{3}[0-9]{7}$`), Ration Card (`^[A-Z0-9]{8,18}$`); auto-uppercase; inline field errors; duplicate rejection via blind index.
- Type-specific details: DL (vehicle classes, expiry, organ donor, RTO), PAN (father's name, taxpayer category, Aadhaar-link status as declared), Voter ID (AC number, polling booth, parliamentary constituency, part/serial), Ration (scheme, FPS depot ID, family members, monthly rice/wheat quota).
- Expiry tracking with email reminders (Vercel Cron route, 30 days and 7 days before). Status: Self-declared / Expired.
- Optional attachments: max 500 KB each, PDF/JPG/PNG (check magic bytes, not just extension), encrypted before storage, max 5 per user; show storage usage.
- Search, filter chips (All / Identity / Financial / Welfare), responsive color-coded grid, masked numbers, accessible detail modal (focus trap, Esc, focus restore), Copy ID with clipboard fallback and toast.
- Export all data as JSON (decrypted, user-initiated, authenticated). Delete document. Delete account with full erasure and confirmation.

### 5.3 Selective-Disclosure Sharing
- Choose preset or custom fields, purpose, expiry, single-use toggle.
- **Consent screen before every share** listing exactly which fields, to whom (audience), and for how long. Record in `consents`.
- Output: QR + `/v/{token}` link + copy button, live countdown, one-tap revoke, list of active/expired shares.

### 5.4 Verifier Portal (`/verify`)
- Verifier registers (org name, type: Police / FPS / Polling / Bank / Other), receives an API key (shown once, stored hashed). Web scanner using `getUserMedia` + `jsqr` with manual link-paste fallback.
- `POST /api/verify` (API key auth, rate limited) returns `Valid / Expired / Revoked / Invalid` plus only the disclosed claims.
- Role views using only the disclosed claims (no extra data pulled):
  - **Traffic Police:** license validity, vehicle classes. Address and PAN never shown.
  - **Fair Price Shop:** entitlement and remaining quota; dispense form deducts rice/wheat atomically and blocks over-allocation.
  - **Polling Officer:** eligibility; mark checked-in once per election ID; second attempt shows "Already checked in".
  - **Bank / Other:** generic disclosed-claims view.
- Every verification writes an audit entry and emails/notifies the user.

### 5.5 Audit and Privacy Center
- List of every access: who, which fields, when, result, short hash. Filters by authority and status, newest first. "Verify chain" button, "Tamper check" explanation, "Export log" (JSON), consent history, per-verifier block list, data export, delete account.

### 5.6 Operations
- `/api/health`, pino structured logs with redaction, error boundaries, empty/loading/error states on every view.

### 5.7 Audio (optional, polish)
- Single lazily created `AudioContext`, resumed on first user gesture. Short tones for flip, scan, success, error. Mute toggle in the header, persisted in `localStorage` (wrapped in try/catch).

---

## 6. UI / UX

- **Aesthetic Direction: Apple-grade iOS Luxury Frosted Glass**: Refined, curated glassmorphism (`glass-ios`, `glass-ios-card`, `backdrop-blur-xl`, subtle translucent borders) with no harsh neon halos or loud glows. Dark theme (`#000000` / `#020617`).
- **Hero 3D Interactive Wallet Stack**: 4-layer physical card stack with interactive mouse-follow 3D tilt (`rotateX`, `rotateY`) and layer fanning on hover. Features a 2x2 grid for the 4 supported documents (Driving License with `CarFront`, PAN Card with `FileText`, Voter ID with `Vote`, Ration Card with `Wheat`) with Apple squircle depth highlights and unified single-line vertical centering.
- **Hero Headline 3D Isometric Hover Animation**: Headline ("Your personal identity wallet.") features an extruded 3D multi-tiered isometric shadow with physical diagonal lift on hover, with safety line-height and bounding buffers preventing any letter clipping on 'Y' and 'y'.
- **Asset Hygiene & Optimization**: Removed all unused, external, or placeholder image files. All icons use inline SVGs via `lucide-react`, and graphics use clean, high-performance CSS.
- **Typography & Sound Controls**: Modern Inter font hierarchy. Refined iOS glass sound toggle button with synthesized `AudioContext` tones and persistent mute preferences.
- **Mobile-first Responsiveness**: Fluid from 360px to 1440px with zero horizontal scroll at 360px.
- **Installable PWA**: Manifest, icons, theme color, accessible keyboard navigation, visible focus rings, ARIA status badges.
- **Persistent Required Footer**: *"Personal document wallet – not a government-issued ID."*

---

## 7. Security Requirements (non-negotiable)

1. Field-level AES-256-GCM encryption as in 4.3. No plaintext identifiers in DB or logs.
2. Ed25519-signed share tokens, short expiry, revocation, single-use support.
3. Passkeys + OTP with hashed codes, attempt limits, constant-time comparisons.
4. Rate limiting (Mongo TTL counters) on auth, OTP, verify, and share-creation endpoints.
5. CSRF protection on all state-changing routes; strict `Origin` check.
6. Security headers: CSP (no inline scripts except nonce), HSTS, `X-Content-Type-Options`, `Referrer-Policy: no-referrer`, `Permissions-Policy` (camera allowed only on `/verify`), `X-Frame-Options: DENY`.
7. Zod validation on every input; reject unknown keys.
8. Upload checks (size, MIME via magic bytes, count). Include an `scanUpload()` hook stub clearly documented as the antivirus integration point.
9. No secrets in the client bundle. No `NEXT_PUBLIC_` secrets.
10. Authorization checks on every route: a user can only access their own data; verifiers can only call verify endpoints.

---

## 8. Threat Model (include in README, top 8)

| # | Threat | Mitigation |
|---|---|---|
| 1 | Database leak | Field-level AES-256-GCM, per-user DEKs, master key outside DB |
| 2 | Stolen share token | Short expiry, revocation, single-use, audience binding |
| 3 | Token forgery | Ed25519 signatures, `kid` rotation, JWKS |
| 4 | Audit tampering | Hash chain, unique `(userId, seq)`, verify endpoint |
| 5 | OTP brute force | Hashed OTP, attempt cap, rate limits |
| 6 | Account takeover | Passkeys, session revoke, device list, notifications |
| 7 | Malicious verifier | API key hashing, blocklist, rate limits, minimal disclosure |
| 8 | XSS / CSRF | CSP with nonce, output encoding, CSRF tokens, SameSite cookies |

---

## 9. Build Phases

**Phase 1: Foundation.** Scaffold Next.js + TS + Tailwind; `.gitignore` with `.env.local`; `.env.example`; Zod env validation; cached Mongo connection; `scripts/setup-indexes.ts`; `scripts/gen-keys.ts`; security headers/CSP; pino logger; health route; base layout, theme, footer.
*Done when:* app loads, `/api/health` returns OK with DB connected, index script runs cleanly.

**Phase 2: Auth.** Email adapter (Resend/Brevo); OTP flow; passkey register/login; sessions; CSRF; Mongo rate limiting; session list/revoke.
*Done when:* a user can sign up and sign in via OTP and passkey; limits trigger on abuse.

**Phase 3: Encryption + Vault.** AEAD module with tests; DEK wrapping; document CRUD with validators, blind index, details, expiry; attachments; search/filter/modal UI; export and account deletion.
*Done when:* DB inspection shows no plaintext numbers; duplicate numbers are rejected.

**Phase 4: Sharing.** Token module; JWKS route; consent screen; share creation, list, revoke; `/v/[token]` page; age-proof claim.
*Done when:* expired and revoked tokens are rejected; age token contains only `over18`.

**Phase 5: Verifier portal.** Verifier registration and API keys; scanner; `/api/verify`; role views; ration dispense transaction; polling check-in.
*Done when:* over-allocation is blocked; second poll check-in is blocked.

**Phase 6: Audit, Privacy Center, Wallet UI.** Hash-chain audit module wired into every action (link, share, verify, dispense, check-in, revoke, export); Privacy Center; flip card with rotating QR; holographic seal; audio; PWA.
*Done when:* "Verify chain" passes, and fails after a manual tamper in the DB.

**Phase 7: Tests, docs, acceptance.** Complete tests (Section 10); README (free-tier setup for Atlas / Resend or Brevo / Vercel, architecture diagram in Mermaid, threat model, key rotation, free-tier limits, "Adding real government verification later" listing the accreditation and API access needed); run Section 11.

---

## 10. Required Tests (Vitest)

- Encryption round-trip, wrong-key failure, tampered-ciphertext failure, AAD mismatch failure.
- Blind index determinism and duplicate rejection.
- Token sign/verify, expiry, revocation, single-use race (two concurrent verifies, only one succeeds).
- Age-proof payload contains no DOB, name, address, or document numbers.
- Audit chain: valid chain passes; modified entry reports the correct first broken index.
- Atomic ration deduction: concurrent dispenses never exceed the balance.
- Polling duplicate check-in blocked.
- Validators for each document type (valid and invalid cases).
- Rate limiter blocks after threshold and resets after TTL window.

---

## 11. Acceptance Checklist (report PASS/FAIL with evidence)

1. App runs locally with only a free Atlas URI, an email API key, and generated secrets.
2. Sign-up, add document, share, and verify work end to end.
3. Database inspection shows no plaintext document numbers, DOB, or addresses.
4. Tampering with an audit entry is caught by "Verify chain".
5. Expired and revoked tokens are rejected by the verifier.
6. Age-proof token contains no DOB, name, address, or document numbers.
7. Ration dispensing reduces the balance atomically and blocks over-allocation.
8. Polling check-in works once per election ID.
9. Card flips via click, keyboard, and button; QR visible on the back and rotating.
10. Layout has no horizontal scroll at 360px; `prefers-reduced-motion` respected.
11. No console errors; no paid dependency anywhere; `.env.local` is git-ignored.
12. No "Verified" label appears anywhere for self-declared documents.

---

## 12. Manual Steps for the Owner (report these at the end)

1. Create a free Atlas M0 cluster, a database user, and add your IP to Network Access.
2. Create `.env.local` from `.env.example`; run `npm run gen-keys` and paste the outputs.
3. Create a free Resend or Brevo account and add the API key.
4. For deployment: add the same variables in Vercel project settings; set `RP_ID` to your domain; configure Vercel Cron for the reminder route.
5. Before storing real identity data: have the encryption, token, and auth code independently reviewed, and get legal advice on DPDP Act obligations.
