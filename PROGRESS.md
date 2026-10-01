# Progress Tracker: White Card Secure Personal Identity Wallet

## Phase Status Checklist

- [x] **Phase 1: Foundation**
  - [x] Git repo initialized & `.gitignore` created with strict `.env.local` exclusion
  - [x] Scaffold Next.js 14+ (App Router), TypeScript, Tailwind CSS, Lucide icons
  - [x] `.env.example` documenting every required variable
  - [x] Zod environment variable validation (`lib/env.ts`)
  - [x] Cached MongoDB client (`lib/db.ts`) with connection pooling and health diagnostics
  - [x] `scripts/gen-keys.ts` to generate `MASTER_KEY`, Ed25519 PKCS8 keypair, and `CRON_SECRET`
  - [x] `scripts/setup-indexes.ts` creating all required collections and unique/TTL indexes
  - [x] Pino logger with PII redaction (`lib/logger.ts`)
  - [x] Security headers and CSP in `next.config.mjs`
  - [x] `/api/health` route handler reporting DB connectivity and system health
  - [x] Root layout, dark slate theme (`#020617`), frosted-glass styling, persistent required footer: *"Personal document wallet – not a government-issued ID."*

- [x] **Phase 2: Authentication**
  - [x] MongoDB session store with TTL indexes (`lib/auth/session.ts`)
  - [x] Email provider adapter (Resend & Brevo SMTP via Nodemailer) (`lib/email/index.ts`)
  - [x] Email OTP sign-up / sign-in (6 digits, 10 min expiry, 5 attempt limit, hashed in DB)
  - [x] WebAuthn passkey registration and authentication (`@simplewebauthn/server` & `@simplewebauthn/browser`)
  - [x] CSRF protection & strict Origin verification (`lib/auth/csrf.ts`)
  - [x] MongoDB counter rate limiting with TTL indexes (`lib/ratelimit.ts`)
  - [x] Session management (list active sessions, revoke session, sign out)
  - [x] Auth UI: sign up / sign in tabs, OTP entry, passkey trigger (`components/AuthForm.tsx`)

- [x] **Phase 3: Encryption & Document Vault**
  - [x] AEAD encryption module using Node `crypto` (`AES-256-GCM`, 12-byte IV, AAD binding `userId + fieldName`)
  - [x] Per-user DEK generation and wrapping with `MASTER_KEY` (`wrappedDek`)
  - [x] Blind indexing with HMAC-SHA256 and HKDF derived `blindKey`
  - [x] Document validation rules (PAN, DL, Voter ID, Ration, Passport, etc.)
  - [x] Document CRUD API handlers with blind-index duplicate checks
  - [x] Encrypted attachments handler (magic bytes MIME verification, max 500 KB, encrypted storage)
  - [x] Document Vault UI: filter chips, search, masked numbers, accessible detail modal, copy ID, delete
  - [x] Export user data (authenticated, decrypted JSON) & account deletion with right to erasure

- [x] **Phase 4: Selective-Disclosure Sharing**
  - [x] Ed25519 signing & verification using `jose` (`lib/tokens.ts`)
  - [x] JWKS endpoint at `/.well-known/jwks.json`
  - [x] Preset claims generator (Full ID, Age 18+, Address only, DL auth, Ration quota, custom)
  - [x] Age 18+ selective claim: server computes `{ over18: boolean }` without disclosing DOB or other PII
  - [x] Share creation API with consent recording (`consents` collection)
  - [x] Public verification route `/v/[token]` displaying only selectively disclosed claims
  - [x] Revocation & single-use tracking (`lib/share-verifier.ts`)

- [x] **Phase 5: Verifier Portal**
  - [x] Verifier registration & hashed API key issuance (`app/api/verifier/register/route.ts`)
  - [x] `/verify` web scanner (`jsqr` + camera via `getUserMedia` + manual paste fallback)
  - [x] `POST /api/verify` with role checks, rate limiting, and blocklist validation
  - [x] Role-specific specialized views:
    - Traffic Police (license validity, vehicle classes)
    - Fair Price Shop (atomic ration deduction with quota checks)
    - Polling Officer (eligibility check-in with duplicate vote blocking)
    - Bank / Other generic verifier

- [x] **Phase 6: Audit, Privacy Center & Wallet UI**
  - [x] Tamper-evident SHA-256 audit hash chain module (`lib/audit.ts`)
  - [x] Instrument all actions with audit entries (link, share, verify, dispense, check-in, revoke, export)
  - [x] `GET /api/audit/verify` verification endpoint
  - [x] Privacy Center UI (audit logs, filter by authority, tamper check button, blocklist management, consent history)
  - [x] 3D Flip Card component with interactive tilt, platinum gradient, EMV chip, NFC, rotating QR with live countdown
  - [x] Holographic seal with pointer movement reflections
  - [x] Synthesized audio feedback (`AudioContext`) with mute toggle
  - [x] PWA manifest, meta tags, and icons (`public/manifest.json`, `public/icon.svg`)

- [x] **Phase 7: Tests, Documentation & Acceptance Verification**
  - [x] Vitest test suite covering all required test cases (31/31 passed)
  - [x] `README.md` with complete free-tier setup, architecture diagrams, threat model, key rotation
  - [x] Complete Acceptance Checklist (Section 11) run and verified (12/12 items PASS)
