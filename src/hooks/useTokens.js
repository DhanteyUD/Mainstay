import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { TOKENS } from '../config';

function rowToToken(row) {
  return {
    symbol: row.symbol,
    name: row.name,
    mint: row.mint,
    decimals: row.decimals,
    logo: row.logo,
  };
}

export function useTokens() {
  const [tokens, setTokens] = useState(TOKENS);
  const [tokenList, setTokenList] = useState(Object.values(TOKENS));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase
      .from('tokens')
      .select('symbol, name, mint, decimals, logo')
      .then(({ data, error }) => {
        if (!error && data?.length) {
          const map = {};
          for (const row of data) {
            map[row.symbol] = rowToToken(row);
          }
          setTokens(map);
          setTokenList(data.map(rowToToken));
        }
        setLoading(false);
      });
  }, []);

  return { tokens, tokenList, loading };
}
