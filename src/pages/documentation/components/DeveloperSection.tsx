import type { ReactNode } from "react";
import {
  Code2,
  Server,
  Globe,
  Layers,
  Terminal,
  AlertTriangle,
} from "lucide-react";
import {
  SectionHeader,
  SubHeading,
  Code,
  ExternalAnchor,
  CallOut,
  Steps,
  FeatureGrid,
  BulletList,
} from "./ui";

function DataTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: ReactNode[][];
}) {
  return (
    <div className="overflow-x-auto mb-4 rounded-xl border border-terminal-border">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="border-b border-terminal-border bg-terminal-card">
            {headers.map((h) => (
              <th
                key={h}
                className="text-left py-2 px-3 text-terminal-dim/70 font-bold tracking-widest uppercase text-[10px]"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className="border-b border-terminal-border/40 last:border-0 hover:bg-terminal-card/40 transition-colors"
            >
              {row.map((cell, j) => (
                <td key={j} className="py-2 px-3 text-terminal-dim align-top">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const B = ({ children }: { children: ReactNode }) => (
  <span className="text-[#60a5fa]">{children}</span>
);

const P = ({ children }: { children: ReactNode }) => (
  <span className="text-[#a78bfa]">{children}</span>
);

const PCode = ({ children }: { children: ReactNode }) => (
  <code className="bg-terminal-card border border-terminal-border px-1.5 py-0.5 rounded text-[#a78bfa] text-xs">
    {children}
  </code>
);

export default function DeveloperSection() {
  return (
    <section id="developer" className="scroll-mt-20">
      <SectionHeader icon={<Code2 size={16} />} title="Developer Reference" />
      <p className="text-xs md:text-sm text-terminal-dim leading-relaxed mb-6">
        Technical reference for self-hosting, integrating with, or extending
        Mainstay. Covers architecture, API contracts, environment variables,
        database schema, deployment, and troubleshooting.
      </p>

      {/* ── Architecture ── */}
      <SubHeading>Request Flow — Mainnet</SubHeading>
      <Steps
        items={[
          {
            title: "Quote request",
            desc: (
              <>
                User enters an amount in <B>SwapInterface</B>. <B>useSwap</B>{" "}
                debounces 600 ms then calls{" "}
                <P>GET /api/dflow/e.quote-api.dflow.net/order</P>.
              </>
            ),
          },
          {
            title: "Vercel rewrite",
            desc: "The proxy rewrites the request to api.eitherway.ai — your production origin is never blocked by third-party CORS policies.",
          },
          {
            title: "DFlow response",
            desc: (
              <>
                DFlow returns a pre-built, partially-signed{" "}
                <B>VersionedTransaction</B> (base64) plus outAmount, inAmount,
                slippageBps, and routing metadata.
              </>
            ),
          },
          {
            title: "MEV risk score",
            desc: (
              <>
                <B>useMevRisk</B> computes a risk score from order size (USD),
                pool liquidity via Jupiter Price API, and Solana TPS from the
                RPC.
              </>
            ),
          },
          {
            title: "Pre-simulation",
            desc: (
              <>
                Before requesting the user's signature, Mainstay calls{" "}
                <B>connection.simulateTransaction()</B> to surface on-chain
                errors early.
              </>
            ),
          },
          {
            title: "Sign & submit",
            desc: (
              <>
                User signs in their wallet. The signed transaction is sent via{" "}
                <B>connection.sendRawTransaction()</B>.
              </>
            ),
          },
          {
            title: "Polling",
            desc: (
              <>
                <B>useSwap</B> polls <B>getSignatureStatus</B> every 1.2 s for
                up to 45 retries until the transaction is confirmed.
              </>
            ),
          },
          {
            title: "Post-trade",
            desc: (
              <>
                <B>PostTradeCard</B> renders the execution grade, MEV saved
                estimate, and slippage delta. <B>useTrades.saveTrade()</B>{" "}
                persists the record to Supabase.
              </>
            ),
          },
        ]}
      />

      {/* ── Proxy routes ── */}
      <SubHeading>Proxy Routes (vercel.json)</SubHeading>
      <p className="text-xs text-terminal-dim leading-relaxed mb-3">
        All external API traffic routes through Vercel rewrites in production.
        API keys and sensitive origin headers are never exposed to the browser.
      </p>
      <DataTable
        headers={["Path", "Upstream destination"]}
        rows={[
          [
            <Code>/api/solana/rpc</Code>,
            "api/solana-rpc.ts (Vercel serverless) → api.mainnet-beta.solana.com",
          ],
          [
            <Code>/api/dialect/:path*</Code>,
            "api.eitherway.ai/api/dialect/:path* — Jupiter Price API v3",
          ],
          [
            <Code>/api/dflow/:path*</Code>,
            "api.eitherway.ai/api/dflow/:path* — DFlow Quote + Swap API",
          ],
          [<Code>/(.*)</Code>, "/index.html — SPA fallback for React Router"],
        ]}
      />
      <CallOut type="warning">
        Rewrite order matters. All /api/* rules must appear before the catch-all
        /(.*) rule in <B>vercel.json</B>, otherwise API requests return
        index.html.
      </CallOut>

      {/* ── Network modes ── */}
      <SubHeading>Network Modes</SubHeading>
      <DataTable
        headers={["Environment", "Network", "Swap routing", "MEV protection"]}
        rows={[
          ["production", "Solana Mainnet", "DFlow JIT Auction", "Active"],
          ["development", "Solana Devnet", "Jupiter v6 API", "Disabled"],
        ]}
      />

      {/* ── DFlow Quote API ── */}
      <SubHeading>DFlow Quote API</SubHeading>
      <p className="text-xs text-terminal-dim leading-relaxed mb-2">
        <span className="text-terminal-text font-bold">Endpoint: </span>
        <PCode>GET /api/dflow/e.quote-api.dflow.net/order</PCode>
      </p>
      <DataTable
        headers={["Parameter", "Description"]}
        rows={[
          [<Code>inputMint</Code>, "Source token mint address (base58)"],
          [<Code>outputMint</Code>, "Destination token mint address (base58)"],
          [
            <Code>amount</Code>,
            "Raw input amount as an integer (including decimals)",
          ],
          [
            <Code>slippageBps</Code>,
            "Slippage tolerance in basis points — pass 'auto'",
          ],
          [
            <Code>prioritizationFeeLamports</Code>,
            "Priority fee — pass 'auto' or an integer lamports value",
          ],
          [
            <Code>wrapAndUnwrapSol</Code>,
            "true — auto-wraps and unwraps native SOL",
          ],
          [
            <Code>userPublicKey</Code>,
            "Connected wallet address (optional but recommended)",
          ],
          [<Code>feeBps</Code>, "Protocol fee in basis points (8 = 0.08%)"],
        ]}
      />
      <p className="text-xs text-terminal-dim leading-relaxed mb-4">
        The response includes a pre-built <Code>VersionedTransaction</Code> in
        the <Code>transaction</Code> field (base64). Deserialize with{" "}
        <Code>VersionedTransaction.deserialize()</Code>, sign with{" "}
        <Code>wallet.signTransaction()</Code>, and submit with{" "}
        <Code>connection.sendRawTransaction()</Code>.
      </p>

      {/* ── Jupiter Price API ── */}
      <SubHeading>Jupiter Price API v3</SubHeading>
      <p className="text-xs text-terminal-dim leading-relaxed mb-2">
        <span className="text-terminal-text font-bold">Endpoint: </span>
        <PCode>GET /api/dialect/api.jup.ag/price/v3</PCode>
      </p>
      <DataTable
        headers={["Parameter", "Description"]}
        rows={[
          [<Code>ids</Code>, "Comma-separated list of token mint addresses"],
        ]}
      />
      <p className="text-xs text-terminal-dim leading-relaxed mb-4">
        Returns an object keyed by mint address, each containing{" "}
        <Code>usdPrice</Code> and <Code>liquidity</Code>. Used for MEV risk
        scoring, limit-order price polling, token selector USD values, and SOL
        price display.
      </p>

      {/* ── MEV risk scoring ── */}
      <SubHeading>MEV Risk Scoring Algorithm</SubHeading>
      <DataTable
        headers={["Signal", "Max score", "HIGH threshold"]}
        rows={[
          ["Order size (USD)", "40 pts", "> $10,000"],
          ["Pool liquidity — shallower side", "40 pts", "< $50,000"],
          ["Network TPS (Solana congestion)", "20 pts", "> 3,000 TPS"],
        ]}
      />
      <BulletList
        items={[
          "≥ 60 points → HIGH risk",
          "35–59 points → MEDIUM risk",
          "< 35 points → LOW risk",
        ]}
      />

      {/* ── External integrations ── */}
      <SubHeading>External Integrations</SubHeading>
      <DataTable
        headers={["Service", "Purpose"]}
        rows={[
          [
            <ExternalAnchor href="https://pond.dflow.net/build/introduction">
              DFlow Protocol
            </ExternalAnchor>,
            "MEV-protected JIT order-flow auction routing",
          ],
          [
            <ExternalAnchor href="https://developers.jup.ag/docs/get-started">
              Jupiter Aggregator
            </ExternalAnchor>,
            "Devnet swap routing + price data via Price API v3",
          ],
          [
            <ExternalAnchor href="https://www.helius.dev/docs">
              Helius
            </ExternalAnchor>,
            "High-reliability Solana RPC endpoint",
          ],
          [
            <ExternalAnchor href="https://supabase.com">
              Supabase
            </ExternalAnchor>,
            "Auth, trade history, limit orders, and address book",
          ],
          [
            <ExternalAnchor href="https://sentry.io">Sentry</ExternalAnchor>,
            "Error tracking and in-app user feedback capture",
          ],
          [
            <ExternalAnchor href="https://tradingview.com">
              TradingView
            </ExternalAnchor>,
            "15-minute OHLC price charts",
          ],
          [
            <ExternalAnchor href="https://resend.com">Resend</ExternalAnchor>,
            "Waitlist confirmation transactional emails",
          ],
        ]}
      />

      {/* ── Environment variables ── */}
      <SubHeading>Environment Variables</SubHeading>
      <DataTable
        headers={["Variable", "Required", "Description"]}
        rows={[
          [
            <Code>VITE_APP_ENVIRONMENT</Code>,
            "✅ Yes",
            "production or development — controls network mode and feature flags",
          ],
          [
            <Code>VITE_APP_URL</Code>,
            "✅ Yes",
            "Deployed app URL, e.g. https://mainstay.pro",
          ],
          [
            <Code>VITE_EITHERWAY_HOST_URL</Code>,
            "✅ Yes",
            "Base URL for the API proxy host",
          ],
          [
            <Code>VITE_EITHERWAY_APP_ID</Code>,
            "✅ Yes",
            "App ID for the Eitherway platform",
          ],
          [
            <Code>VITE_SUPABASE_URL</Code>,
            "⚠️ Recommended",
            "Supabase project URL — enables auth and trade history",
          ],
          [
            <Code>VITE_SUPABASE_ANON_KEY</Code>,
            "⚠️ Recommended",
            "Supabase anonymous key",
          ],
          [
            <Code>VITE_HELIUS_RPC_URL</Code>,
            "⚠️ Recommended",
            "Helius RPC endpoint — improves balance and transaction reliability",
          ],
          [
            <Code>VITE_AUTH_REDIRECT_URL</Code>,
            "➖ Optional",
            "OAuth callback URL for Supabase auth",
          ],
          [
            <Code>VITE_SENTRY_DSN</Code>,
            "➖ Optional",
            "Sentry DSN for error and feedback tracking",
          ],
          [
            <Code>SENTRY_ORG</Code>,
            "➖ Optional",
            "Sentry org slug for build-time source map upload",
          ],
          [<Code>SENTRY_PROJECT</Code>, "➖ Optional", "Sentry project name"],
          [
            <Code>SENTRY_AUTH_TOKEN</Code>,
            "➖ Optional",
            "Sentry auth token for source map upload during build",
          ],
        ]}
      />
      <CallOut type="info">
        The app degrades gracefully without Supabase variables. Token swapping,
        limit orders, and all UI features remain fully functional. Only trade
        history persistence and authentication are disabled.
      </CallOut>

      {/* ── Database schema ── */}
      <SubHeading>Database Schema</SubHeading>
      <p className="text-xs text-terminal-dim leading-relaxed mb-3">
        All tables live on Supabase (PostgreSQL). Enable Row Level Security on
        every table with policies scoped to <Code>auth.uid()</Code> or{" "}
        <Code>wallet_address</Code> as appropriate.
      </p>

      <p className="text-xs font-bold text-terminal-text mb-2 mt-5">
        trades / devTrades
      </p>
      <DataTable
        headers={["Column", "Type", "Description"]}
        rows={[
          [<Code>id</Code>, "uuid (PK)", "Auto-generated primary key"],
          [<Code>wallet_address</Code>, "text", "Signer's base58 public key"],
          [
            <Code>trade_type</Code>,
            "text",
            "spot, received, sent, or prediction",
          ],
          [<Code>input_token_symbol</Code>, "text", "e.g. SOL, USDC"],
          [<Code>output_token_symbol</Code>, "text", "e.g. BONK, JUP"],
          [
            <Code>input_amount_raw</Code>,
            "text",
            "Raw integer amount (including decimals)",
          ],
          [
            <Code>output_amount_raw</Code>,
            "text",
            "Raw integer amount received",
          ],
          [
            <Code>execution_grade</Code>,
            "text",
            "A+, A, B, C, D, or F — null for transfers",
          ],
          [
            <Code>slippage_pct</Code>,
            "numeric",
            "Actual slippage delta vs quoted output",
          ],
          [
            <Code>mev_saved_usd</Code>,
            "numeric",
            "Estimated MEV cost avoided (mainnet only)",
          ],
          [<Code>signature</Code>, "text", "Transaction signature"],
          [<Code>explorer_url</Code>, "text", "Solscan link"],
          [<Code>created_at</Code>, "timestamptz", "Auto-set by Supabase"],
        ]}
      />

      <p className="text-xs font-bold text-terminal-text mb-2 mt-5">
        limitOrders / devLimitOrders
      </p>
      <DataTable
        headers={["Column", "Type", "Description"]}
        rows={[
          [
            <Code>id</Code>,
            "text (PK)",
            "Client-generated: lo_{timestamp}_{random}",
          ],
          [<Code>wallet_address</Code>, "text", "Order owner's public key"],
          [<Code>network</Code>, "text", "mainnet or devnet"],
          [
            <Code>status</Code>,
            "text",
            "pending, executing, executed, cancelled, or failed",
          ],
          [
            <Code>direction</Code>,
            "text",
            "above or below — when to trigger execution",
          ],
          [<Code>input_token_mint</Code>, "text", "Source token mint address"],
          [
            <Code>output_token_mint</Code>,
            "text",
            "Destination token mint address",
          ],
          [<Code>input_amount</Code>, "text", "Human-readable input amount"],
          [
            <Code>target_price</Code>,
            "numeric",
            "Target USD price to trigger execution",
          ],
          [
            <Code>executed_at</Code>,
            "timestamptz",
            "Execution timestamp (null if pending)",
          ],
          [
            <Code>signature</Code>,
            "text",
            "Transaction signature on execution",
          ],
          [
            <Code>error</Code>,
            "text",
            "Human-readable error message on failure",
          ],
          [<Code>created_at</Code>, "timestamptz", "Auto-set by Supabase"],
        ]}
      />

      <p className="text-xs font-bold text-terminal-text mb-2 mt-5">
        recipients
      </p>
      <DataTable
        headers={["Column", "Type", "Description"]}
        rows={[
          [<Code>id</Code>, "uuid (PK)", "Auto-generated"],
          [<Code>wallet_address</Code>, "text", "Owner's public key"],
          [<Code>address</Code>, "text", "Recipient's Solana address"],
          [<Code>label</Code>, "text", "Optional label (e.g. 'My Exchange')"],
          [
            <Code>last_used_at</Code>,
            "timestamptz",
            "Updated on every successful send to this address",
          ],
        ]}
      />

      <p className="text-xs font-bold text-terminal-text mb-2 mt-5">
        waitingList
      </p>
      <DataTable
        headers={["Column", "Type", "Description"]}
        rows={[
          [<Code>id</Code>, "uuid (PK)", "Auto-generated"],
          [<Code>email</Code>, "text (unique)", "Subscriber's email address"],
          [<Code>created_at</Code>, "timestamptz", "Signup timestamp"],
        ]}
      />

      {/* ── Deployment ── */}
      <SubHeading>Deployment (Vercel)</SubHeading>
      <Steps
        items={[
          {
            title: "Install dependencies",
            desc: (
              <>
                Clone the repository and run <B>npm install</B>. Node.js ≥ 20 is
                required.
              </>
            ),
          },
          {
            title: "Configure local env",
            desc: (
              <>
                Copy <B>.env.example</B> to <B>.env.development</B> and fill in
                your values.
              </>
            ),
          },
          {
            title: "Test locally",
            desc: (
              <>
                Run <B>npm run dev</B> and verify the app works on devnet at
                http://localhost:5173.
              </>
            ),
          },
          {
            title: "Push to GitHub",
            desc: "Push to your repository and import it in the Vercel dashboard.",
          },
          {
            title: "Set env variables",
            desc: "Add all production environment variables under Vercel → Settings → Environment Variables.",
          },
          {
            title: "Deploy",
            desc: (
              <>
                Vercel automatically runs <B>npm run build</B> and applies{" "}
                <B>vercel.json</B> rewrites on every push.
              </>
            ),
          },
          {
            title: "Domain & auth",
            desc: (
              <>
                Set your custom domain, update <B>VITE_APP_URL</B> and{" "}
                <B>VITE_AUTH_REDIRECT_URL</B>, then add the domain to Supabase →
                Authentication → URL Configuration.
              </>
            ),
          },
        ]}
      />

      {/* ── Build config ── */}
      <SubHeading>Build Configuration (vite.config.ts)</SubHeading>
      <FeatureGrid
        items={[
          {
            icon: <Terminal size={14} className="text-terminal-accent" />,
            title: "Source maps disabled",
            desc: (
              <>
                <B>build.sourcemap</B> is false in production. Sentry uploads
                source maps separately via the Sentry Vite plugin during the
                build step.
              </>
            ),
          },
          {
            icon: <Layers size={14} className="text-terminal-green" />,
            title: "Node polyfills",
            desc: (
              <>
                buffer, crypto, stream, and util are injected via{" "}
                <B>vite-plugin-node-polyfills</B> — required by{" "}
                <B>@solana/web3.js</B>.
              </>
            ),
          },
          {
            icon: <Globe size={14} className="text-terminal-yellow" />,
            title: "PWA + Workbox",
            desc: (
              <>
                Manifest and service worker are generated by{" "}
                <B>vite-plugin-pwa</B>. Google Fonts are cached with a
                CacheFirst strategy and a 365-day TTL.
              </>
            ),
          },
          {
            icon: <Server size={14} className="text-terminal-red" />,
            title: "process.env shim",
            desc: (
              <>
                <B>process.env</B> is shimmed to an empty object to prevent
                runtime errors from packages expecting a Node environment.
              </>
            ),
          },
        ]}
      />

      {/* ── Troubleshooting ── */}
      <SubHeading>Troubleshooting</SubHeading>
      <div className="space-y-3 mb-6">
        {(
          [
            {
              issue: "CORS error on /api/solana/rpc in production",
              fix: (
                <>
                  Ensure <B>api/solana-rpc.ts</B> exists and <B>vercel.json</B>{" "}
                  routes <P>/api/solana/rpc</P> to <B>/api/solana-rpc</B> — not
                  to the eitherway proxy. The eitherway proxy only allowlists
                  localhost:5173 and its own domains.
                </>
              ),
            },
            {
              issue: "Swap fails with 'No route found'",
              fix: "The token pair may have insufficient liquidity on DFlow. On devnet, retry — Jupiter sometimes has stale routes. On mainnet, try a different amount or pair.",
            },
            {
              issue: "Solflare shows 'Security verification failed'",
              fix: "Solflare's network is likely set to devnet while the app is on mainnet. Guide the user to Solflare → Settings → General → Network → Mainnet.",
            },
            {
              issue: "Trade history not showing",
              fix: (
                <>
                  Verify <B>VITE_SUPABASE_URL</B> and{" "}
                  <B>VITE_SUPABASE_ANON_KEY</B> are set. The app silently
                  disables history when these are missing. Also confirm the{" "}
                  <B>trades</B> table exists in Supabase.
                </>
              ),
            },
            {
              issue: "Limit orders not executing",
              fix: "The polling loop runs in the browser tab and stops when the tab is closed. The user must keep the tab open while orders are pending.",
            },
            {
              issue: "Auth redirect loop",
              fix: (
                <>
                  <B>VITE_AUTH_REDIRECT_URL</B> must match exactly one of the
                  redirect URLs configured in Supabase Dashboard →
                  Authentication → URL Configuration.
                </>
              ),
            },
            {
              issue: "Transaction simulation failed",
              fix: "Usually indicates insufficient balance (including SOL for fees) or a stale quote. Have the user refresh the quote and check their balance.",
            },
            {
              issue: "PWA not updating",
              fix: "Hard-reload with Ctrl+Shift+R / Cmd+Shift+R, or unregister the service worker from DevTools → Application → Service Workers.",
            },
          ] as { issue: string; fix: ReactNode }[]
        ).map((item) => (
          <div
            key={item.issue}
            className="bg-terminal-card border border-terminal-border rounded-xl p-4"
          >
            <p className="text-xs font-bold text-terminal-text mb-1 flex items-start gap-2">
              <AlertTriangle
                size={12}
                className="text-terminal-yellow mt-0.5 shrink-0"
              />
              {item.issue}
            </p>
            <p className="text-xs text-terminal-dim leading-relaxed pl-[18px]">
              {item.fix}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 pt-6 border-t border-terminal-border/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 md:gap-3">
        <div>
          <p className="font-mono text-xs text-terminal-dim/80 tracking-widest uppercase mb-1">
            Questions or issues?
          </p>
          <p className="text-xs md:text-sm text-terminal-dim">
            Open an issue on{" "}
            <ExternalAnchor href="https://github.com/DhanteyUD/Mainstay">
              GitHub
            </ExternalAnchor>{" "}
            or use the Feedback button inside the app.
          </p>
        </div>
        <button
          onClick={() => {
            try {
              localStorage.setItem("mainstay_app_launched", "true");
            } catch {
              /* silent */
            }
            window.location.href = "/";
          }}
          className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-lg font-mono font-bold text-xs bg-terminal-accent text-terminal-bg hover:opacity-85 transition-all"
        >
          LAUNCH APP
        </button>
      </div>
    </section>
  );
}
