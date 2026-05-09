import { Shield, Zap, Target } from "lucide-react";
import { InfoCard, Feature, Step } from "./InfoCard";
import { useNetwork } from "../contexts/NetworkContext";

interface ProtectionPanelProps {
  showPredictionInfo?: boolean;
}

export default function ProtectionPanel({
  showPredictionInfo,
}: ProtectionPanelProps) {
  const { isDevnet } = useNetwork();

  if (showPredictionInfo && !isDevnet) {
    return (
      <div className="space-y-4">
        <InfoCard
          title="Prediction Markets"
          accentColor="text-terminal-yellow"
          borderColor="border-terminal-yellow/20"
          bgColor="bg-terminal-yellow/5"
          icon={<Target size={14} className="text-terminal-yellow" />}
        >
          <p className="text-terminal-dim text-xs font-mono leading-relaxed">
            Prediction market outcome tokens represent shares in the result of a
            real-world event. Trading them through DFlow gives you MEV-protected
            execution — the same protection as spot trades, applied to
            prediction markets.
          </p>
          <div className="mt-3 space-y-1.5">
            <Feature label="YES tokens: pay out if the event occurs" />
            <Feature label="NO tokens: pay out if the event doesn't occur" />
            <Feature label="DFlow JIT auction prevents front-running" />
            <Feature label="feeBps: 8 with dynamic priority fee" />
          </div>
        </InfoCard>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!isDevnet && (
        <>
          <InfoCard
            title="DFlow MEV Protection"
            accentColor="text-terminal-accent"
            borderColor="border-terminal-accent/20"
            bgColor="bg-terminal-accent/5"
            icon={<Shield size={14} className="text-terminal-accent" />}
          >
            <p className="text-terminal-dim text-xs font-mono leading-relaxed">
              DFlow routes your orders through a network of market makers
              competing for your flow via Just-In-Time (JIT) auctions. This
              eliminates front-running and sandwich attacks — common MEV vectors
              on Solana.
            </p>
            <div className="mt-3 space-y-1.5">
              <Feature label="Front-running protection" />
              <Feature label="Sandwich attack prevention" />
              <Feature label="JIT liquidity routing" />
              <Feature label="Best execution price" />
            </div>
          </InfoCard>

          <InfoCard
            title="How It Works"
            accentColor="text-terminal-green"
            borderColor="border-terminal-green/20"
            bgColor="bg-terminal-green/5"
            icon={<Zap size={14} className="text-terminal-green" />}
          >
            <div className="space-y-3">
              <Step
                number="1"
                title="Quote"
                description="DFlow fetches a live quote from its order flow auction network."
              />
              <Step
                number="2"
                title="Sign"
                description="You sign the transaction in your wallet — no order leaves without your approval."
              />
              <Step
                number="3"
                title="Execute"
                description="Market makers compete in a sealed-bid auction for your order."
              />
              <Step
                number="4"
                title="Confirm"
                description="Transaction is confirmed on-chain with a verified execution report."
              />
            </div>
          </InfoCard>
        </>
      )}

      <div className="rounded-xl border border-terminal-yellow/20 bg-terminal-yellow/5 p-4">
        <div className="flex items-start gap-2">
          <span className="text-terminal-yellow text-base leading-none">⚠</span>
          <div>
            <div className="font-mono text-xs font-semibold text-terminal-yellow mb-1">
              {isDevnet ? "Devnet Mode" : "Mainnet Trading"}
            </div>
            <p className="font-mono text-xs text-terminal-dim leading-relaxed">
              {isDevnet
                ? "Connected to Solana devnet. Balances reflect your devnet wallet. Routed via Jupiter — no MEV protection."
                : "This interface executes real transactions on Solana mainnet. Only connect a wallet you control and trade amounts you're comfortable with."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
