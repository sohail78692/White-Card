# 🛡️ White Card: Complete Authenticated App Master Plan
### *Aligning 100% of Landing Page Features & Security Promises with In-App Reality*

Every single claim, power, and cryptographic feature promised on the White Card landing page must exist inside the app after signing in—functional, interactive, secure, and visually stunning.

---

## 📋 Landing Page Promises vs In-App Implementation

| Landing Page Feature | What Was Promised | How It Works Inside After Sign-In |
| :--- | :--- | :--- |
| **4 Supported Documents** | Driving License, PAN, Voter ID, Ration Card | Dedicated document models, realistic PVC 3D renders, OCR scanning, and field validation. |
| **Selective Disclosure** | *"Share what matters. Keep the rest private"* | Attribute-level toggle switches (e.g., prove **Age 18+** or **DL Valid** without revealing raw DOB or address). |
| **Temporary QR Tokens** | Auto-expiring, signed QR access | Live countdown timer (5 min default), dynamic QR regeneration, signed with Ed25519. |
| **Tamper-Proof Audit Chain** | SHA-256 cryptographic chain | Append-only hash chain linking every verification. Interactive "Verify Chain Integrity" tool. |
| **Fortress Security** | 1-Tap Shredder, Anti-Screenshot, AES-256 Envelope | Emergency 1-tap vault wipe, blur privacy shield when tab unfocuses, envelope-encrypted DEKs. |

---

## 🗺️ In-App Architecture & Site Map (After Sign-In)

```
/wallet                  ➔ Luxury 3D Identity Dashboard (Command Center)
  ├── 3D Flip Card       ➔ Interactive Physical ID Card Preview (PVC flip, holographic foil)
  ├── 4 Document Slots   ➔ Quick-access pods for DL, PAN, Voter ID, Ration Card
  ├── Live QR Pass       ➔ Auto-expiring proof token with ticking countdown
  ├── Emergency Contact  ➔ Instant 1-tap contact update (stored securely)
  └── Quick Actions      ➔ Add Document, Create Share Proof, Security Status

/vault                   ➔ Full Document Vault & Management
  ├── Document Grid      ➔ Filter by All / Identity / Financial / Welfare
  ├── Add Document Modal ➔ OCR Scanner (Camera/Upload), PDF parsing, or manual input
  ├── Document Detail    ➔ Field-level editing, attachments, PVC front/back card view, delete
  └── Download PVC PDF   ➔ High-resolution printable card generation

/share                   ➔ Selective Disclosure & QR Sharing Studio
  ├── Presets            ➔ "Bar/Age Gate (18+ only)", "Police Traffic Stop (DL)", "Job KYC"
  ├── Custom Toggles     ➔ Granular field-level checkboxes (hide address, reveal age, etc.)
  ├── Expiry Selector    ➔ 5 mins, 15 mins, 1 hour, or single-use
  ├── Live QR Generator  ➔ Generates signed token, copy link, scan countdown
  └── Revoke Management  ➔ Active shares list with instant "Revoke Now" button

/privacy                 ➔ Fortress Privacy & Cryptographic Center
  ├── SHA-256 Hash Chain ➔ Interactive chain traversal & live "Verify Integrity" engine
  ├── Real-Time Audit Log➔ Feed of verifications, sign-ins, and token access
  ├── 1-Tap Shredder     ➔ Red alert emergency wipe (destroys keys & docs)
  ├── Anti-Screenshot    ➔ Toggleable visual privacy shield (auto-blurs cards on unfocus)
  └── Active Consents    ➔ List of approved verifiers & session devices
```

---

## 🚀 Step-by-Step Implementation Phases

### **Phase 1: The Core 4 Document System & Realistic PVC Cards** [COMPLETED]
- [x] **Document Types**:
  - **Driving License (DL)**: DL number, Vehicle Classes (LMV, MCWG), Validity/Expiry date, RTO, State.
  - **PAN Card**: 10-char PAN number, Name, Father's Name, DOB, Card Status (Active & Linked).
  - **Voter ID (EPIC)**: EPIC alphanumeric ID, Parliamentary Constituency, Polling Station, Issue Date.
  - **Ration Card**: Ration ID, Head of Family, Family Members array, Category (APL/BPL/AAY).
- [x] **3D PVC Physical Card Renderer**:
  - Realistic plastic shine, hologram emblem, government-style microprint textures, interactive 3D flip-to-back animation for all 4 cards.
- [x] **OCR & Smart Extraction & Identity Hub**:
  - Multi-engine OCR (Tesseract / regex pattern matching) extracting fields automatically from uploaded photo or scan, plus 1-click sample auto-fill and Core 4 Identity Hub trays in `/vault` and `/wallet`.

### **Phase 2: Selective Disclosure & Proof Token Studio (`/share`)**
- [ ] **Zero-Knowledge Style Predicates**:
  - Boolean claims: `age_over_18: true` instead of sharing exact Date of Birth.
  - Status claims: `license_valid: true` instead of sharing full address or RTO codes.
- [ ] **Interactive Share Studio**:
  - 1-click presets matching the landing page screenshots.
  - Dynamic duration slider (1 min, 5 min, 15 min, 1 hr, 24 hr).
  - Signed with Ed25519 (`jose`), with public verification endpoint `/v/[token]`.

### **Phase 3: Real-Time Audit Log & Tamper-Proof SHA-256 Chain**
- [ ] **Cryptographic Hash Chain**:
  - `Hash(N) = SHA256(Hash(N-1) + Timestamp + Action + DocumentId + Nonce)`
- [ ] **Visual Chain Verifier**:
  - User clicks *"Verify Hash Chain"*: a cybernetic scanner runs across all entries, calculating SHA-256 hashes in real time and confirming:
    `✓ Verified · Chain Intact · 0 Tampering Detected`.
- [ ] **Export Audit Report**: Download cryptographic proof log as JSON or formatted text.

### **Phase 4: Fortress Security Tools (Shredder, Anti-Screenshot, Envelope Encryption)**
- [ ] **1-Tap Shredder (`Delete Mode: Secure Wipe`)**:
  - Emergency modal requiring confirmation.
  - Securely overwrites DEKs, wipes document records, deletes sessions, clears local cache, and signs out.
- [ ] **Anti-Screenshot & Shoulder-Surfing Defense**:
  - Window blur listener: when user tabs out or switches apps, all ID documents immediately blur with a cyber shield overlay.
  - CSS `@media print { display: none !important; }` blocking print/save-as-PDF of raw credentials.
- [ ] **Envelope Encryption Guarantee**:
  - AES-256-GCM encryption with unique salt and initialization vector (IV) for every document.

### **Phase 5: Seamless UI/UX Polish (Apple/Linear Aesthetic)**
- [ ] **Design Language**:
  - Dark titanium `#020617` and obsidian `#000000`, frosted glass squircles, fluid micro-interactions, sound feedback (`sound.playPop()`, `sound.playFlip()`).
- [ ] **Mobile Responsive & 120Hz ProMotion**:
  - Full touch gesture optimization and zero-lag scroll.
