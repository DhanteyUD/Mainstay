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

- [Overview](#️-overview)
- [The Problem](#-the-problem)
- [Why Mainstay Beats the Alternatives](#-why-mainstay-beats-the-alternatives)
- [Features](#-features)
- [Architecture](#️-architecture)
- [How It Works](#️-how-it-works)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
  - [Prerequisites](#-prerequisites)
  - [Installation](#-installation)
  - [Environment Variables](#-environment-variables)
  - [Running Locally](#-running-locally)
- [Project Structure](#-project-structure)
- [Key Concepts](#️-key-concepts)
  - [MEV Protection via DFlow](#️-mev-protection-via-dflow)
  - [Network Modes (Mainnet / Devnet)](#-network-modes-mainnet--devnet)
  - [Proxy Architecture](#️-proxy-architecture)
- [DFlow Integration](#-dflow-integration)
  - [Quote API](#quote-api)
  - [Declarative Trade API](#declarative-trade-api)
  - [Priority Fee Escalation](#priority-fee-escalation)
  - [Platform Fee](#platform-fee)
- [Features In Detail](#-features-in-detail)
  - [Token Swap](#-token-swap)
  - [Limit Orders](#-limit-orders)
  - [Prediction Markets (devnet)](#-prediction-markets-devnet)
  - [Wallet Card & Portfolio](#-wallet-card--portfolio)
  - [Trade History](#-trade-history)
  - [MEV Risk Badge](#️-mev-risk-badge)
  - [Network Status](#-network-status)
  - [Send & Deposit](#-send--deposit)
  - [Onboarding](#-onboarding)
  - [PWA Support](#-pwa-support)
- [Deployment](#-deployment)
  - [Via Vercel CLI](#-via-vercel-cli)
  - [Environment Variables in Production](#-environment-variables-in-production)
  - [API Proxy Setup](#️-api-proxy-setup)
- [Integrations](#-integrations)
- [Telegram Alerts](#-telegram-limit-order-alerts)
- [Supabase Schema](#️-supabase-schema)
- [Roadmap](#-roadmap)
  - [v1.0 — Hackathon Submission](#-v10--hackathon-submission)
  - [v1.1 — Post-Hackathon](#-v10--hackathon-submission)
  - [v2.0 — Q3 2026](#-v20--q3-2026)
  - [Long Term](#-long-term)
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

```text
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
| --- | --- |
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

```bash
┌─────────────────────────────────────────────────────┐
│                Browser (React App)                  │
│                                                     │
│  SwapInterface → useSwap → /api/dflow → DFlow API   │
│  LimitOrders   → useLimitOrders → Jupiter prices    │
│  WalletBalance → useWalletBalance → Helius RPC      │
│  TradeHistory  → useTrades → Supabase               │
└────────────────────┬────────────────────────────────┘
                     │ relative /api/* requests
         ┌───────────▼────────────┐
         │ Vercel Functions       │
         │  /api/dflow/order      │──► DFlow Quote API (adds DFLOW_API_KEY)
         │  /api/solana/rpc       │──► Solana mainnet RPC (SOLANA_RPC_URL)
         └────────────────────────┘

Jupiter prices (lite-api.jup.ag) are fetched directly from the browser.
```

> On **devnet**, the app routes directly through Jupiter v6's public API.
>
> On **mainnet**, all quote and swap transactions go through the `/api/dflow/order` function, which provides private order routing and MEV protection.

---

## ⚙️ How It Works

Every trade passes through exactly **3 steps** — and MEV is blocked at all 3.

```bash
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
| --- | --- | --- |
| **App Platform** | [Eitherway](https://eitherway.ai) | Full-stack generation & deployment |
| **Swap Execution** | [DFlow Declarative Trade API](https://pond.dflow.net) | MEV-protected order routing |
| **Price Discovery** | DFlow Quote API | Pre-trade quotes & risk scoring |
| **Blockchain Data** | [Helius RPC](https://docs.helius.dev) | Fast on-chain confirmation & congestion |
| **Database** | [Supabase (PostgreSQL)](https://supabase.com) | Trade history, limit order, transactions & waitlists |
| **Email Service** | [Resend](https://resend.com/) | For prediction market waitlist registration |
| **Wallet** | Solflare / Phantom | Transaction signing |
| **Deployment** | [Vercel](https://vercel.com) | Production hosting |
| **Network** | Solana Mainnet | All transactions are real on-chain |
| **Language** | TypeScript 6 | End-to-end type safety across all components, hooks, and utilities |
| **Framework** | React 19 + Vite 5 | Builds the UI and handles fast development with hot reload and optimized bundling |
| **Styling** | Tailwind CSS 3 | Provides utility-first CSS for rapid, consistent UI design |
| **Animation** | Framer Motion + GSAP | Framer Motion handles component transitions; GSAP drives complex sequences on the landing page and onboarding |
| **Data Fetching** | `@tanstack/react-query` v5 | Server-state management, automatic caching, and query invalidation for trade history |
| **HTTP Client** | `axios` | API requests to DFlow and Jupiter endpoints with timeout and error handling |
| **Notifications** | `react-toastify` | Non-blocking toast notifications for trade confirmations, limit order events, and errors |
| **Solana SDK** | `@solana/web3.js`, `@solana/wallet-adapter-react` | Enables blockchain interaction and wallet connectivity for Solana |
| **Wallet UI** | `@solana/wallet-adapter-react-ui` | Provides prebuilt UI components for wallet connection flows |
| **Auth** | Supabase Auth (Google, GitHub, email) | Manages user authentication and identity |
| **Error tracking, Feedback, & Feature request** | [Sentry](https://sentry.io/) | Monitors and logs runtime errors for debugging and stability, as well as user feedback |
| **Charts** | TradingView widget | Displays market charts and trading data visualization |
| **PWA** | vite-plugin-pwa + Workbox | Enables offline support and installable app experience |

---

## 🚀 Getting Started

The live app needs no setup. To run your own instance, see the steps below.

**To use Mainstay:**

1. Visit [mainstay.pro](https://mainstay.pro)
2. Connect your Solflare or Phantom wallet
3. Enter a token pair and amount
4. Check your MEV risk score
5. Swap — and get your receipt

### 🪜 Prerequisites

- **Node.js** ≥ 20
- **npm** or **yarn**
- A [Supabase](https://supabase.com) project (optional — app works without it, but trade history and auth are disabled)
- A [Helius](https://helius.dev) API key (optional — falls back to public RPC)
- A [DFlow](https://pond.dflow.net) API key (optional — without it the keyless dev quote host is used, limited to 60 req/min)

### 👨🏾‍💻 Installation

```bash
# Clone the repository
git clone https://github.com/DhanteyUD/Mainstay.git
cd mainstay

# Install dependencies
npm install
```

### 🔑 Environment Variables

Copy the example file and fill in your values:

```bash
cp .env.example .env.development

# Run locally
npm run dev
```

| Variable | Required | Description |
| --- | --- | --- |
| `VITE_APP_ENVIRONMENT` | ✅ | `development` or `production` |
| `VITE_APP_URL` | ✅ | Your deployed app URL (e.g. `https://mainstay.pro`) |
| `VITE_SUPABASE_URL` | ⚠️ | Supabase project URL — enables auth and trade history |
| `VITE_SUPABASE_ANON_KEY` | ⚠️ | Supabase anon key |
| `VITE_HELIUS_RPC_URL` | ⚠️ | Helius RPC endpoint — improves balance reliability |
| `VITE_SOLANA_RPC_URL` | ➖ | Mainnet RPC used in local dev (defaults to publicnode) |
| `SOLANA_RPC_URL` | ⚠️ | Server-side mainnet RPC used by `/api/solana/rpc` — set a Helius URL in production |
| `DFLOW_API_KEY` | ⚠️ | Server-side DFlow key used by `/api/dflow/order` — falls back to the dev host if unset |
| `VITE_SENTRY_DSN` | ➖ | Sentry DSN for error tracking |
| `VITE_AUTH_REDIRECT_URL` | ➖ | OAuth redirect URL |
| `SENTRY_ORG` | ➖ | Sentry org slug (build-time) |
| `SENTRY_PROJECT` | ➖ | Sentry project name (build-time) |
| `SENTRY_AUTH_TOKEN` | ➖ | Sentry auth token for source maps |

> **Note:**
>
> The app degrades gracefully without Supabase — swapping works fully, but trade history, limit order persistence across sessions, and authentication are disabled.
>
> When deploying to Vercel, add these as Environment Variables in your Vercel project settings.

### 🔌 Running Locally

```bash
# Development (devnet by default)
npm run dev

# Production build preview
npm run build
npm run preview
```

The dev server starts at `http://localhost:5173`. In development the browser calls Jupiter and DFlow's public dev host directly; Vite's proxy only handles the Sentry tunnel.

---

##  🎢 Project Structure

```bash
mainstay/
├── api/                                            # Vercel serverless functions
│   └── sentry-tunnel.js                            # Sentry error tunnel proxy
├── public/                                         # Static assets, PWA icons
├── scripts/                                        # Browser debug scripts (injected in index.html)
│   ├── component-inspector.js
│   ├── runtime-error-reporter.js
│   └── vite-error-monitor.js
├── src/
│   ├── assets/                                     # Logo, wallet images
│   ├── components/                                 # All UI components
│   │   ├── AppHeader.tsx
│   │   ├── AppFooter.tsx
│   │   ├── SwapInterface.tsx                       # Main swap terminal
│   │   ├── SwapConfirmation.tsx                    # Swap confirmation screen
│   │   ├── LimitOrderForm.tsx                      # Limit order placement
│   │   ├── LimitOrderList.tsx                      # Pending/executed orders
│   │   ├── PredictionMarketsInterface.tsx
│   │   ├── PostTradeCard.tsx                       # Execution analytics modal
│   │   ├── TradeHistory.tsx                        # Full history dashboard
│   │   ├── WalletCard.tsx                          # Portfolio overview
│   │   ├── StatCard.tsx                            # Reusable stat display card
│   │   ├── MevRiskBadge.tsx                        # Per-quote risk indicator
│   │   ├── MobileWalletGateway.tsx                 # Mobile wallet deep-link gate
│   │   ├── PriceChart.tsx                          # TradingView chart
│   │   ├── TokenSelector.tsx                       # Token picker (mobile sheet + desktop panel)
│   │   ├── QuoteDisplay.tsx                        # Quote details breakdown
│   │   ├── SendModal.tsx                           # Token transfer flow
│   │   ├── DepositModal.tsx                        # QR deposit UI
│   │   ├── EdgeStatusCard.tsx                      # Floating network status cards
│   │   ├── OnboardingScreen.tsx
│   │   ├── LoginScreen.tsx
│   │   └── FeedbackModal.tsx
│   ├── config/
│   │   └── index.ts                                # CentraliZed env config
│   ├── config.ts                                   # API base URLs and token definitions
│   ├── constants/
│   │   ├── index.ts                                # Tab keys, style maps
│   │   └── wallets.ts                              # Wallet metadata (Phantom, Solflare)
│   ├── contexts/
│   │   └── NetworkContext.tsx                      # Mainnet/devnet toggle, RPC endpoint
│   ├── functions/
│   │   └── cn.ts                                   # Tailwind class merge utility
│   ├── hooks/
│   │   ├── useSwap.ts                              # Quote fetch + swap execution
│   │   ├── useLimitOrders.ts                       # Order management + price polling
│   │   ├── useMevRisk.ts                           # Per-quote MEV risk scoring
│   │   ├── useNetworkStats.ts                      # SOL price + TPS + uptime
│   │   ├── useTrades.ts                            # Supabase trade persistence
│   │   ├── useReceivedTransfers.ts                 # On-chain receive detection
│   │   ├── useTokens.ts                            # Token list management
│   │   ├── useWalletBalance.ts
│   │   ├── useSend.ts
│   │   ├── useSavedAddresses.ts
│   │   └── useJupiterTokens.ts
│   ├── lib/
│   │   ├── auth-context.tsx                        # Supabase Auth provider
│   │   ├── supabase.ts                             # Supabase client
│   │   ├── useSupabase.ts                          # Authenticated client hook
│   │   └── device.ts                               # Mobile / wallet browser detection
│   ├── App.tsx                                     # Root component + auth gate
│   ├── main.tsx                                    # React entry, wallet providers
│   ├── types.ts                                    # Shared TypeScript type definitions
│   ├── vite-env.d.ts                               # Vite environment type declarations
│   ├── index.css                                   # Global styles + wallet adapter overrides
│   └── sentry.ts                                   # Sentry initialisation
├── supabase/
│   └── functions/
│       └── send-waitlist-email/                    # Deno edge function (Resend email)
├── .env.example
├── tsconfig.json                                   # TypeScript project config
├── tsconfig.node.json                              # TypeScript config for Vite/Node tooling
├── vercel.json                                     # SPA fallback rewrite and API CORS headers
├── vite.config.ts
└── package.json
```

---

## 🗝️ Key Concepts

### 🛡️ MEV Protection via DFlow

On Solana's public mempool, bots can observe pending transactions and:

- **Front-run** — buy before your swap executes, pushing the price up
- **Sandwich** — buy before + sell after your swap, extracting the slippage difference
- **Back-run** — exploit the price impact your trade creates

DFlow solves this by routing orders through a **Just-In-Time (JIT) auction**: market makers compete in a sealed-bid auction to fill your order at a guaranteed price, and the transaction never touches the public mempool. Mainstay uses DFlow's quote-and-swap API exclusively on mainnet.

### 🪙 Network Modes (Mainnet / Devnet)

The active network is determined at build time by `VITE_APP_ENVIRONMENT`:

| Value | Network | Routing | MEV Protection |
| --- | --- | --- | --- |
| `production` | Solana Mainnet | DFlow JIT Auction | ✅ Active |
| `development` | Solana Devnet | Jupiter v6 | ❌ Disabled |

Devnet mode uses real Solana devnet transactions (no real funds) and routes via Jupiter's public API for full testing parity.

### 🏗️ Proxy Architecture

In production, requests that need server-side secrets go through Vercel Functions in `api/`:

| Path | Destination | Secret |
| --- | --- | --- |
| `/api/dflow/order` | DFlow Quote API (`quote-api.dflow.net`, or `dev-quote-api.dflow.net` without a key) | `DFLOW_API_KEY` |
| `/api/solana/rpc` | `SOLANA_RPC_URL` (defaults to `solana-rpc.publicnode.com`) | `SOLANA_RPC_URL` |

Jupiter prices (`lite-api.jup.ag/price/v3`) need no key and allow browser CORS, so they are fetched directly. In development, `src/config.ts` calls the DFlow dev host and the RPC directly, since Vercel Functions aren't running.

---

## 🔌 DFlow Integration

Mainstay is built **around** DFlow — not just on top. `4` API touchpoints:

### Quote API

```typescript
// Step 1 — Pre-trade price discovery + risk scoring input
GET /v1/quote
  ?inputMint=So11111111111111111111111111111111111111112
  &outputMint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
  &amount=10000000
  &slippageBps=20
```

### Declarative Trade API

```typescript
// Step 3 — MEV-protected swap execution
POST /v1/trade
{
  "inputMint": "So111...112",
  "outputMint": "EPjF...1v",
  "amount": 10000000,
  "userPublicKey": "wallet_public_key",
  "slippageBps": 20,
  "feeBps": 8,                                // 0.08% platform fee
  "priorityFeeLamports": 5000                 // auto-scaled: 1000 LOW / 5000 MED / 25000 HIGH
}
```

### Priority Fee Escalation

```typescript
// Auto-escalated based on MEV risk score
const priorityFee = {
  LOW:    1000,                               // lamports — standard protection
  MEDIUM: 5000,                               // lamports — elevated protection
  HIGH:   25000,                              // lamports — maximum protection
}[riskLevel];
```

### Platform Fee

```typescript
feeBps: 8  →  0.08% on all protected trades
Revenue model: volume-based, no smart contract needed
```

📚 **DFlow docs:** [pond.dflow.net/build/introduction](https://pond.dflow.net/build/introduction)

---

## 💅🏽 Features In Detail

### 🔃 Token Swap

The core interface (`SwapInterface.tsx`) supports:

- Any-to-any SPL token swaps from a curated list of 15+ tokens
- Real-time quote fetching with 600ms debounce
- `50%` and `MAX` balance shortcuts
- Animated flip button to reverse the token pair
- Post-swap execution analytics card with grade, MEV saved, and slippage delta
- Share-to-X trade card with canvas-generated image
- Solflare false-positive warning detection and user guidance

### ⏳ Limit Orders

The limit order system (`useLimitOrders.ts`) polls prices every 30 seconds and executes automatically when the target is hit:

- Place orders with a target USD price and direction (above/below)
- Current price must be confirmed before submission — prevents placing orders with an indeterminate trigger direction; button shows **"Fetching Price…"** while the live price is loading
- Visual progress bar tracking distance to target
- Status lifecycle: `pending → executing → executed / failed / cancelled`
- Order IDs use `crypto.randomUUID()` — collision-resistant and cryptographically random
- Persisted to Supabase with localStorage fallback; synced via `useEffect` to be React 19 Strict Mode compliant
- Separate order history tabs: All, Pending, Executed, Cancelled
- On devnet, executes via Jupiter; on mainnet, via DFlow

### 🌗 Prediction Markets (devnet)

Trade outcome tokens (YES/NO) for curated Solana ecosystem markets:

- Market probability meter with 24h volume
- Same DFlow MEV protection as spot swaps
- Dynamic priority fee scaling based on MEV risk level
- Outcome tokens are real SPL tokens (e.g. JUP vs RAY, jitoSOL vs mSOL)
- Waitlist signup for users on mainnet (launches soon)

### 💼 Wallet Card & Portfolio

- Live SOL balance in SOL and USD
- Balance hide/show toggle (persisted)
- Wallet-specific styling (Phantom purple, Solflare yellow)
- Trade count from Supabase history
- Quick access to Send and Deposit modals

### 📉 Trade History

Full dashboard with:

- Summary stats: total trades, total MEV saved, average execution grade, top trading pair
- Filter tabs: All, Spot, Prediction, Transfers
- Unified view of swaps, limit executions, sent tokens, and received tokens
- Received transfers detected on-chain via concurrent RPC parsing — up to 3 transactions parsed in parallel per poll to minimize latency
- Trade history fetched and cached with `@tanstack/react-query` — 30-second stale time, automatic re-fetch on window focus, instant invalidation after new trades
- Chronological sorting, Solscan explorer links
- Animation stagger capped at 300 ms so large histories (100+ trades) don't suffer delayed rendering

### ⚠️ MEV Risk Badge

Per-quote risk indicator computed from three signals:

| Signal | Weight | Scoring |
| --- | --- | --- |
| Order size (USD) | 0–40 pts | >$10k = HIGH |
| Pool liquidity | 0–40 pts | <$50k = HIGH |
| Network TPS | 0–20 pts | >3000 TPS = HIGH |

Total score ≥ 60 = HIGH, ≥ 35 = MEDIUM, < 35 = LOW. Explanation text is contextually generated based on the dominant signal.

### 🛜 Network Status

Two floating edge cards (desktop only) that show:

- **Risk Level** — derived from Solana TPS and DFlow API reachability
- **Network Uptime** — rolling success rate across DFlow price pings and Helius RPC calls, updated every 15–30 seconds

### 💸 Send & Deposit

**Send Modal:**

- Select any token from wallet balances
- Solana address validation with visual feedback
- Optional label saved to Supabase address book
- MAX amount shortcut with SOL reserve buffer (0.005 SOL)
- Confirmation screen with Solscan link

**Deposit Modal:**

- QR code generated from wallet address
- One-click copy
- Solscan explorer link

### 🎯 Onboarding

Three-step animated onboarding screen explaining:

1. What MEV is and how it affects traders
2. How a sandwich attack works (interactive diagram)
3. How DFlow's JIT auction protects your orders

Persisted to localStorage (`mev_shield_onboarding_v1`) — shown once per device.

### 📱 PWA Support

Mainstay is installable as a Progressive Web App:

- Standalone display mode
- Offline shell caching via Workbox
- Font caching (Google Fonts)
- Auto-update prompt on new deploys
- Mobile wallet deep links for Phantom and Solflare (opens app URL inside wallet browser)

---

## 📦 Deployment

Mainstay deploys automatically via Vercel. To deploy your own instance:

### 🔼 Via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

The functions in `api/` are deployed automatically. Set `DFLOW_API_KEY` and `SOLANA_RPC_URL` (below) for production-grade quote and RPC access.

### 🔑 Environment Variables in Production

Set these in your Vercel project dashboard under **Settings → Environment Variables**:

```
VITE_APP_ENVIRONMENT=production
VITE_APP_URL=https://your-domain.com
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=your-key
DFLOW_API_KEY=your-dflow-key
SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=your-key
VITE_AUTH_REDIRECT_URL=https://your-domain.com
VITE_SENTRY_DSN=https://xxx@ingest.de.sentry.io/xxx
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project
SENTRY_AUTH_TOKEN=your-token
```

### ⚙️ API Proxy Setup

`vercel.json` only contains the SPA fallback rewrite and CORS headers for `/api/*`. The proxies are serverless functions:

- `api/dflow/order.ts` forwards the quote query string to DFlow, attaching `x-api-key: $DFLOW_API_KEY`. With no key it targets the public dev host.
- `api/solana/rpc.js` forwards JSON-RPC bodies to `$SOLANA_RPC_URL`, so your RPC key never reaches the browser.

---

## 🔗 Integrations

| Service | Purpose | Docs |
| --- | --- | --- |
| **DFlow Protocol** | MEV-protected order routing | [dflow.net](https://dflow.net) |
| **Jupiter Aggregator** | Devnet swap routing + price data | [jup.ag](https://jup.ag) |
| **Helius** | High-reliability Solana RPC | [helius.dev](https://helius.dev) |
| **Supabase** | Auth, trade history, limit orders, address book | [supabase.com](https://supabase.com) |
| **Sentry** | Error tracking, user feedback | [sentry.io](https://sentry.io) |
| **TradingView** | Price charts | [tradingview.com](https://tradingview.com) |
| **Resend** | Waitlist confirmation emails | [resend.com](https://resend.com) |

---

## 🔔 Telegram Limit-Order Alerts

Users can connect a Telegram chat from the Limit tab and get alerts when an order's target is hit, executes or fails, even with the app closed. Orders and Telegram links are authorised by a wallet signature, and alerts are produced server-side (Supabase Edge Functions + `pg_cron`). Full architecture and setup: [docs/TELEGRAM_ALERTS.md](docs/TELEGRAM_ALERTS.md).

## ⚡️ Supabase Schema

The following tables are required for full functionality:

```sql
-- Mainnet trades
trades (id, wallet_address, trade_type, input_token_symbol, output_token_symbol,
        input_amount_raw, output_amount_raw, input_decimals, output_decimals,
        execution_grade, slippage_pct, mev_saved_usd, signature, explorer_url, created_at)

-- Devnet trades (same schema)
devTrades (...)

-- Limit orders
limitOrders (id, wallet_address, network, status, direction, input_token_mint,
             input_token_symbol, input_token_decimals, output_token_mint,
             output_token_symbol, output_token_decimals, input_amount, target_price,
             executed_at, signature, explorer_url, error, created_at)

devLimitOrders (...)

-- Saved recipient addresses
recipients (id, wallet_address, address, label, last_used_at)

-- Telegram alerts (server-side only, no public access)
telegram_links (wallet_address, chat_id, username, link_token_hash, link_expires_at, muted, ...)
notification_outbox (id, wallet_address, order_id, event, payload, sent_at, attempts, ...)

-- Prediction market waitlist
waitingList (id, email, created_at)
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
- [x] Mobile-optimized layout
- [x] Limit orders with DFlow-protected execution

### 🔄 v1.1 — Post-Hackathon

- [ ] Solflare transaction scanner whitelisting
- [ ] Telegram trade alerts for watched tokens
- [ ] Expanded token pair support
- [ ] Mainnet prediction markets

### 🔮 v2.0 — Q3 2026

- [ ] TWAP execution — split large orders over time
- [ ] Multi-wallet portfolio aggregation
- [ ] MEV analytics dashboard — market-wide Solana data

### 🌐 Long Term

- [ ] Cross-chain expansion (EVM)
- [ ] On-chain execution quality reputation system
- [ ] Mainstay Score — public benchmark for Solana DEX execution quality
- [ ] Institutional tier with custom fee structures
- [ ] Mainstay API — let other dApps integrate risk scoring

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

```bash
feat:     new feature
fix:      bug fix
docs:     documentation changes
style:    formatting, no logic change
refactor: code restructure, no feature change
test:     adding tests
chore:    build process, dependencies
```

Please keep PRs focused — one feature or fix per PR. Preserve existing code style (TypeScript throughout, `react-query` naming conventions, minimal-touch component changes).

---

## 📄 License

MIT License © 2025 Mainstay — see [LICENSE](LICENSE) for details.

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

**⛨ Mainstay**

*Protected DEX swaps on Solana*

**Stay clean.**

[![Live App](https://img.shields.io/badge/Try_Mainstay-mainstay.pro-00C2A8?style=for-the-badge)](https://mainstay.pro)

Built with ❤️ on [Eitherway](https://eitherway.ai) · Powered by [DFlow](https://dflow.net) · Running on [Solana](https://solana.com)

</div>
