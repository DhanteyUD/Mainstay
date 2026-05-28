import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { TOKENS } from "../config";
import type { Token } from "../types";

function rowToToken(row: Token): Token {
  return {
    symbol: row.symbol,
    name: row.name,
    mint: row.mint,
    decimals: row.decimals,
    logo: row.logo,
  };
}

const DEFAULT_LIST = Object.values(TOKENS);
const DEFAULT_MAP = TOKENS as Record<string, Token>;

export function useTokens() {
  const { data: tokenList = DEFAULT_LIST, isLoading: loading } = useQuery({
    queryKey: ["tokens"],
    queryFn: async () => {
      if (!supabase) return DEFAULT_LIST;
      const { data, error } = await supabase
        .from("tokens")
        .select("symbol, name, mint, decimals, logo");
      if (error || !data?.length) return DEFAULT_LIST;
      return (data as Token[]).map(rowToToken);
    },
    staleTime: 1000 * 60 * 5,
    placeholderData: DEFAULT_LIST,
  });

  const tokens: Record<string, Token> = tokenList.reduce(
    (acc, t) => ({ ...acc, [t.symbol]: t }),
    DEFAULT_MAP,
  );

  return { tokens, tokenList, loading };
}
