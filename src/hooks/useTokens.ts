import { useState, useEffect } from "react";
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

export function useTokens() {
  const [tokens, setTokens] = useState<Record<string, Token>>(TOKENS);
  const [tokenList, setTokenList] = useState<Token[]>(Object.values(TOKENS));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase
      .from("tokens")
      .select("symbol, name, mint, decimals, logo")
      .then(({ data, error }) => {
        if (!error && data?.length) {
          const map: Record<string, Token> = {};
          for (const row of data as Token[]) {
            map[row.symbol] = rowToToken(row);
          }
          setTokens(map);
          setTokenList((data as Token[]).map(rowToToken));
        }
        setLoading(false);
      });
  }, []);

  return { tokens, tokenList, loading };
}
