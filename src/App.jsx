import React, { useState, useEffect, useRef } from "react";
import {
  ArrowRightLeft,
  Clock,
  Info,
  TrendingUp,
  AlertTriangle,
  Server,
  Target,
} from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { motion, AnimatePresence } from "framer-motion";

import { useAuth } from "./lib/auth-context";
import FeedbackButton from "./components/FeedbackButton";

import LoginScreen from "./components/LoginScreen";
import AppHeader from "./components/AppHeader";
import AppFooter from "./components/AppFooter";
import PriceChart from "./components/PriceChart";
import SwapInterface from "./components/SwapInterface";
import LimitOrderForm from "./components/LimitOrderForm";
import LimitOrderList from "./components/LimitOrderList";
import TradeHistory from "./components/TradeHistory";
import OnboardingScreen, { useOnboarding } from "./components/OnboardingScreen";
import MobileWalletBanner from "./components/MobileWalletBanner";
import WalletCard from "./components/WalletCard";
import EdgeStatusCard from "./components/EdgeStatusCard";
import ProtectionPanel from "./components/ProtectionPanel";
import PredictionComingSoon from "./components/PredictionComingSoon";
import PredictionMarketsInterface from "./components/PredictionMarketsInterface";
import { MainTabBtn, TabBtn } from "./components/TabButtons";
import { useNetwork } from "./contexts/NetworkContext";

import { isMobile, isWalletBrowser } from "./lib/device";
import { useTrades } from "./hooks/useTrades";
import { useReceivedTransfers } from "./hooks/useReceivedTransfers";
import { useLimitOrders } from "./hooks/useLimitOrders";
import { useNetworkStats } from "./hooks/useNetworkStats";
import { useWalletBalance } from "./hooks/useWalletBalance";

import {
  TAB_MAIN_SWAP,
  TAB_MAIN_PREDICT,
  TAB_MAIN_LIMIT,
  TAB_INFO,
  TAB_HISTORY,
  RISK_STYLES,
  UPTIME_STYLES,
} from "./constants";
import { TOKENS } from "./config";

export default function App() {
  const { user, loading: authLoading } = useAuth();
  const { dismissed, dismiss } = useOnboarding();

  if (authLoading) {
    return (
      <div className="fixed inset-0 bg-terminal-bg flex items-center justify-center">
        <span className="font-mono text-xs text-terminal-dim animate-pulse">
          Authenticating…
        </span>
      </div>
    );
  }

  if (!dismissed) return (
    <>
      <OnboardingScreen onDismiss={dismiss} />
      <FeedbackButton />
    </>
  );

  if (!user && !isWalletBrowser) return (
    <>
      <LoginScreen />
      <FeedbackButton />
    </>
  );

  return <MainApp />;
}

