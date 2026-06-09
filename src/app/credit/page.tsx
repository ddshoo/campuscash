"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useAppStore } from "@/store/useAppStore";

// ── Score helpers ────────────────────────────────────────────────────────────

function getRating(score: number): string {
  if (score < 580) return "Poor";
  if (score < 670) return "Fair";
  if (score < 740) return "Good";
  return "Excellent";
}

function getUpdatedLabel(): string {
  return new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

// ── SVG Gauge ────────────────────────────────────────────────────────────────

const GAUGE_MIN = 300;
const GAUGE_MAX = 850;

// Convert polar angle (0° = left, 180° = right, sweeping bottom) to SVG x/y
// The arc sits in a 200×110 viewBox, center at (100, 105), radius 90
const CX = 100;
const CY = 105;
const R = 90;
const DOT_R = 6;

function polarToXY(angleDeg: number): { x: number; y: number } {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: CX + R * Math.cos(rad),
    y: CY - R * Math.sin(rad), // subtract: upper semicircle lives above CY
  };
}

// Describe an SVG arc path from startAngle to endAngle (both in degrees, 0=left)
function arcPath(startDeg: number, endDeg: number): string {
  const start = polarToXY(startDeg);
  const end = polarToXY(endDeg);
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${R} ${R} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

// Map a score to an angle: 300 → 180° (left), 850 → 0° (right)
// Arc sweeps from left (180°) to right (0°) going UP through the top
// So we invert: angle = 180 - ((score - 300) / 550) * 180
function scoreToAngle(score: number): number {
  const clamped = Math.max(GAUGE_MIN, Math.min(GAUGE_MAX, score));
  return 180 - ((clamped - GAUGE_MIN) / (GAUGE_MAX - GAUGE_MIN)) * 180;
}

// Zone boundaries as angles (180° = score 300, 0° = score 850)
const ZONES = [
  { start: 180, end: scoreToAngle(580), color: "#EF4444" },  // red   300–580
  { start: scoreToAngle(580), end: scoreToAngle(670), color: "#FBBF24" }, // yellow 580–670
  { start: scoreToAngle(670), end: scoreToAngle(740), color: "#2DD4BF" }, // teal  670–740
  { start: scoreToAngle(740), end: 0, color: "#22C55E" },    // green 740–850
];

function CreditGauge({ score }: { score: number }) {
  const dotAngle = scoreToAngle(score);
  const dot = polarToXY(dotAngle);
  const rating = getRating(score);

  return (
    <svg viewBox="0 0 200 115" className="w-full max-w-[280px] mx-auto">
      {/* Colored zone arcs — thick stroke */}
      {ZONES.map((z, i) => (
        <path
          key={i}
          d={arcPath(z.start, z.end)}
          fill="none"
          stroke={z.color}
          strokeWidth={12}
          strokeLinecap="butt"
        />
      ))}

      {/* White dot indicator */}
      <circle cx={dot.x} cy={dot.y} r={DOT_R + 2} fill="white" />
      <circle cx={dot.x} cy={dot.y} r={DOT_R} fill="#0D3B66" />

      {/* Score number */}
      <text
        x={CX}
        y={74}
        textAnchor="middle"
        fontSize={28}
        fontWeight="bold"
        fill="#0D3B66"
        fontFamily="Arial, sans-serif"
      >
        {score}
      </text>

      {/* YOUR SCORE */}
      <text
        x={CX}
        y={87}
        textAnchor="middle"
        fontSize={7}
        fill="#9CA3AF"
        fontFamily="Arial, sans-serif"
        letterSpacing={1}
      >
        YOUR SCORE
      </text>

      {/* Rating */}
      <text
        x={CX}
        y={99}
        textAnchor="middle"
        fontSize={8}
        fontWeight="bold"
        fill="#0D3B66"
        fontFamily="Arial, sans-serif"
      >
        Rating: {rating}
      </text>

      {/* Range labels */}
      <text x={8} y={112} fontSize={7} fill="#9CA3AF" fontFamily="Arial, sans-serif">
        300
      </text>
      <text x={168} y={112} fontSize={7} fill="#9CA3AF" fontFamily="Arial, sans-serif">
        850
      </text>
    </svg>
  );
}

// ── Chart helpers ────────────────────────────────────────────────────────────

const MONTH_ABBR: Record<string, string> = {
  "01": "Jan", "02": "Feb", "03": "Mar", "04": "Apr",
  "05": "May", "06": "Jun", "07": "Jul", "08": "Aug",
  "09": "Sep", "10": "Oct", "11": "Nov", "12": "Dec",
};

// ── Credit factors ───────────────────────────────────────────────────────────

const FACTORS = [
  { label: "No missed payments", positive: true, detail: "On-time payments boost your score." },
  { label: "High credit utilization", positive: false, detail: "Try to keep utilization below 30%." },
  { label: "Short credit history", positive: false, detail: "Your oldest account is under 2 years." },
];

function ArrowUp() {
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} fill="#22C55E">
      <path d="M4 12l1.41 1.41L11 7.83V20h2V7.83l5.58 5.59L20 12l-8-8-8 8z" />
    </svg>
  );
}

function ArrowDown() {
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} fill="#EF4444">
      <path d="M20 12l-1.41-1.41L13 16.17V4h-2v12.17l-5.58-5.59L4 12l8 8 8-8z" />
    </svg>
  );
}

// ── Credit Simulator ─────────────────────────────────────────────────────────

