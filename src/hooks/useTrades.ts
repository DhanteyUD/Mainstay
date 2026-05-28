import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useNetwork } from "../contexts/NetworkContext";
import type {
  TradeRecord,
  Token,
  SwapResult,
  SendResult,
  ReceivedTransfer,
} from "../types";

const DB_ENABLED = supabase !== null;

interface TradeSavePayload {
  tradeType?: string;
  inputToken?: Token | null;
  outputToken?: Token | null;
  result?: SwapResult;
  grade?: { label: string } | null;
  slippagePct?: number | null;
  mevSaved?: number | null;
}

function buildRow(walletAddress: string, payload: TradeSavePayload) {
  return {
    wallet_address: walletAddress,
    trade_type: payload.tradeType || "spot",
    input_token_symbol: payload.inputToken?.symbol || "?",
    output_token_symbol: payload.outputToken?.symbol || "?",
    input_amount_raw: String(payload.result?.inputAmount || "0"),
    output_amount_raw: String(payload.result?.outputAmount || "0"),
    input_decimals: payload.inputToken?.decimals ?? 9,
    output_decimals: payload.outputToken?.decimals ?? 6,
    execution_grade: payload.grade?.label || null,
    slippage_pct:
      payload.slippagePct != null ? Number(payload.slippagePct) : null,
    signature: payload.result?.signature || null,
    explorer_url: payload.result?.explorerUrl || null,
  };
}

export function useTrades(walletAddress: string | null) {
  const { isDevnet } = useNetwork();
  const qc = useQueryClient();
  const key = ["trades", walletAddress, isDevnet];

  const {
    data: trades = [],
    isLoading: loading,
    error: queryError,
    refetch,
  } = useQuery<TradeRecord[]>({
    queryKey: key,
    queryFn: async () => {
      if (!walletAddress || !DB_ENABLED) return [];
      const table = isDevnet ? "devTrades" : "trades";
      const { data, error } = await supabase!
        .from(table)
        .select("*")
        .eq("wallet_address", walletAddress)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data || []) as TradeRecord[];
    },
    enabled: !!walletAddress,
    staleTime: 1000 * 30,
  });

  const error = queryError ? (queryError as Error).message : null;

  const saveTradeM = useMutation({
    mutationFn: async (payload: TradeSavePayload) => {
      if (!walletAddress || !DB_ENABLED) return;
      const table = isDevnet ? "devTrades" : "trades";
      const row = {
        ...buildRow(walletAddress, payload),
        mev_saved_usd: isDevnet
          ? null
          : payload.mevSaved != null
            ? Number(payload.mevSaved)
            : null,
      };
      const { error: err } = await supabase!.from(table).insert(row);
      if (err)
        console.warn(`[useTrades] save to ${table} failed:`, err.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  const saveTransferM = useMutation({
    mutationFn: async (payload: SendResult) => {
      if (!walletAddress || !DB_ENABLED) return;
      const table = isDevnet ? "devTrades" : "trades";
      const decimals = payload.token?.decimals ?? 9;
      const raw = String(Math.round(Number(payload.amount) * 10 ** decimals));
      const row = {
        wallet_address: walletAddress,
        trade_type: "sent",
        input_token_symbol: payload.token?.symbol || "SOL",
        output_token_symbol: payload.recipient || null,
        input_amount_raw: raw,
        output_amount_raw: "0",
        input_decimals: decimals,
        output_decimals: 9,
        execution_grade: null,
        slippage_pct: null,
        mev_saved_usd: null,
        signature: payload.signature || null,
        explorer_url: payload.explorerUrl || null,
      };
      const { error: err } = await supabase!.from(table).insert(row);
      if (err) console.warn(`[useTrades] saveTransfer failed:`, err.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  const saveReceivedM = useMutation({
    mutationFn: async (item: ReceivedTransfer) => {
      if (!walletAddress || !DB_ENABLED || !item.signature) return;
      const table = isDevnet ? "devTrades" : "trades";
      const { data: existing } = await supabase!
        .from(table)
        .select("id")
        .eq("wallet_address", walletAddress)
        .eq("signature", item.signature)
        .maybeSingle();
      if (existing) return;
      const row = {
        wallet_address: walletAddress,
        trade_type: "received",
        input_token_symbol: item.input_token_symbol,
        output_token_symbol: item.sender || null,
        input_amount_raw: item.input_amount_raw,
        output_amount_raw: "0",
        input_decimals: item.input_decimals ?? 9,
        output_decimals: 9,
        execution_grade: null,
        slippage_pct: null,
        mev_saved_usd: null,
        signature: item.signature,
        explorer_url: item.explorer_url || null,
      };
      const { error: err } = await supabase!.from(table).insert(row);
      if (err) console.warn("[useTrades] saveReceived failed:", err.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  return {
    trades,
    loading,
    error,
    saveTrade: saveTradeM.mutateAsync,
    saveTransfer: saveTransferM.mutateAsync,
    saveReceived: saveReceivedM.mutateAsync,
    fetchTrades: refetch,
    dbEnabled: DB_ENABLED,
  };
}