function MainApp() {
  const { isDevnet } = useNetwork();
  const { publicKey, connected } = useWallet();
  const walletAddress = publicKey?.toBase58() || null;

  const { trades, loading, error, saveTrade, saveTransfer, saveReceived, fetchTrades, dbEnabled } =
    useTrades(walletAddress);
  const { received, fetchReceived } = useReceivedTransfers(walletAddress);
  const savedReceivedSigs = useRef(new Set());
  const { orders, currentPrices, addOrder, cancelOrder, pendingCount } =
    useLimitOrders();
  const { solPrice, priceLoading, uptimePct, riskLevel } = useNetworkStats();
  const { balance: solBalance } = useWalletBalance();

  const [mainTab, setMainTab] = useState(TAB_MAIN_SWAP);
  const [rightTab, setRightTab] = useState(TAB_INFO);
  const [chartTokens, setChartTokens] = useState({
    inputToken: TOKENS.SOL,
    outputToken: TOKENS.USDC,
  });

  const [balanceHidden, setBalanceHidden] = useState(
    () => localStorage.getItem("mainstay_balance_hidden") === "true",
  );

  function toggleBalanceHidden() {
    setBalanceHidden((v) => {
      localStorage.setItem("mainstay_balance_hidden", String(!v));
      return !v;
    });
  }

  useEffect(() => {
    if (connected && walletAddress) { fetchTrades(); fetchReceived(); }
  }, [connected, walletAddress, isDevnet]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    received.forEach(item => {
      if (!item.signature || savedReceivedSigs.current.has(item.signature)) return
      savedReceivedSigs.current.add(item.signature)
      saveReceived(item)
    })
  }, [received]); // eslint-disable-line react-hooks/exhaustive-deps

  const risk = RISK_STYLES[riskLevel] ?? RISK_STYLES.LOW;
  const uptime =
    uptimePct === null || Number(uptimePct) >= 90
      ? UPTIME_STYLES.ok
      : UPTIME_STYLES.bad;

  return (
    <div className="min-h-screen bg-terminal-bg relative">
      {/* Scan-line + grid overlays */}
      <div className="scan-line" />

      {/* grid */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.015]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,229,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,1) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* radial grid */}
      {/* <div
        className="fixed inset-0 pointer-events-none opacity-[0.25]"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(0,229,255,0.35) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      /> */}

      <AppHeader balanceHidden={balanceHidden} />
      <AnimatePresence>
        {isMobile && !isWalletBrowser && !connected && <MobileWalletBanner />}
      </AnimatePresence>

      <EdgeStatusCard
        label="Risk Level"
        value={riskLevel ?? "···"}
        sublabel={isDevnet ? "mainnet MEV + TPS" : "MEV protection + TPS"}
        icon={
          <AlertTriangle
            size={12}
            className={isDevnet ? "text-terminal-dim/30" : risk.accent}
          />
        }
        accentClass={isDevnet ? "text-terminal-dim/30" : risk.accent}
        stripBg={
          isDevnet ? "bg-terminal-dim/20" : (risk.pulse ?? "bg-terminal-green")
        }
        pulse={riskLevel !== null && !isDevnet}
        pulseColor={risk.pulse}
        topOffset="35%"
      />
      <EdgeStatusCard
        label="Network Uptime"
        value={uptimePct !== null ? `${uptimePct}%` : "···"}
        sublabel={isDevnet ? "mainnet DFlow + Helius" : "DFlow + Helius"}
        icon={
          <Server
            size={12}
            className={isDevnet ? "text-terminal-dim/30" : uptime.accent}
          />
        }
        accentClass={isDevnet ? "text-terminal-dim/30" : uptime.accent}
        stripBg={
          isDevnet
            ? "bg-terminal-dim/20"
            : uptimePct !== null && Number(uptimePct) < 90
              ? "bg-terminal-yellow"
              : "bg-terminal-green"
        }
        pulse={uptimePct !== null && !isDevnet}
        pulseColor={
          uptimePct !== null && Number(uptimePct) < 90
            ? "bg-terminal-yellow"
            : "bg-terminal-green"
        }
        topOffset="52%"
      />

      <motion.main
        className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        style={
          isMobile && !isWalletBrowser && !connected
            ? { display: "none" }
            : undefined
        }
      >
        <WalletCard
          solBalance={solBalance}
          solPrice={solPrice}
          priceLoading={priceLoading}
          tradesCount={trades.length}
          walletAddress={walletAddress}
          connected={connected}
          balanceHidden={balanceHidden}
          onToggleHide={toggleBalanceHidden}
          onSendSuccess={saveTransfer}
        />

        {/* Price chart */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <PriceChart
            solPrice={solPrice}
            inputToken={chartTokens.inputToken}
            outputToken={chartTokens.outputToken}
          />
        </motion.div>

        {/* Main tab bar */}
        <motion.div
          className="flex gap-1 mb-6 bg-terminal-card border border-terminal-border rounded-xl p-1 w-full sm:w-full"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.3 }}
        >
          <MainTabBtn
            active={mainTab === TAB_MAIN_SWAP}
            onClick={() => setMainTab(TAB_MAIN_SWAP)}
            icon={<ArrowRightLeft size={13} />}
            label="Token Swap"
          />
          <MainTabBtn
            active={mainTab === TAB_MAIN_LIMIT}
            onClick={() => setMainTab(TAB_MAIN_LIMIT)}
            icon={<TrendingUp size={13} />}
            label="Limit Orders"
            badge={pendingCount > 0 ? pendingCount : null}
          />
          <MainTabBtn
            active={mainTab === TAB_MAIN_PREDICT}
            onClick={() => setMainTab(TAB_MAIN_PREDICT)}
            icon={<Target size={13} />}
            label="Prediction Market"
            soon={!isDevnet}
          />
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-6 items-start justify-center">
          {/* ── Left panel ───────────────────────────────────────────────── */}
          <div className="w-full lg:max-w-lg mx-auto lg:mx-0 shrink-0">
            <AnimatePresence mode="wait">
              {mainTab === TAB_MAIN_SWAP ? (
                <motion.div
                  key="swap"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.2 }}
                >
                  <SwapInterface
                    onSaveTrade={saveTrade}
                    onTokensChange={setChartTokens}
                  />
                </motion.div>
              ) : mainTab === TAB_MAIN_LIMIT ? (
                <motion.div
                  key="limit"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  transition={{ duration: 0.2 }}
                >
                  <LimitOrderForm onAddOrder={addOrder} />
                </motion.div>
              ) : (
                <motion.div
                  key="predictions"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  transition={{ duration: 0.2 }}
                >
                  {isDevnet ? (
                    <PredictionMarketsInterface onSaveTrade={undefined} />
                  ) : (
                    <PredictionComingSoon />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Right panel ──────────────────────────────────────────────── */}
          <div className="w-full lg:max-w-lg mx-auto lg:mx-0">
            <AnimatePresence mode="wait">
              {mainTab === TAB_MAIN_LIMIT ? (
                <motion.div
                  key="orders-panel"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="bg-terminal-card border border-terminal-border rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingUp size={14} className="text-terminal-yellow" />
                      <span className="font-mono font-bold text-xs tracking-wider text-terminal-yellow">
                        PENDING ORDERS
                      </span>
                      {pendingCount > 0 && (
                        <span className="ml-auto inline-flex items-center justify-center min-w-[18px] h-4 px-1 rounded-full bg-terminal-yellow/20 text-terminal-yellow text-xs font-bold">
                          {pendingCount}
                        </span>
                      )}
                    </div>
                    <LimitOrderList
                      orders={orders}
                      currentPrices={currentPrices}
                      onCancel={cancelOrder}
                    />
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="info-history-panel"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Tab bar — hidden on devnet (no Protection panel) */}
                  {!isDevnet && (
                    <div className="flex gap-1 mb-4 bg-terminal-card border border-terminal-border rounded-xl p-1">
                      <TabBtn
                        active={rightTab === TAB_INFO}
                        onClick={() => setRightTab(TAB_INFO)}
                        icon={<Info size={12} />}
                        label="Protection"
                      />
                      <TabBtn
                        active={rightTab === TAB_HISTORY}
                        onClick={() => {
                          setRightTab(TAB_HISTORY);
                          fetchTrades();
                        }}
                        icon={<Clock size={12} />}
                        label="History"
                        badge={trades.length > 0 ? trades.length : null}
                      />
                    </div>
                  )}

                  {/* Tab content */}
                  <AnimatePresence mode="wait">
                    {!isDevnet && rightTab === TAB_INFO ? (
                      <motion.div
                        key={`info-${mainTab}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ProtectionPanel
                          showPredictionInfo={mainTab === TAB_MAIN_PREDICT}
                        />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="history"
                        className="bg-terminal-card border border-terminal-border rounded-2xl p-5"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                      >
                        <TradeHistory
                          walletAddress={walletAddress}
                          trades={trades}
                          transfers={received}
                          loading={loading}
                          error={error}
                          onRefresh={() => { fetchTrades(); fetchReceived(); }}
                          dbEnabled={dbEnabled}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.main>
      {(!isMobile || isWalletBrowser || connected) && <AppFooter />}
      <FeedbackButton />
    </div>
  );
}
