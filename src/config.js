const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.PROD ? '' : 'https://api.eitherway.ai');

export const DIALECT_PROXY = `${API_BASE_URL}/api/dialect`;
export const DFLOW_PROXY = `${API_BASE_URL}/api/dflow`;
export const SOLANA_RPC_PROXY = `${API_BASE_URL}/api/solana/rpc`;
export const SOLANA_DEVNET_RPC = 'https://api.devnet.solana.com';

export const JUPITER_QUOTE_API = 'https://quote-api.jup.ag/v6/quote';
export const JUPITER_SWAP_API = 'https://quote-api.jup.ag/v6/swap';

export const TOKENS = {
  SOL: {
    symbol: 'SOL',
    name: 'Solana',
    mint: 'So11111111111111111111111111111111111111112',
    decimals: 9,
    logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
  },
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    decimals: 6,
    logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
  },
  USDT: {
    symbol: 'USDT',
    name: 'Tether',
    mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    decimals: 6,
    logo: 'https://coin-images.coingecko.com/coins/images/325/small/Tether.png',
  },
  JUP: {
    symbol: 'JUP',
    name: 'Jupiter',
    mint: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
    decimals: 6,
    logo: 'https://static.jup.ag/jup/icon.png',
  },
  BONK: {
    symbol: 'BONK',
    name: 'Bonk',
    mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
    decimals: 5,
    logo: 'https://arweave.net/hQiPZOsRZXGXBJd_82PhVdlM_hACsT_q6wqwf5cSY7I',
  },
  WIF: {
    symbol: 'WIF',
    name: 'dogwifhat',
    mint: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm',
    decimals: 6,
    logo: 'https://coin-images.coingecko.com/coins/images/33566/small/dogwifhat.jpg',
  },
  JTO: {
    symbol: 'JTO',
    name: 'Jito',
    mint: 'jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL',
    decimals: 9,
    logo: 'https://storage.googleapis.com/token-metadata/JitoSOL-256.png',
  },
  RAY: {
    symbol: 'RAY',
    name: 'Raydium',
    mint: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
    decimals: 6,
    logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R/logo.png',
  },
  MSOL: {
    symbol: 'mSOL',
    name: 'Marinade Staked SOL',
    mint: 'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So',
    decimals: 9,
    logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So/logo.png',
  },
  JITOSOL: {
    symbol: 'jitoSOL',
    name: 'Jito Staked SOL',
    mint: 'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn',
    decimals: 9,
    logo: 'https://storage.googleapis.com/token-metadata/JitoSOL-256.png',
  },
  BSOL: {
    symbol: 'bSOL',
    name: 'BlazeStake Staked SOL',
    mint: 'bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1',
    decimals: 9,
    logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1/logo.png',
  },
  ORCA: {
    symbol: 'ORCA',
    name: 'Orca',
    mint: 'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE',
    decimals: 6,
    logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE/logo.png',
  },
  RENDER: {
    symbol: 'RENDER',
    name: 'Render Token',
    mint: 'rndrizKT3MK1iimdxRdWabcF7Zg7AR5T4nud4EkHBof',
    decimals: 8,
    logo: 'https://coin-images.coingecko.com/coins/images/11636/small/rndr.png',
  },
  MNDE: {
    symbol: 'MNDE',
    name: 'Marinade',
    mint: 'MNDEFzGvMt87ueuHvVU9VcTqsAP5b3fTGPsHuuPA5ey',
    decimals: 9,
    logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/MNDEFzGvMt87ueuHvVU9VcTqsAP5b3fTGPsHuuPA5ey/logo.png',
  },
  WEN: {
    symbol: 'WEN',
    name: 'Wen',
    mint: 'WENWENvqqNya429ubCdR81ZmD69brwQaaBYY6p3LCpk',
    decimals: 5,
    logo: 'https://coin-images.coingecko.com/coins/images/34856/small/wen.jpeg',
  },
  SAMO: {
    symbol: 'SAMO',
    name: 'Samoyed Coin',
    mint: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    decimals: 9,
    logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU/logo.png',
  },
};

export const TOKEN_LIST = Object.values(TOKENS);

// ── Prediction market outcome tokens ──────────────────────────────────────────
const JITOSOL = {
  symbol: 'jitoSOL',
  name: 'Jito Staked SOL',
  mint: 'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn',
  decimals: 9,
  logo: 'https://storage.googleapis.com/token-metadata/JitoSOL-256.png',
}

const MSOL = {
  symbol: 'mSOL',
  name: 'Marinade Staked SOL',
  mint: 'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So',
  decimals: 9,
  logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So/logo.png',
}

export const PREDICTION_MARKETS = [
  {
    id: 'jito-lst-dominance',
    question: 'Will Jito maintain liquid staking dominance through Q4 2025?',
    category: 'DeFi',
    resolvesAt: '2025-12-31',
    probability: 0.68,
    volume24h: 482_000,
    yesToken: JITOSOL,
    noToken: MSOL,
  },
  {
    id: 'jupiter-dex-lead',
    question: 'Will Jupiter remain the #1 Solana DEX by volume through Q3 2025?',
    category: 'DEX',
    resolvesAt: '2025-09-30',
    probability: 0.74,
    volume24h: 1_240_000,
    yesToken: TOKENS.JUP,
    noToken: TOKENS.RAY,
  },
  {
    id: 'memecoin-season',
    question: 'Will Solana memecoins return to Dec 2024 peak volume by Q3 2025?',
    category: 'Memecoins',
    resolvesAt: '2025-09-30',
    probability: 0.31,
    volume24h: 218_000,
    yesToken: TOKENS.BONK,
    noToken: TOKENS.USDC,
  },
  {
    id: 'wif-ath',
    question: 'Will WIF reach a new all-time high within 2025?',
    category: 'Memecoins',
    resolvesAt: '2025-12-31',
    probability: 0.42,
    volume24h: 95_000,
    yesToken: TOKENS.WIF,
    noToken: TOKENS.JTO,
  },
]
