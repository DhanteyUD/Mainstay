<div align="center">

<img width="32" height="32" alt="favicon-32x32" src="https://github.com/user-attachments/assets/49cba721-2e6f-4b3f-abf0-70e82c035316" />

# Mainstay

**MEV-protected token swaps on Solana, powered by DFlow Protocol**

[![Live App](https://img.shields.io/badge/Live_App-mainstay.pro-0a0b0f?style=for-the-badge&logo=vercel&logoColor=00e5ff)](https://mainstay.pro)
[![Built on Eitherway](https://img.shields.io/badge/Built_on-Eitherway-0d00ff?style=for-the-badge)](https://eitherway.ai)
[![DFlow](https://img.shields.io/badge/Powered_by-DFlow-66c5f6?style=for-the-badge)](https://pond.dflow.net)
[![Solana](https://img.shields.io/badge/Network-Solana_Mainnet-9945FF?style=for-the-badge&logo=solana&logoColor=white)](https://solana.com)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

---

*Frontier Hackathon 2026 · DFlow Track · Superteam Earn*

</div>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [The Problem](#-the-problem)
- [Why Mainstay Beats the Alternatives](#-why-mainstay-beats-the-alternatives)
- [Features](#-features)
- [Architecture](#architecture)
- [How It Works](#-how-it-works)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running Locally](#running-locally)
- [Environment Variables](#-environment-variables)
- [Deployment](#-deployment)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)

---

## ⚓️ Overview

Mainstay is a non-custodial Solana DEX terminal that routes every swap through [DFlow Protocol's](https://dflow.net) order-flow auction network. This eliminates MEV (Maximal Extractable Value) attacks ` front-running, sandwich attacks, and back-running ` that silently drain value from retail traders on public mempools.

The interface also exposes real-time MEV risk scoring, execution grade analytics, limit orders, prediction market outcome-token trading, token transfers, and a full trade history dashboard — all in a single terminal-inspired UI.

> *A mainstay is the most critical structural support on a ship. Without it, the mast falls, and the vessel loses direction. Mainstay is that support for your trades.*

---

## 🎯 The Problem

MEV (Maximal Extractable Value) bots extracted an estimated **$370M–$500M** from Solana traders over the past 16 months through sandwich attacks — and traders have zero visibility into how much they're losing.

**How a sandwich attack works:**

```
1. You broadcast a swap → SOL to USDC
2. MEV bot spots your transaction in the mempool
3. Bot front-runs → buys SOL first, drives price up
4. Your trade executes at the worst price
5. Bot sells immediately → pockets the difference
6. You never see what happened
```

Every other tool protects you silently. You have no idea how close the bots got, how much they took, or how clean your execution was.

**Mainstay changes that. We show you the receipt.**

---

## 🏆 Why Mainstay Beats the Alternatives

Jupiter already routes through DFlow — so why use Mainstay?

Because **Jupiter protects you and says nothing.** Mainstay protects you and **proves it.**

- **Before your trade** → MEV risk score tells you exactly how exposed you are
- **During execution** → DFlow JIT routes your order through a sealed-bid auction that MEV bots can't front-run
- **After confirmation** → Execution quality card shows actual vs quoted price, slippage delta, and dollar savings

The cumulative savings dashboard turns individual receipts into a running total of everything MEV has tried — and failed — to take from you.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🛡️ **MEV-Protected Swaps** | All mainnet swaps route through DFlow's JIT auction, bypassing the public mempool |
| 📊 **MEV Risk Scoring** | Per-trade risk assessment based on order size, pool liquidity, and network TPS |
| 🎯 **Limit Orders** | Price-triggered orders that monitor markets every 30 seconds and execute automatically |
| 🔮 **Prediction Markets** `Coming soon` | Trade outcome tokens (YES/NO) with the same MEV protection as spot swaps |
| 💼 **Portfolio Dashboard** | Real-time SOL balance, USD value, and trade count |
| 📜 **Trade History** | Full record of swaps, limit executions, sends, and received transfers |
| 📈 **Execution Grade** | Post-trade `A+` `–F` quality score based on slippage delta vs quoted price |
| 📤 **Send Tokens** | Transfer SOL or any SPL token with saved address book |
| 📥 **Deposit** | QR code and address copy for receiving tokens |
| 📡 **Network Status** | Live DFlow + Helius uptime and Solana TPS risk level |
| 🌐 **Devnet Mode** | Full feature parity on devnet via Jupiter routing (no real funds) |
| 📱 **PWA + Mobile** | Installable as a Progressive Web App; mobile wallet deep links for `Phantom` and `Solflare` |
| 🔐 **Auth** | Supabase-backed auth with Google, GitHub, and email/password |
| 🐛 **Feedback System** | In-app bug reports, feedback, and feature requests via Sentry |
| 🎨 **Customization** | Customize and re-arrange components how you like |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                Browser (React App)                  │
│                                                     │
│  SwapInterface → useSwap → DFlow Proxy → DFlow API  │
│  LimitOrders   → useLimitOrders → price polling     │
│  WalletBalance → useWalletBalance → Helius RPC      │
│  TradeHistory  → useTrades → Supabase               │
└────────────────────┬────────────────────────────────┘
                     │ relative /api/* requests
         ┌───────────▼────────────┐
         │  Vercel Edge (proxy)   │
         │  /api/dialect/*        │──► api.eitherway.ai (Jupiter prices)
         │  /api/dflow/*          │──► api.eitherway.ai (DFlow quotes/swaps)
         │  /api/solana/rpc       │──► Solana mainnet RPC
         └────────────────────────┘
```

> On **devnet**, the app routes directly through Jupiter v6's public API.
> 
> On **mainnet**, all quote and swap transactions go through the DFlow proxy, which provides private order routing and MEV protection.

---

## ⚙️ How It Works

Every trade passes through exactly **3 steps** — and MEV is blocked at all 3.

```
┌─────────────────────────────────────────────────────────────┐
│                     MAINSTAY FLOW                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Step 1: QUOTE                                              │
│  ──────────────                                             │
│  DFlow Quote API → best route + expected output             │
│  + Helius RPC → network congestion data                     │
│  → MEV Risk Score calculated (LOW / MEDIUM / HIGH)          │
│  → Risk badge displayed to trader                           │
│                                                             │
│  Step 2: SIGN                                               │
│  ─────────────                                              │
│  Trader confirms → wallet popup (Solflare / Phantom)        │
│  → Signed transaction sent to DFlow Trade API               │
│  → No order leaves without explicit approval                │
│                                                             │
│  Step 3: EXECUTE                                            │
│  ────────────────                                           │
│  DFlow JIT auction → market makers compete for your order   │
│  → Transaction confirmed on Solana mainnet                  │
│  → Helius RPC fetches the actual execution price            │
│  → Post-trade card generated (grade + savings)              │
│  → Trade saved to Supabase                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠 Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **App Platform** | [Eitherway](https://eitherway.ai) | Full-stack generation & deployment |
| **Swap Execution** | [DFlow Declarative Trade API](https://pond.dflow.net) | MEV-protected order routing |
| **Price Discovery** | DFlow Quote API | Pre-trade quotes & risk scoring |
| **Blockchain Data** | [Helius RPC](https://docs.helius.dev) | Fast on-chain confirmation & congestion |
| **Database** | [Supabase (PostgreSQL)](https://supabase.com) | Trade history, limit order, transactions & waitlists|
| **Wallet** | Solflare / Phantom | Transaction signing |
| **Deployment** | [Vercel](https://vercel.com) | Production hosting |
| **Network** | Solana Mainnet | All transactions are real on-chain |
| **Framework**      | React 18 + Vite 5                                     | Builds the UI and handles fast development with hot reload and optimized bundling |
| **Styling**        | Tailwind CSS 3                                        | Provides utility-first CSS for rapid, consistent UI design                        |
| **Animation**      | Framer Motion                                         | Handles smooth UI animations and transitions                                      |
| **Solana SDK**     | `@solana/web3.js`, `@solana/wallet-adapter-react`     | Enables blockchain interaction and wallet connectivity for Solana                 |
| **Wallet UI**      | `@solana/wallet-adapter-react-ui`                     | Provides prebuilt UI components for wallet connection flows                       |
| **Auth**           | Supabase Auth (Google, GitHub, email)                 | Manages user authentication and identity                                          |
| **Error tracking, Feedback, & Feature request** | [Sentry](https://sentry.io/)                                                | Monitors and logs runtime errors for debugging and stability, as well as user feedback                      |
| **Charts**         | TradingView widget                                    | Displays market charts and trading data visualization                             |
| **PWA**            | vite-plugin-pwa + Workbox                             | Enables offline support and installable app experience                            |


---

## 🚀 Getting Started

Mainstay is built and deployed via [Eitherway](https://eitherway.ai) — no local setup required to use the live app.

**To use Mainstay:**

1. Visit [mainstay.vercel.app](https://mainstay.vercel.app)
2. Connect your Solflare or Phantom wallet
3. Enter a token pair and amount
4. Check your MEV risk score
5. Swap — and get your receipt

**To extend or fork Mainstay:**

```bash
# Clone the repository
git clone https://github.com/username/mainstay.git
cd mainstay

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your keys (see Environment Variables below)

# Run locally
npm run dev
```

---

## 🔑 Environment Variables

Create a `.env` file in the root directory:

```env
# Supabase — trade history persistence
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Helius — fast Solana RPC
VITE_HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=your_key

# DFlow — swap execution (configured via Eitherway)
VITE_DFLOW_API_URL=https://api.dflow.net

# Network
VITE_SOLANA_NETWORK=mainnet-beta
```

> **Note:** When deploying to Vercel, add these as Environment Variables in your Vercel project settings. The app will crash on load without `VITE_SUPABASE_URL` — this is the most common deployment issue.

---

## 📦 Deployment

Mainstay deploys automatically via Vercel. To deploy your own instance:

### Via Eitherway (recommended)
1. Open [eitherway.ai/chat](https://eitherway.ai/chat)
2. Prompt: *"Deploy Mainstay to Vercel"*
3. Connect your Vercel account in Eitherway Settings → Services Hub
4. Eitherway handles build config and deployment automatically

### Via Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel env add VITE_HELIUS_RPC_URL

# Redeploy with env vars
vercel --prod
```

### `vercel.json` config
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "buildCommand": "npm run build",
  "outputDirectory": "dist"
}
```

---

## 🗺 Roadmap

### ✅ v1.0 — Hackathon Submission
- [x] MEV risk meter (LOW / MEDIUM / HIGH)
- [x] DFlow JIT swap execution on Solana mainnet
- [x] Post-trade execution quality card (A+ to F)
- [x] Trade history with Supabase persistence
- [x] Cumulative savings dashboard
- [x] Prediction markets tab
- [x] MEV education onboarding
- [x] Solflare + Phantom wallet support

### 🔄 v1.1 — Post-Hackathon
- [ ] Solflare transaction scanner whitelisting
- [ ] Telegram trade alerts for watched tokens
- [ ] Mobile-optimised layout
- [ ] Expanded token pair support

### 🔮 v2.0 — Q3 2026
- [ ] TWAP execution — split large orders over time
- [ ] Limit orders with DFlow-protected execution
- [ ] Multi-wallet portfolio aggregation
- [ ] MEV analytics dashboard — market-wide Solana data
- [ ] Mainstay API — let other dApps integrate risk scoring

### 🌐 Long Term
- [ ] Cross-chain expansion (EVM)
- [ ] On-chain execution quality reputation system
- [ ] Mainstay Score — public benchmark for Solana DEX execution quality
- [ ] Institutional tier with custom fee structures

---

## 🐛 Known Issues

| Issue | Status | Workaround |
|-------|--------|-----------|
| Solflare security scanner warning | Known false positive | Click through or use Phantom |
| Transaction timeout on first attempt | Network latency | Click "Refresh & retry" |
| Supabase env vars on Vercel | Resolved v1.0 | Set vars in Vercel dashboard |
| Token selector z-index on mobile | Resolved v1.0 | Fixed in current build |
| InstructionError Custom:15001 on retry | Stale quote | Wait for balance refresh, retry |

> **Solflare scanner note:** Solflare's security scanner flags DFlow-routed transactions as unrecognised. This is a false positive — the transaction is safe. Mainstay displays an advisory notice before the wallet popup. We are in the process of submitting Mainstay for formal Solflare verification.

---

## 🤝 Contributing

Contributions are welcome. Please open an issue first to discuss what you'd like to change.

```bash
# Fork the repo
# Create a feature branch
git checkout -b feature/your-feature-name

# Make your changes
# Commit with a clear message
git commit -m "feat: add [feature description]"

# Push and open a PR
git push origin feature/your-feature-name
```

**Commit convention:**
```
feat:     new feature
fix:      bug fix
docs:     documentation changes
style:    formatting, no logic change
refactor: code restructure, no feature change
test:     adding tests
chore:    build process, dependencies
```

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgements

- [DFlow](https://dflow.net) — for building the MEV-resistant execution layer that makes Mainstay possible
- [Helius](https://helius.dev) — for fast, reliable Solana RPC and blockchain data
- [Supabase](https://supabase.com) — for seamless trade history persistence
- [Eitherway](https://eitherway.ai) — for the platform that made building this possible in days, not months
- [Solflare](https://solflare.com) — for the recommended wallet integration
- [Superteam](https://superteam.fun) — for the Frontier Hackathon

---

<div align="center">

**⚓ Mainstay**

*The mainstay of clean execution on Solana*

**Stay clean.**

[![Live App](https://img.shields.io/badge/Try_Mainstay-mainstay.vercel.app-00C2A8?style=for-the-badge)](https://mainstay.vercel.app)

Built with ❤️ on [Eitherway](https://eitherway.ai) · Powered by [DFlow](https://dflow.net) · Running on [Solana](https://solana.com)

</div>
