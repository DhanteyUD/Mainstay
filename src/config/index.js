let cache;

const env = import.meta.env.VITE_APP_ENVIRONMENT || "development";

const config = () => {
  if (!cache) {
    cache = Object.freeze({
      secrets: {
        environment: env,
        solanaNetwork: env === "production" ? "mainnet" : "devnet",
        client: env === "production" ? "mainstay.pro" : "main-stay.vercel.app",
        appUrl: import.meta.env.VITE_APP_URL,
        sentryDsn: import.meta.env.VITE_SENTRY_DSN,
        sentryProject: import.meta.env.SENTRY_PROJECT,
        authRedirectUrl: import.meta.env.VITE_AUTH_REDIRECT_URL,
        supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
        heliusRpcUrl: import.meta.env.VITE_HELIUS_RPC_URL,
      },
    });
  }
  return cache;
};

export default config;
