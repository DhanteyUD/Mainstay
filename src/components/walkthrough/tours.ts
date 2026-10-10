import {
  TAB_MAIN_LIMIT,
  TAB_MAIN_PREDICT,
  TAB_MAIN_SWAP,
} from "../../constants";

export const TOUR_SHEET_EVENT = "mainstay:tour-sheet";

export type TourId = "app" | "predict";

export interface TourStep {
  target?: string;
  title: string;
  body: string;
  tab?: string;
  sheet?: "open" | "closed";
}

export const TOURS: Record<
  TourId,
  { label: string; blurb: string; steps: TourStep[] }
> = {
  app: {
    label: "Tour of Mainstay",
    blurb: "Swaps, limit orders, alerts and more in 1 minute",
    steps: [
      {
        title: "Welcome to Mainstay",
        body: "Mainstay swaps tokens on Solana without letting bots sandwich or front-run you. This quick tour shows the key parts. You can stop any time.",
        tab: TAB_MAIN_SWAP,
      },
      {
        target: "wallet",
        title: "Your wallet",
        body: "Your balance and portfolio value live here. Send and receive tokens, and hide your balance with the eye icon.",
      },
      {
        target: "tab-swap",
        title: "Token Swap",
        body: "Swap any token pair. Every mainnet swap is routed through DFlow's auction, so it never sits in the public mempool where bots hunt.",
        tab: TAB_MAIN_SWAP,
      },
      {
        target: "swap-panel",
        title: "Check the risk before you trade",
        body: "Enter an amount to get a quote. Mainstay scores the MEV risk (low, medium, high) and after the trade grades how well it executed.",
        tab: TAB_MAIN_SWAP,
      },
      {
        target: "chart",
        title: "Live price chart",
        body: "A TradingView chart for the pair you're trading, so you can pick your moment.",
      },
      {
        target: "tab-limit",
        title: "Limit orders",
        body: "Set a target price and Mainstay executes for you when the market gets there, with the same sandwich protection.",
        tab: TAB_MAIN_LIMIT,
      },
      {
        target: "telegram",
        title: "Telegram alerts",
        body: "Connect Telegram to get a message when a limit order hits its target, executes or fails, and set price alerts on any token. Works even when Mainstay is closed.",
        tab: TAB_MAIN_LIMIT,
      },
      {
        target: "tab-predict",
        title: "Prediction markets",
        body: "Bet on real-world events with Yes/No tokens, using real USDC. Want the full explanation? Open the Guide menu and pick the prediction markets walkthrough.",
        tab: TAB_MAIN_PREDICT,
      },
      {
        target: "right-panel",
        title: "Protection and history",
        body: "See how DFlow protects your trades, and review every swap, limit order and transfer in your history.",
        tab: TAB_MAIN_SWAP,
      },
      {
        title: "You're set",
        body: "Reopen this any time from the Guide button in the top bar.",
      },
    ],
  },
  predict: {
    label: "How prediction markets work",
    blurb: "Bet Yes/No on real events, step by step",
    steps: [
      {
        target: "predict-panel",
        title: "Bet on what happens next",
        body: "Each market is a yes/no question about the real world: an election, a rate decision, a game. You pick a side. If you're right, each token you hold pays $1.",
        tab: TAB_MAIN_PREDICT,
      },
      {
        target: "predict-search",
        title: "Find a question",
        body: "Search, or tap a category to narrow the list. Markets with the most trading appear first.",
        tab: TAB_MAIN_PREDICT,
      },
      {
        target: "predict-card",
        sheet: "closed",
        title: "Read the card",
        body: "Each card shows what Yes and No cost right now. A Yes token at 62¢ pays $1 if you're right, so cheaper tokens win more but are less likely. Tap Yes or No to bet.",
        tab: TAB_MAIN_PREDICT,
      },
      {
        target: "bet-amount",
        title: "Choose your amount",
        body: "Tapping Yes or No opens a bet sheet like this one. Type how much to bet, or use the $5, $10, $25 and $50 shortcuts below it.",
        tab: TAB_MAIN_PREDICT,
        sheet: "open",
      },
      {
        target: "bet-outcomes",
        title: "See what you win or lose",
        body: "The green box is your gain if you're right, the red box your loss if you're wrong. They come from the live price including fees, and you can never lose more than you bet.",
        tab: TAB_MAIN_PREDICT,
        sheet: "open",
      },
      {
        target: "bet-protection",
        title: "Protected from sandwiches",
        body: "Your bet is filled through DFlow's auction, not the public mempool, so bots can't see it and trade around it.",
        tab: TAB_MAIN_PREDICT,
        sheet: "open",
      },
      {
        target: "bet-confirm",
        title: "Verify once, then place it",
        body: "This button does the next step. The first time it asks for a one-time identity check (Proof by DFlow); after that it places your bet and your wallet asks you to approve once.",
        tab: TAB_MAIN_PREDICT,
        sheet: "open",
      },
      {
        target: "predict-bets",
        sheet: "closed",
        title: "Your bets",
        body: "Everything you hold lives under My bets. When a market settles, winners get a Collect button that pays $1 per token to your wallet. Losing tokens expire.",
        tab: TAB_MAIN_PREDICT,
      },
    ],
  },
};
