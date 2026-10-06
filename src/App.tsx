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

import Documentation from "./pages/documentation";
import LandingPage from "./pages/landing";
import LoginScreen from "./components/LoginScreen";
import AppHeader from "./components/AppHeader";
import AppFooter from "./components/AppFooter";
import PriceChart from "./components/PriceChart";
import SwapInterface from "./components/SwapInterface";
import LimitOrderForm from "./components/LimitOrderForm";
import LimitOrderList from "./components/LimitOrderList";
import TelegramConnect from "./components/TelegramConnect";
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
import DashboardCustomizer, {
  useDashboardLayout,
} from "./components/DashboardCustomizer";

import { isMobile } from "./lib/device";
import { WalletBrowserSignedOut } from "./components/MobileWalletGateway";
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
import type { Token, ReceivedTransfer } from "./types";

function useIsWalletBrowser() {
  const detect = () =>
    Boolean(window.phantom?.solana) ||
    Boolean(window.solana?.isPhantom) ||
    Boolean(window.solflare?.isSolflare) ||
    Boolean(window.solana?.isSolflare);

  const [isWalletBrowser, setIsWalletBrowser] = useState(detect);

  useEffect(() => {
    if (isWalletBrowser) return;
    let attempts = 0;
    const id = setInterval(() => {
      if (detect()) {
        setIsWalletBrowser(true);
        clearInterval(id);
      }
      if (++attempts >= 10) clearInterval(id);
    }, 200);
    return () => clearInterval(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return isWalletBrowser;
}

export default function App() {
  if (window.location.pathname === "/documentation") {
    return <Documentation />;
  }
  return <AppInner />;
}

function AppInner() {
  const { user, loading: authLoading, signedOut } = useAuth();
  const { dismissed, dismiss } = useOnboarding();
  const isWalletBrowser = useIsWalletBrowser();

  const [appLaunched, setAppLaunched] = useState(() => {
    try {
      return localStorage.getItem("mainstay_app_launched") === "true";
    } catch {
      return false;
    }
  });

  function handleLaunch() {
    try {
      localStorage.setItem("mainstay_app_launched", "true");
    } catch {
      /* silent */
    }
    setAppLaunched(true);
  }

  if (authLoading) {
    return (
      <div className="fixed inset-0 bg-terminal-bg flex items-center justify-center">
        <div
          className="fixed inset-0 pointer-events-none opacity-[0.015]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(0,229,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,1) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <span className="relative font-mono text-[11px] text-terminal-dim tracking-[0.2em] animate-pulse">
          Authenticating
        </span>
      </div>
    );
  }

  if (!user && !appLaunched && !(isMobile && isWalletBrowser)) {
    return (
      <>
        <LandingPage onLaunch={handleLaunch} />
        <FeedbackButton />
      </>
    );
  }

  if (!dismissed)
    return (
      <>
        <OnboardingScreen onDismiss={dismiss} />
        <FeedbackButton />
      </>
    );

  if (isMobile && isWalletBrowser) {
    if (signedOut) return <WalletBrowserSignedOut />;
    return <MainApp />;
  }

  if (!user)
    return (
      <>
        <LoginScreen />
        <FeedbackButton />
      </>
    );

  return <MainApp />;
}

function MainApp() {
  const isWalletBrowser = useIsWalletBrowser();
  const { isDevnet } = useNetwork();
  const { publicKey, connected } = useWallet();
  const walletAddress = publicKey?.toBase58() || null;

  const {
    trades,
    loading,
    error,
    saveTrade,
    saveTransfer,
    saveReceived,
    fetchTrades,
    dbEnabled,
  } = useTrades(walletAddress);
  const { received, fetchReceived } = useReceivedTransfers(walletAddress);
  const savedReceivedSigs = useRef(new Set<string>());
  const { orders, currentPrices, addOrder, cancelOrder, pendingCount } =
    useLimitOrders();
  const { solPrice, priceLoading, uptimePct, riskLevel } = useNetworkStats();
  const { balance: solBalance } = useWalletBalance();

  const [mainTab, setMainTab] = useState(TAB_MAIN_SWAP);
  const [rightTab, setRightTab] = useState(TAB_INFO);
  const [chartTokens, setChartTokens] = useState<{
    inputToken: Token;
    outputToken: Token;
  }>({
    inputToken: TOKENS.SOL,
    outputToken: TOKENS.USDC,
  });

  const [balanceHidden, setBalanceHidden] = useState(
    () => localStorage.getItem("mainstay_balance_hidden") === "true",
  );

  const { order, visibility, saveLayout } = useDashboardLayout();

  function toggleBalanceHidden() {
    setBalanceHidden((v) => {
      localStorage.setItem("mainstay_balance_hidden", String(!v));
      return !v;
    });
  }

  useEffect(() => {
    if (connected && walletAddress) {
      fetchTrades();
      fetchReceived();
    }
  }, [connected, walletAddress, isDevnet]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    received.forEach((item: ReceivedTransfer) => {
      if (!item.signature || savedReceivedSigs.current.has(item.signature))
        return;
      savedReceivedSigs.current.add(item.signature);
      saveReceived(item);
    });
  }, [received]); // eslint-disable-line react-hooks/exhaustive-deps

  const risk = RISK_STYLES[riskLevel ?? "LOW"] ?? RISK_STYLES.LOW;
  const uptime =
    uptimePct === null || Number(uptimePct) >= 90
      ? UPTIME_STYLES.ok
      : UPTIME_STYLES.bad;

  function renderWidget(id: string) {
    if (!visibility[id]) return null;

    if (id === "wallet") {
      return (
        <motion.div
          key="wallet"
          layout
          transition={{ type: "spring", damping: 25, stiffness: 220 }}
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
        </motion.div>
      );
    }

    if (id === "chart") {
      return (
        <motion.div
          key="chart"
          layout
          transition={{ type: "spring", damping: 25, stiffness: 220 }}
        >
          <PriceChart
            solPrice={solPrice}
            inputToken={chartTokens.inputToken}
            outputToken={chartTokens.outputToken}
          />
        </motion.div>
      );
    }

    if (id === "trading") {
      return (
        <motion.div
          key="trading"
          layout
          transition={{ type: "spring", damping: 25, stiffness: 220 }}
        >
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

          <div className="flex flex-col lg:flex-row gap-6 items-start justify-center mb-5">
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
                        <TrendingUp
                          size={14}
                          className="text-terminal-yellow"
                        />
                        <span className="font-mono font-bold text-xs tracking-wider text-terminal-yellow">
                          PENDING ORDERS
                        </span>
                        {pendingCount > 0 && (
                          <span className="ml-auto inline-flex items-center justify-center min-w-[18px] h-4 px-1 rounded-full bg-terminal-yellow/20 text-terminal-yellow text-xs font-bold">
                            {pendingCount}
                          </span>
                        )}
                      </div>
                      <TelegramConnect />
                      <LimitOrderList
                        orders={orders}
                        currentPrices={currentPrices}
                        onCancel={cancelOrder}
                      />
                    </div>
                  </motion.div>
                ) : mainTab === TAB_MAIN_PREDICT ? (
                  <motion.div
                    key="predict-panel"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ProtectionPanel showPredictionInfo={true} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="info-history-panel"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                  >
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

                    <AnimatePresence mode="wait">
                      {!isDevnet && rightTab === TAB_INFO ? (
                        <motion.div
                          key="info-swap"
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ProtectionPanel showPredictionInfo={false} />
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
                            onRefresh={() => {
                              fetchTrades();
                              fetchReceived();
                            }}
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
        </motion.div>
      );
    }

    return null;
  }

  return (
    <div className="min-h-screen bg-terminal-bg relative flex flex-col">
      <div className="scan-line" />

      <div
        className="fixed inset-0 pointer-events-none opacity-[0.015]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,229,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,1) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

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
        className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-8 flex-1 w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        style={
          isMobile && !isWalletBrowser && !connected
            ? { display: "none" }
            : undefined
        }
      >
        <AnimatePresence>{order.map((id) => renderWidget(id))}</AnimatePresence>
      </motion.main>

      {(!isMobile || isWalletBrowser || connected) && <AppFooter />}
      <FeedbackButton />
      <DashboardCustomizer
        order={order}
        visibility={visibility}
        onSave={saveLayout}
      />
    </div>
  );
}
