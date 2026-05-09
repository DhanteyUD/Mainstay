export interface Token {
  symbol: string
  name: string
  mint: string
  decimals: number
  logo: string
  balance?: number
}

export type RiskLevel = 'HIGH' | 'MEDIUM' | 'LOW'

export interface MevRisk {
  level: RiskLevel
  score: number
  explanation: string
}

export interface SwapResult {
  signature: string
  inputAmount: string
  outputAmount: string
  inputToken: Token
  outputToken: Token
  slippageBps?: number
  quotedOutput?: string
  explorerUrl: string
}

export interface SendResult {
  signature: string
  explorerUrl: string
  token: Token | null
  amount: string
  recipient: string
}

export interface TradeRecord {
  id: string
  wallet_address: string
  trade_type: 'spot' | 'sent' | 'received'
  input_token_symbol: string
  output_token_symbol: string | null
  input_amount_raw: string
  output_amount_raw: string
  input_decimals: number
  output_decimals: number
  execution_grade: string | null
  slippage_pct: number | null
  mev_saved_usd: number | null
  signature: string | null
  explorer_url: string | null
  created_at: string
}

export interface ReceivedTransfer {
  id: string
  trade_type: 'received'
  input_token_symbol: string
  input_amount_raw: string
  input_decimals: number
  sender: string | null
  signature: string
  explorer_url: string | null
  created_at: string | null
}

export interface LimitOrder {
  id: string
  walletAddress: string
  network: 'devnet' | 'mainnet' | null
  status: 'pending' | 'executing' | 'executed' | 'cancelled' | 'failed'
  direction: 'above' | 'below'
  inputToken: Pick<Token, 'mint' | 'symbol' | 'decimals'> & { logo?: string | null }
  outputToken: Pick<Token, 'mint' | 'symbol' | 'decimals'> & { logo?: string | null }
  inputAmount: string | number
  targetPrice: number
  createdAt: string
  executedAt: string | null
  signature: string | null
  explorerUrl: string | null
  error: string | null
}

export interface SavedAddress {
  id: string
  address: string
  label: string | null
  last_used_at: string | null
}

export interface NetworkContextValue {
  isDevnet: boolean
  network: 'devnet' | 'mainnet'
  networkLabel: 'DEVNET' | 'MAINNET'
  rpcEndpoint: string
}
