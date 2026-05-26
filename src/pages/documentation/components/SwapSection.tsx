import { ArrowRightLeft } from "lucide-react";
import { SectionHeader, SubHeading, CallOut } from "./ui";

export default function SwapSection() {
  return (
    <section id="swap" className="scroll-mt-20">
      <SectionHeader icon={<ArrowRightLeft size={16} />} title="Token Swap" />
      <p className="text-xs md:text-sm text-terminal-dim leading-relaxed mb-4">
        Token Swap routes through Jupiter Aggregator to find the best price
        across all Solana DEXes, then submits the transaction via DFlow Protocol
        for MEV-free settlement.
      </p>

      <SubHeading>Selecting tokens</SubHeading>
      <p className="text-xs md:text-sm text-terminal-dim leading-relaxed mb-4">
        Click either token selector to open the token picker. You can search by
        symbol or by pasting a token mint address. The chart updates
        automatically to reflect the selected pair.
      </p>

      <SubHeading>Slippage</SubHeading>
      <p className="text-xs md:text-sm text-terminal-dim leading-relaxed mb-4">
        Slippage tolerance can be adjusted in the swap settings (gear icon).
        Default is 0.5%. Increase it for low-liquidity tokens; decrease it for
        high-value swaps where price impact must be minimized.
      </p>

      <SubHeading>Price impact</SubHeading>
      <p className="text-xs md:text-sm text-terminal-dim leading-relaxed mb-4">
        Mainstay shows estimated price impact before you confirm. Swaps with
        high price impact ({">"} 5%) display a warning. Price impact is
        calculated against the current on-chain liquidity depth.
      </p>

      <CallOut type="warning">
        Always review the output amount and price impact before confirming a
        swap. Once submitted to the blockchain, swaps cannot be reversed.
      </CallOut>
    </section>
  );
}
