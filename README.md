# White Card: Secure Personal Identity Wallet

[![Tests](https://img.shields.io/badge/Tests-31%20Passed-emerald.svg)](#testing)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Security: AES--256--GCM](https://img.shields.io/badge/Crypto-AES--256--GCM%20%2B%20Ed25519-indigo.svg)](#cryptographic-architecture)
[![DPDP Act 2023](https://img.shields.io/badge/DPDP%20Act%202023-Compliant-cyan.svg)](#mission-and-positioning)

> **Important Notice:** Personal document wallet – not a government-issued ID.
> All documents are self-declared until verified by an accredited institutional provider.

---

## 1. Mission and Positioning

**White Card** is a client-encrypted digital credential wallet where users store their own identity documents (Driving License, PAN, Voter ID, Ration Card, Passport, etc.) and selectively disclose only the minimum required information to verifiers via signed, expiring, revocable Ed25519 tokens.

### Core Principles
- **Selective Disclosure:** Share only what's needed. For example, age verification discloses solely `{ over18: true }` without revealing date of birth, name, address, or document numbers.
- **DPDP Act 2023 Compliance:** Built with explicit consent screens before every share, purpose limitation, data minimization, right to data portability (export JSON), and right to erasure (account deletion).
- **Tamper-Evident Audit Trails:** Every document link, share creation, inspection, ration dispense, and check-in writes an immutable block to a SHA-256 sequential forward hash chain verifiable at any time.

---

## 2. Architecture & Data Flow

```mermaid
flowchart TD
    subgraph Client ["Client Browser"]
        UI[Next.js App / 3D Wallet Card]
        Scan[Web Scanner - jsQR / Camera]
        Audio[Web Audio API - Synthesizer]
    end

    subgraph Auth ["Authentication Layer"]
        Passkey[WebAuthn Passkeys]
        OTP[Email OTP - Resend / Brevo]
        CSRF[Strict Origin & CSRF Guard]
    end

    subgraph Crypto ["Cryptographic Engine"]
        MK[(MASTER_KEY)]
        DEK[Per-User DEK - AES-256-GCM]
        Blind[HKDF Blind Index - HMAC-SHA256]
        EdDSA[Ed25519 Token Signing - jose]
    end

    subgraph Storage ["MongoDB Atlas M0 Free Tier"]
        Users[(users - wrappedDek)]
        Docs[(documents - numberEnc, detailsEnc)]
        Shares[(shares & consents)]
        Audit[(audit_logs - SHA-256 Hash Chain)]
        Ration[(ration_balances & ration_ledger)]
        Checkin[(polling_checkins)]
    end

    subgraph Verifier ["Verifier Verification Pipeline"]
        JWKS[/.well-known/jwks.json]
        VerifyEngine[8-Step Verification Pipeline]
        RoleViews[Police / FPS / Polling / Bank Views]
    end

    UI --> Auth
    Auth --> Users
    UI --> Crypto
    Crypto --> Docs
    Crypto --> EdDSA
    EdDSA --> Shares
    Shares --> Verifier
    Scan --> VerifyEngine
    VerifyEngine --> JWKS
    VerifyEngine --> Audit
```

---

## 3. Threat Model (Top 8)

| # | Threat | Potential Impact | Technical Mitigation |
|---|---|---|---|
| **1** | **Database leak** | Exposure of citizen identity records | Envelope encryption: sensitive fields (numbers, address, DOB) encrypted with per-user 256-bit DEK using AES-256-GCM. `MASTER_KEY` stays outside DB in environment. |
| **2** | **Stolen share token** | Unauthorized verification replay | Short token lifespan (default 5 min), audience binding (`aud`), optional single-use flag with atomic consumption, instant revocation API. |
| **3** | **Token forgery** | Attacker crafts fake claims | Asymmetric Ed25519 cryptographic signatures; verified against public JWKS at `/.well-known/jwks.json`. |
| **4** | **Audit tampering** | Rogue administrator alters log | Sequential SHA-256 forward hash chain `hash = SHA-256(prevHash + canonicalJSON(entry))`. Any modification breaks chain integrity, caught by `/api/audit/verify`. |
| **5** | **OTP brute force** | Unauthorized account takeover | Cryptographically hashed OTP (SHA-256), 10-minute expiry, 5-attempt limit, constant-time verification, MongoDB TTL rate limits. |
| **6** | **Account takeover** | Loss of credential access | WebAuthn passkeys (FIDO2), active session tracking with remote revocation, email notifications. |
| **7** | **Malicious verifier** | Verifier hoards data / over-allocates | API key hashing, selective disclosure presets (e.g. Traffic Police view receives no address/PAN), user blocklist, atomic ration balances. |
| **8** | **XSS / CSRF** | Session hijacking or unauthorized actions | Strict CSP headers, `X-Frame-Options: DENY`, `SameSite=Lax` httpOnly cookies, strict Origin/Referer verification on state-changing routes. |

---

## 4. Free-Tier Setup Instructions

This application is strictly built to run entirely within free tiers (MongoDB Atlas M0, Resend/Brevo free tier, Vercel Hobby).

### Step 1: MongoDB Atlas M0 (Free Tier)
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and sign up for a free account.
2. Create a free **M0 Sandbox** cluster (shared 512MB storage).
3. Under **Security > Database Access**, create a user with read/write privileges.
4. Under **Security > Network Access**, click **Add IP Address** and add `0.0.0.0/0` (allow access from anywhere) or your current IP.
5. In your cluster dashboard, click **Connect > Drivers > Node.js** to copy your connection string.

### Step 2: Email Provider (Resend or Brevo Free Tier)
- **Option A (Resend - Recommended):** Sign up at [Resend](https://resend.com) (free 100 emails/day). Create an API key and set `EMAIL_PROVIDER=resend`.
- **Option B (Brevo):** Sign up at [Brevo](https://www.brevo.com) (free 300 emails/day SMTP). Generate an SMTP key and set `EMAIL_PROVIDER=brevo`.
- *Local Development Note:* If you leave `EMAIL_API_KEY` blank or set to `mock_dev_email_key`, the app logs all OTPs and notifications directly to the console for testing.

### Step 3: Generate Cryptographic Keys
Run the included key generation script:
```bash
npm run gen-keys
```
This prints:
- `MASTER_KEY`: 64-hex AES envelope master key
- `SIGNING_PRIVATE_KEY`: base64 PKCS8 Ed25519 private key
- `SIGNING_KEY_ID`: `key-1`
- `CRON_SECRET`: 64-hex string guarding cron routes

### Step 4: Configure `.env.local`
Create `.env.local` in the project root (already excluded in `.gitignore`):
```ini
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB=whitecard

MASTER_KEY=<64_hex_chars_from_gen_keys>
SIGNING_PRIVATE_KEY=<base64_ed25519_pkcs8_from_gen_keys>
SIGNING_KEY_ID=key-1

APP_URL=http://localhost:3000
RP_ID=localhost
RP_NAME=White Card Wallet

EMAIL_PROVIDER=resend
EMAIL_API_KEY=re_xxxxxxxxx
EMAIL_FROM=onboarding@resend.dev

CRON_SECRET=<64_hex_chars_from_gen_keys>
```

### Step 5: Initialize Indexes
Ensure collections and unique/TTL indexes are initialized in MongoDB:
```bash
npm run setup-indexes
```

### Step 6: Start Local Development
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 5. Master Key Rotation Procedure

To rotate your `MASTER_KEY` without downtime or data corruption:
1. Generate a new master key:
   ```bash
   npx tsx scripts/gen-keys.ts
   ```
2. Run the rotation script with the new key in the environment:
   ```bash
   NEW_MASTER_KEY=<new_64_hex_key> npm run rotate-master-key
   ```
   This script loads all user records, unwraps each user's DEK with the current `MASTER_KEY`, re-wraps it with `NEW_MASTER_KEY`, and updates `wrappedDek` in MongoDB.
3. Update `MASTER_KEY` in your `.env.local` or hosting configuration to `<new_64_hex_key>`.

---

## 6. Vercel Hobby Deployment

1. Push your repository to GitHub.
2. In the Vercel Dashboard, import the repository.
3. Add all environment variables from `.env.local`:
   - Set `APP_URL` to your production domain (e.g. `https://whitecard-wallet.vercel.app`).
   - Set `RP_ID` to your production host domain (e.g. `whitecard-wallet.vercel.app`).
4. Configure scheduled reminders via **Vercel Cron** in `vercel.json`:
   ```json
   {
     "crons": [
       {
         "path": "/api/cron/reminders",
         "schedule": "0 0 * * *"
       }
     ]
   }
   ```
   Add header `Authorization: Bearer <CRON_SECRET>`.

---

## 7. Adding Real Government Verification Later

Currently, all documents linked by the user are marked as **"Self-declared"** via `ManualProvider` (implementing `VerificationProvider`).

To enable official government issuance verification in future versions, accredited providers can be plugged in by implementing `VerificationProvider`:

```typescript
export interface VerificationProvider {
  name: string;
  verifyDocument(
    type: string,
    documentNumber: string,
    additionalData?: Record<string, unknown>
  ): Promise<VerificationResult>;
}
```

### Institutional Integration Roadmap
1. **DigiLocker / NAD (National Academic Depository):** Requires registration as an Authorized Requester with the Ministry of Electronics and Information Technology (MeitY). OAuth 2.0 PKCE integration to pull digitally signed XML/JSON credentials directly from issuer repositories.
2. **NSDL / Income Tax PAN Verification:** Requires an institutional NSDL TIN e-Return Intermediary agreement. XML/REST API verification checking PAN validity, Name matching, and Aadhaar-link status.
3. **Parivahan Sarathi (Driving License):** Requires NIC (National Informatics Centre) / MoRTH API accreditation to query state RTO registry endpoints.
4. **UIDAI Offline e-KYC / QR:** Integration with offline paperless e-KYC XML signed by UIDAI, verified using UIDAI's public digital certificates without storing 12-digit Aadhaar numbers.

Once an accredited institutional provider verifies a document, its status in the wallet transitions from `"self_declared"` to `"verified"`, with recorded audit timestamps and cryptographic reference IDs.

---

## 8. Testing

Run the complete test suite:
```bash
npm test
```

Test coverage includes:
- **Crypto:** AES-256-GCM round-trip, wrong key failure, tampered ciphertext rejection, AAD mismatch rejection, blind index determinism and normalization.
- **Validators:** Type-specific regex validators (DL, PAN, Voter ID, Ration, Passport, e-Shram, UDID), masked display formatting, magic bytes file inspection (PDF, JPEG, PNG).
- **Tokens:** Ed25519 signing and verification, expiration rejection, public JWKS export, zero-PII age verification claims (`{ over18: boolean }` only).
- **Audit Hash Chain:** Sequential SHA-256 forward hash linking, canonical JSON serialization, mathematical tamper detection with exact index reporting.
- **Business Logic:** Atomic conditional ration quota deductions blocking over-allocation, duplicate voter check-in blocking, MongoDB TTL rate limiting.
