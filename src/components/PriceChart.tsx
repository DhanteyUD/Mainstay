import { useEffect, useRef, useState } from "react";
import {
  SlidersHorizontal,
  AlignHorizontalDistributeCenter,
  CandlestickChart,
  SquareStack,
  Columns2,
  BarChart,
  TrendingUp,
  Pause,
  TrendingDown,
  Activity,
  AlignCenter,
  ArrowUpDown,
  LayoutGrid,
  Waypoints,
  Hash,
  Scissors,
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { GiTicTacToe } from "react-icons/gi";
import { FaWaveSquare } from "react-icons/fa";
import { RiBarChart2Line } from "react-icons/ri";
import { BsSliders2Vertical } from "react-icons/bs";
import { IoAnalyticsOutline } from "react-icons/io5";
import { PiWaveTriangleDuotone } from "react-icons/pi";
import { TbWaveSquare, TbChartAreaLineFilled } from "react-icons/tb";
import {
  MdCandlestickChart,
  MdOutlineShowChart,
  MdOutlineWaterfallChart,
  MdStackedLineChart,
} from "react-icons/md";
import type { Token } from "../types";

const CONTAINER_ID = "mainstay_sol_chart";
const USD_LIKE = new Set(["USDC", "USDT", "USD"]);

interface ChartStyle {
  value: string;
  Icon: React.ComponentType<{ size?: number | string; className?: string }>;
  title: string;
}

const CHART_STYLES: ChartStyle[] = [
  { value: "0", Icon: SlidersHorizontal, title: "Bars" },
  { value: "1", Icon: AlignHorizontalDistributeCenter, title: "Candles" },
  { value: "2", Icon: MdOutlineShowChart, title: "Line" },
  { value: "3", Icon: TbChartAreaLineFilled, title: "Area" },
  { value: "4", Icon: SquareStack, title: "Renko" },
  { value: "5", Icon: FaWaveSquare, title: "Kagi" },
  { value: "6", Icon: GiTicTacToe, title: "Point & Figure" },
  { value: "7", Icon: MdOutlineWaterfallChart, title: "Line Break" },
  { value: "8", Icon: CandlestickChart, title: "Heikin Ashi" },
  { value: "9", Icon: MdCandlestickChart, title: "Hollow Candles" },
  { value: "10", Icon: PiWaveTriangleDuotone, title: "Baseline" },
  { value: "11", Icon: BsSliders2Vertical, title: "Range" },
  { value: "12", Icon: Pause, title: "High-Low" },
  { value: "13", Icon: RiBarChart2Line, title: "Columns" },
  { value: "14", Icon: IoAnalyticsOutline, title: "Line w/ Markers" },
  { value: "15", Icon: TbWaveSquare, title: "Step Line" },
  { value: "16", Icon: MdStackedLineChart, title: "HLC Area" },
];

function getChartSymbol(
  inputToken: Token | null,
  outputToken: Token | null,
): string {
  const inSym = (inputToken?.symbol || "SOL").toUpperCase();
  const outSym = (outputToken?.symbol || "USDC").toUpperCase();
  const base = USD_LIKE.has(outSym) ? inSym : outSym;
  return `BINANCE:${base}USDT`;
}

function getChartLabel(
  inputToken: Token | null,
  outputToken: Token | null,
): string {
  const inSym = (inputToken?.symbol || "SOL").toUpperCase();
  const outSym = (outputToken?.symbol || "USDC").toUpperCase();
  const base = USD_LIKE.has(outSym) ? inSym : outSym;
  return `${base} / USD`;
}

interface PriceChartProps {
  solPrice: number | null;
  inputToken: Token | null;
  outputToken: Token | null;
}

export default function PriceChart({
  solPrice,
  inputToken,
  outputToken,
}: PriceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetReady = useRef(false);
  const [styleIndex, setStyleIndex] = useState(1);
  const chartStyle = CHART_STYLES[styleIndex].value;

  const {
    Icon: ActiveIcon,
    title: activeTitle,
    value: activeValue,
  } = CHART_STYLES[styleIndex];

  const prevStyle = () =>
    setStyleIndex((i) => (i - 1 + CHART_STYLES.length) % CHART_STYLES.length);
  const nextStyle = () => setStyleIndex((i) => (i + 1) % CHART_STYLES.length);

  const firstPrice = useRef<number | null>(null);
  const sessionHigh = useRef<number | null>(null);
  const sessionLow = useRef<number | null>(null);

  const chartSymbol = getChartSymbol(inputToken, outputToken);
  const chartLabel = getChartLabel(inputToken, outputToken);

  const inSym = (inputToken?.symbol || "SOL").toUpperCase();
  const outSym = (outputToken?.symbol || "USDC").toUpperCase();
  const baseSym = USD_LIKE.has(outSym) ? inSym : outSym;
  const isSolPair = baseSym === "SOL";

  if (isSolPair && solPrice != null) {
    if (firstPrice.current === null) firstPrice.current = solPrice;
    if (sessionHigh.current === null || solPrice > sessionHigh.current)
      sessionHigh.current = solPrice;
    if (sessionLow.current === null || solPrice < sessionLow.current)
      sessionLow.current = solPrice;
  }

  const change =
    firstPrice.current != null && solPrice != null && firstPrice.current !== 0
      ? ((solPrice - firstPrice.current) / firstPrice.current) * 100
      : 0;
  const isUp = change >= 0;

  const fmt = (n: number | null): string =>
    n != null
      ? `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : "—";

  useEffect(() => {
    firstPrice.current = null;
    sessionHigh.current = null;
    sessionLow.current = null;

    if (!containerRef.current) return;

    const createWidget = () => {
      if (!window.TradingView || !document.getElementById(CONTAINER_ID)) return;
      if (widgetReady.current) return;

      new window.TradingView.widget({
        autosize: true,
        symbol: chartSymbol,
        interval: "15",
        timezone: "Etc/UTC",
        theme: "dark",
        style: chartStyle,
        container_id: CONTAINER_ID,
        toolbar_bg: "#0d1117",
        hide_top_toolbar: true,
        hide_side_toolbar: true,
        hide_legend: true,
        allow_symbol_change: false,
        save_image: false,
        details: false,
        hotlist: false,
        calendar: false,
        withdateranges: false,
        enable_publishing: false,
        backgroundColor: "#0d1117",
        gridColor: "rgba(255,255,255,0.04)",
        overrides: {
          "paneProperties.background": "#0d1117",
          "paneProperties.backgroundType": "solid",
          "paneProperties.vertGridProperties.color": "rgba(255,255,255,0.04)",
          "paneProperties.horzGridProperties.color": "rgba(255,255,255,0.04)",
          "scalesProperties.backgroundColor": "#0d1117",
          "scalesProperties.textColor": "#4b5563",
          "mainSeriesProperties.candleStyle.upColor": "#22c55e",
          "mainSeriesProperties.candleStyle.downColor": "#ef4444",
          "mainSeriesProperties.candleStyle.borderUpColor": "#22c55e",
          "mainSeriesProperties.candleStyle.borderDownColor": "#ef4444",
          "mainSeriesProperties.candleStyle.wickUpColor": "#22c55e",
          "mainSeriesProperties.candleStyle.wickDownColor": "#ef4444",
        },
      });

      widgetReady.current = true;
    };

    if (window.TradingView) {
      createWidget();
    } else {
      const script = document.createElement("script");
      script.src = "https://s3.tradingview.com/tv.js";
      script.async = true;
      script.onload = createWidget;
      document.head.appendChild(script);
    }

    return () => {
      const el = document.getElementById(CONTAINER_ID);
      if (el) el.innerHTML = "";
      widgetReady.current = false;
    };
  }, [chartSymbol, chartStyle]);

  return (
    <div className="rounded-xl border border-terminal-border bg-terminal-card overflow-hidden mb-6">
      <div className="flex items-center justify-between px-4 py-3 border-b border-terminal-border">
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-terminal-dim flex items-center gap-1.5">
            <Activity size={11} className="text-terminal-accent" /> {chartLabel}
          </span>
          {isSolPair && solPrice != null && (
            <span className="font-mono text-[13px] font-bold text-terminal-text">
              $
              {solPrice.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-0.5 bg-terminal-border/30 rounded-md p-0.5">
            <button
              onClick={prevStyle}
              className="p-1 rounded text-terminal-dim hover:text-terminal-text transition-colors"
            >
              <ChevronLeft size={12} />
            </button>
            <div className="flex items-center gap-1 px-2 min-w-[90px] justify-center">
              <ActiveIcon
                size={13}
                className={`text-terminal-accent flex-shrink-0 ${activeValue === "0" ? "rotate-90" : ""}`}
              />
              <span className="text-[9px] font-mono uppercase tracking-wider text-terminal-text whitespace-nowrap">
                {activeTitle}
              </span>
            </div>
            <button
              onClick={nextStyle}
              className="p-1 rounded text-terminal-dim hover:text-terminal-text transition-colors"
            >
              <ChevronRight size={12} />
            </button>
          </div>
          <span className="text-[9px] uppercase tracking-wider text-terminal-dim font-mono">
            15m
          </span>
        </div>
      </div>

      <div className="relative h-64" style={{ background: "#0d1117" }}>
        <div id={CONTAINER_ID} ref={containerRef} className="w-full h-full" />
      </div>

      {isSolPair && (
        <div className="grid grid-cols-4 divide-x divide-terminal-border border-t border-terminal-border bg-terminal-card/60">
          {[
            { label: "OPEN", value: fmt(firstPrice.current) },
            {
              label: "HIGH",
              value: fmt(sessionHigh.current),
              color: "text-green-400",
            },
            {
              label: "LOW",
              value: fmt(sessionLow.current),
              color: "text-red-400",
            },
            {
              label: "",
              render:
                isSolPair && solPrice != null ? (
                  <span
                    className={`font-mono text-[11px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 ${
                      isUp
                        ? "text-green-400 bg-green-400/10"
                        : "text-red-400 bg-red-400/10"
                    }`}
                  >
                    {isUp ? (
                      <TrendingUp size={11} />
                    ) : (
                      <TrendingDown size={11} />
                    )}
                    {isUp ? "+" : "-"}
                    {Math.abs(change).toFixed(2)}%
                  </span>
                ) : (
                  <span className="text-[11px] font-mono font-bold text-terminal-text">
                    —
                  </span>
                ),
            },
          ].map(({ label, value, color, render }) => (
            <div
              key={label}
              className="flex flex-col justify-center items-center py-2 gap-0.5"
            >
              <span className="text-[8px] font-mono uppercase tracking-widest text-terminal-dim">
                {label}
              </span>
              {render ?? (
                <span
                  className={`text-[11px] font-mono font-bold ${color ?? "text-terminal-text"}`}
                >
                  {value}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
