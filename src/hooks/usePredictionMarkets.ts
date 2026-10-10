import { useQuery } from "@tanstack/react-query";
import { fetchLiveMarkets } from "../lib/predictionApi";

type ApiError = { code?: string };

function describe(e: ApiError): string {
  if (e.code === "no_api_key") {
    return "Live markets aren't set up on this server yet (DFLOW_API_KEY is missing).";
  }
  if (e.code === "key_rejected") {
    return "DFlow rejected this server's API key for market data. Check the key has prediction markets access.";
  }
  return "Could not load prediction markets. Try again shortly.";
}

export function usePredictionMarkets(enabled = true) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["prediction-markets"],
    queryFn: fetchLiveMarkets,
    enabled,
    refetchInterval: 30_000,
    staleTime: 15_000,
    retry: (count, e) => !(e as ApiError).code && count < 2,
  });
  return {
    markets: data ?? [],
    loading: isLoading,
    error: error ? describe(error as ApiError) : null,
    refetch,
  };
}
