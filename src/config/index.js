let cache;

const env = import.meta.env.VITE_APP_ENVIRONMENT || "development";

const config = () => {
	if (!cache) {
		cache = Object.freeze({
			secrets: {
				environment: env,
				appUrl:
					env === "development"
						? import.meta.env.VITE_APP_URL_DEV
						: import.meta.env.VITE_APP_URL_PROD,
				sentryDsn:
					env === "development"
						? import.meta.env.VITE_SENTRY_DSN_DEV
						: import.meta.env.VITE_SENTRY_DSN_PROD,
				sentryProject:
					env === "development"
						? import.meta.env.SENTRY_PROJECT_DEV
						: import.meta.env.SENTRY_PROJECT_PROD,
				authRedirectUrl:
					env === "development"
						? import.meta.env.VITE_AUTH_REDIRECT_URL_DEV
						: import.meta.env.VITE_AUTH_REDIRECT_URL_PROD,
				supabaseAnonKey:
					env === "development"
						? import.meta.env.VITE_SUPABASE_ANON_KEY_DEV
						: import.meta.env.VITE_SUPABASE_ANON_KEY_PROD,
				supabaseUrl:
					env === "development"
						? import.meta.env.VITE_SUPABASE_URL_DEV
						: import.meta.env.VITE_SUPABASE_URL_PROD,
			},
		});
	}
	return cache;
};

export default config;
