# TrustLoop

**Good work deserves to be trusted.** *Powered by Roqqu.*

TrustLoop lets a freelancer and a hirer agree on a job, fund it, and pay out the moment the work is approved. Every paid job becomes a signed credential that anyone can verify, so a young freelancer's work history becomes proof instead of a claim.

Live site: https://trust-loop-theta.vercel.app


## The problem

In Anambra, young freelancers and small businesses have no safe way to agree on work. Freelancers fear not being paid. Hirers fear paying for nothing. And a student's past work has nothing behind it that a new client can check.

## How it works

1. A hirer posts a job with a reward and funds it. The money is committed before work starts.
2. Freelancers apply. The hirer reviews their Trust Passports and accepts one.
3. The freelancer submits work with an evidence link.
4. The hirer approves it, or asks for changes with a note.
5. On approval the reward is paid instantly into the freelancer's wallet, and a credential is issued.
6. The credential joins the freelancer's public Trust Passport. Anyone can open its verify page or scan its QR code and check it.

## Key features

- **Funded jobs and instant payout.** Funds are locked in a ledger when a job is funded and released on approval. Ledger entries have unique references, so a payment cannot be counted twice.
- **Signed credentials.** Each credential is canonical JSON, hashed and signed with Ed25519. The public verify page at `/verify/[id]` recomputes the hash and checks the signature, so any edit fails verification. It also shows the payment mode (sandbox or live) and states honestly that the credential is not anchored on-chain yet.
- **Trust Passport.** A public page at `/p/[id]` listing a person's verified work, with a short bio and a QR code. Earnings are never shown.
- **Work done elsewhere.** Freelancers can add outside work, labelled by evidence level: Self-reported, Link checked, Confirmed by a referee, or Disputed. A referee confirms through a private link at `/attest/[token]`.
- **Wallet.** Every user has a wallet with a transaction history, multi-network deposit addresses, and withdrawals that show the fee before the user confirms.
- **Notifications** for applications, submissions, revision requests, approvals and payments.
- **Admin dashboard** at `/admin/roqqu`: payment mode, webhook activity, top-ups, and platform revenue against what users earned.

## Roqqu integration

Roqqu is the payment rail. TrustLoop is the trust layer on top of it.

| Roqqu capability | How TrustLoop uses it |
| --- | --- |
| Payment links | Hirers top up their wallet |
| Wallet addresses | Every user gets deposit addresses on supported networks |
| Send | Freelancers withdraw to their own wallet |
| Webhooks | Payments are confirmed automatically |
| Rates and fees | Shown to the user before they confirm |

Roqqu has no escrow product, so locked job funds are tracked in TrustLoop's own ledger. Cash-out is USDT to the user's wallet.

**Simulation first.** Roqqu's sandbox keys grant simulations, and live calls from our server were blocked by Roqqu's Cloudflare protection during the hackathon. So the complete money flow runs on a clearly labelled simulator built to Roqqu's documented formats. The webhook receiver (AES-256-CTR encrypted payloads) is tested with properly encrypted events using `scripts/simulate-roqqu-webhook.mjs`. Going live is a settings change, not a rebuild. Simulated transactions are always labelled and never described as real money.

## Business model

Joining, posting jobs, applying and earning are free. TrustLoop keeps **2% when a freelancer withdraws**, shown to the user before they confirm. A 10,000 naira withdrawal costs 200 naira, and the freelancer receives 9,800. The rate is the `WITHDRAWAL_FEE_PERCENT` setting. The admin dashboard separates sandbox fees from real ones. Next: paid verification and team plans for organisations that hire often.

## Tech stack

- Next.js 16 (App Router, server actions), React 19, Tailwind CSS 4
- PostgreSQL on Neon, Prisma 6
- Ed25519 signing with Node crypto
- Deployed on Vercel

## Run it locally

Requires Node 20+ and a PostgreSQL database.

```bash
git clone https://github.com/Goodluck-creat/TrustLoop.git
cd TrustLoop
npm install
cp .env.example .env     # then fill in the values below
npx prisma migrate deploy
npx prisma generate
npm run dev
```

Open http://localhost:3000.

### Environment variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `SESSION_SECRET` | Long random string used to sign sessions |
| `APP_URL` | Public base URL of the app |
| `ADMIN_EMAILS` | Comma-separated emails allowed into the admin page |
| `WITHDRAWAL_FEE_PERCENT` | Withdrawal fee, default 2 |
| `NGN_PER_USDT` | Naira per USDT used for display, default 1500 |
| `PAYMENTS_MODE` | `live` to use Roqqu, otherwise the simulator |
| `ROQQU_ENV` | `live` to use live Roqqu credentials |
| `ROQQU_SECRET_KEY` | Roqqu API key (server only) |
| `ROQQU_BASE_URL` | Roqqu API base URL |
| `ROQQU_WEBHOOK_KEY` | Optional webhook decryption key |
| `PAYMENTS_FALLBACK` | `off` to show real provider errors instead of falling back |

With no Roqqu variables set, the app runs entirely on the simulator.

### Useful scripts

- `node scripts/simulate-roqqu-webhook.mjs <event> <reference>` sends a properly encrypted test webhook (set `WEBHOOK_TARGET` to the webhook URL).
- `node scripts/reset-data.mjs --keep=you@example.com --yes` clears test data and keeps the listed accounts.

## Security notes

- Passwords are hashed; sessions are signed with a server-side secret.
- Ownership is enforced inside database queries: only the hirer who owns a job can approve it or request changes, and only the assigned freelancer can submit work. Status changes are atomic, so repeated clicks cannot double-pay.
- Money changes run in serializable transactions with unique ledger references.
- Link checks for outside work block private and internal addresses (SSRF protection).
- Secret keys stay on the server and are never sent to the browser.
- Earnings and wallet balances are private; the public passport shows work only.

## Known limitations

- Roqqu live calls are not active yet; payments run on the simulator.
- No escrow at Roqqu, so locked funds are tracked in our ledger. No naira bank payout yet; cash-out is USDT.
- Credentials are signed but not yet anchored on a blockchain. The verify page says so.
- Not built yet: credential revocation, a dispute process, an audit log, password reset, and rate limiting on login.
- Outside work is labelled by evidence level but is not signed.

## Roadmap

1. Switch on live Roqqu payments.
2. Grow the pilot across schools and small businesses in Anambra, starting with Nawe Schools.
3. Escrow-style holds and a naira cash-out, with Roqqu.
4. Anchor credentials on a blockchain for extra proof.
5. Trust and safety: revocation, disputes, audit log, password reset.

