# Architectural & Engineering Decisions (DECISIONS.md)

This log documents all architectural and engineering decisions made during the development of "White Card", adhering strictly to the free-tier and zero-paid-dependency rule.

| Date | Topic | Decision | Rationale |
|---|---|---|---|
| 2026-10-01 | Project Scaffold | Next.js 14+ App Router, TypeScript strict, Tailwind CSS | Modern standard for fullstack React apps, optimal for Vercel Hobby hosting. |
| 2026-10-01 | Database Layer | MongoDB official `mongodb` driver with cached connection pooling | Official driver works seamlessly with MongoDB Atlas M0 (free 512MB shared cluster). In-memory mock fallback provided for testing environments without an active cluster. |
| 2026-10-01 | Email Delivery | Swappable adapter supporting Resend (free tier) and Brevo (free SMTP tier via Nodemailer) | Both provide generous free tiers for transactional email without credit card requirements. Fallback to console logger in development when keys are omitted. |
| 2026-10-01 | Key Management | Node.js `crypto` with HKDF and AES-256-GCM envelope encryption | Per-user Data Encryption Keys (DEKs) wrapped by an environment `MASTER_KEY`. Avoids paid KMS while maintaining cryptographic isolation. |
| 2026-10-01 | Share Tokens | Ed25519 asymmetric signatures via `jose` library | Fast, compact, secure signatures matching modern cryptographic standards, exposed via standard JWKS (`/.well-known/jwks.json`). |
| 2026-10-01 | Rate Limiting | MongoDB TTL-indexed counters (`rate_limits` collection) | Avoids requiring an external paid Redis service (like Upstash) while providing atomic distributed rate limiting on free Atlas M0. |
| 2026-10-01 | Audit Hash Chain | SHA-256 forward hash chain on unique sequential index | Free MongoDB tiers do not provide hardware append-only write restrictions; mathematical hash chaining provides deterministic tamper-evidence verifiable via `GET /api/audit/verify`. |
| 2026-10-01 | Sound Synthesis | Web Audio API (`AudioContext`) oscillator tones | 0 external audio files/bandwidth needed; short, pleasant micro-interactions with persistent mute preference. |