type SimResult = {
  hypotheticalScore: number;
  delta: number;
  explanation: string;
};

const SIM_EXAMPLES = [
  "What if I pay off my credit card?",
  "What if I open a new account?",
  "What if I miss a payment?",
];

function SimulatorSection({ currentScore }: { currentScore: number }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SimResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSimulate() {
    if (!query.trim() || loading) return;
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creditScore: currentScore, userQuery: query }),
      });
      if (!res.ok) throw new Error("Simulation failed");
      const data = (await res.json()) as SimResult;
      setResult(data);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm px-4 py-4">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between"
      >
        <div className="text-left">
          <p className="text-sm font-semibold text-gray-800">Simulate Your Score</p>
          <p className="text-xs text-gray-400 mt-0.5">
            See how financial actions affect your score
          </p>
        </div>
        <span
          className="text-xs font-semibold px-3 py-1.5 rounded-full text-white"
          style={{ backgroundColor: "#F26522" }}
        >
          {open ? "Close" : "Try it"}
        </span>
      </button>

      {open && (
        <div className="mt-4 flex flex-col gap-3">
          {/* Example chips */}
          <div className="flex flex-wrap gap-2">
            {SIM_EXAMPLES.map((ex) => (
              <button
                key={ex}
                onClick={() => setQuery(ex)}
                className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full"
              >
                {ex}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="flex gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="What would you like to simulate?"
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent"
              style={{ "--tw-ring-color": "#0D3B66" } as React.CSSProperties}
              onKeyDown={(e) => e.key === "Enter" && handleSimulate()}
            />
            <button
              onClick={handleSimulate}
              disabled={loading || !query.trim()}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40"
              style={{ backgroundColor: "#0D3B66" }}
            >
              {loading ? "…" : "Simulate"}
            </button>
          </div>

          {/* Error */}
          {error && (
            <p className="text-xs text-red-500">{error}</p>
          )}

          {/* Result */}
          {result && (
            <div className="bg-gray-50 rounded-xl px-4 py-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">
                    Hypothetical Score
                  </p>
                  <p className="text-3xl font-bold text-navy mt-0.5">
                    {result.hypotheticalScore}
                  </p>
                </div>
                <div
                  className={`flex flex-col items-end`}
                >
                  <span
                    className={`text-xl font-bold ${
                      result.delta >= 0 ? "text-green-600" : "text-red-500"
                    }`}
                  >
                    {result.delta >= 0 ? "+" : ""}
                    {result.delta} pts
                  </span>
                  <span className="text-xs text-gray-400">vs current {currentScore}</span>
                </div>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">{result.explanation}</p>
              <p className="text-[10px] text-gray-400 italic border-t border-gray-200 pt-2">
                This is a simulation — not your real score. Actual results may vary.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" width={22} height={22} fill="white">
      <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
    </svg>
  );
}

export default function CreditPage() {
  const creditScore = useAppStore((s) => s.creditScore);
  const creditHistory = useAppStore((s) => s.creditHistory);
  const [year] = useState(2026);

  const chartData = creditHistory.map((entry) => ({
    month: MONTH_ABBR[entry.date.split("-")[1]] ?? entry.date,
    score: entry.score,
  }));

  const scoreDomain: [number, number] = [
    Math.floor(Math.min(...creditHistory.map((e) => e.score)) / 10) * 10 - 10,
    Math.ceil(Math.max(...creditHistory.map((e) => e.score)) / 10) * 10 + 10,
  ];

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <header className="bg-navy px-4 pt-10 pb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-white text-xl font-bold">Credit Score</h1>
          <button
            aria-label="Notifications"
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10"
          >
            <BellIcon />
          </button>
        </div>
      </header>

      <div className="flex flex-col gap-4 px-4 py-4">
        {/* Gauge card */}
        <div className="bg-white rounded-2xl shadow-sm px-4 pt-6 pb-4">
          <CreditGauge score={creditScore} />
          <div className="mt-3 text-center">
            <p className="text-xs text-gray-400">Updated: {getUpdatedLabel()}</p>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 text-center">
            <p className="text-xs font-semibold text-gray-400 tracking-widest uppercase">
              FICO Score
            </p>
          </div>
        </div>

        {/* Credit history chart card */}
        <div className="bg-white rounded-2xl shadow-sm px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-800">
              Credit Score History
            </h2>
            {/* Year selector — UI only */}
            <div className="flex items-center gap-1.5">
              <button className="text-gray-400 text-xs leading-none" aria-label="Previous year">▲</button>
              <span className="text-xs font-semibold text-gray-700 w-8 text-center">
                {year}
              </span>
              <button className="text-gray-400 text-xs leading-none" aria-label="Next year">▼</button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 10, fill: "#9CA3AF" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={scoreDomain}
                tick={{ fontSize: 10, fill: "#9CA3AF" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 8,
                  border: "none",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                }}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#F26522"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "#F26522", strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Factors card */}
        <div className="bg-white rounded-2xl shadow-sm px-4 py-4">
          <h2 className="text-sm font-semibold text-gray-800 mb-3">
            Factors Affecting Your Score
          </h2>
          <div className="flex flex-col gap-3">
            {FACTORS.map((f) => (
              <div key={f.label} className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0">
                  {f.positive ? <ArrowUp /> : <ArrowDown />}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">{f.label}</p>
                  <p className="text-xs text-gray-400">{f.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Credit Score Simulator */}
        <SimulatorSection currentScore={creditScore} />
      </div>
    </div>
  );
}
