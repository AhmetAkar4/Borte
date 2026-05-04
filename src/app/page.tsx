"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import dynamic from "next/dynamic";

// Dynamic import to avoid SSR issues with Leaflet
const MapComponent = dynamic(() => import("@/components/MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-[#0a0a0a]">
      <div className="text-center">
        <div className="w-8 h-8 border border-[#00d4ff] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-[#00d4ff] text-xs font-mono opacity-60 tracking-widest">
          HARİTA YÜKLENİYOR...
        </p>
      </div>
    </div>
  ),
});

// ─── Data ────────────────────────────────────────────────────────────────────

const CITIES = [
  { id: "ist", name: "İstanbul", districts: ["Kadıköy", "Beşiktaş", "Şişli", "Üsküdar", "Fatih", "Beyoğlu", "Bakırköy", "Ataşehir"], lat: 41.0082, lng: 28.9784, zoom: 11 },
  { id: "ank", name: "Ankara", districts: ["Çankaya", "Keçiören", "Mamak", "Yenimahalle", "Altındağ", "Etimesgut"], lat: 39.9208, lng: 32.8541, zoom: 11 },
  { id: "izm", name: "İzmir", districts: ["Konak", "Karşıyaka", "Bornova", "Buca", "Çiğli", "Bayraklı"], lat: 38.4237, lng: 27.1428, zoom: 11 },
  { id: "brs", name: "Bursa", districts: ["Nilüfer", "Osmangazi", "Yıldırım", "Mudanya", "Gürsu"], lat: 40.1828, lng: 29.0665, zoom: 11 },
  { id: "ant", name: "Antalya", districts: ["Muratpaşa", "Konyaaltı", "Kepez", "Alanya", "Manavgat"], lat: 36.8841, lng: 30.7056, zoom: 11 },
  { id: "koc", name: "Kocaeli", districts: ["İzmit", "Gebze", "Darıca", "Körfez", "Gölcük"], lat: 40.7654, lng: 29.9408, zoom: 11 },
  { id: "mer", name: "Mersin", districts: ["Yenişehir", "Mezitli", "Toroslar", "Akdeniz", "Tarsus"], lat: 36.8121, lng: 34.6415, zoom: 11 },
  { id: "diy", name: "Diyarbakır", districts: ["Bağlar", "Kayapınar", "Sur", "Yenişehir", "Ergani"], lat: 37.9144, lng: 40.2306, zoom: 11 },
];

interface SimResult {
  risk: number;
  impact: number;
  decision: "ONAYLANDI" | "REVİZE EDİLMELİ" | "RET";
  decisionCode: string;
  timestamp: string;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function HeaderBar({ time }: { time: string }) {
  return (
    <header className="relative flex items-center justify-between px-6 py-3 border-b border-[#1a2332] bg-[#0d1117] z-10 flex-shrink-0">
      {/* Left */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="status-dot" />
          <span className="text-[9px] tracking-[0.3em] text-[#00d4ff] uppercase font-display font-bold">
            KARAR-SİS
          </span>
        </div>
        <div className="h-4 w-px bg-[#1a2332]" />
        <span className="text-[9px] tracking-widest text-[#444] uppercase">
          v4.7.2 — AKTIF
        </span>
      </div>

      {/* Center title */}
      <div className="absolute left-1/2 -translate-x-1/2 text-center">
        <h1 className="text-[11px] tracking-[0.4em] text-[#c0c0c0] uppercase font-display">
          KAMU KARAR DESTEK PANELİ
        </h1>
      </div>

      {/* Right */}
      <div className="flex items-center gap-4">
        <span className="text-[9px] tracking-widest text-[#444]">
          {time}
        </span>
        <div className="h-4 w-px bg-[#1a2332]" />
        <div className="flex items-center gap-1.5">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-sm"
              style={{
                background: i < 2 ? "#00d4ff" : "#1a2332",
                boxShadow: i < 2 ? "0 0 4px #00d4ff" : "none",
              }}
            />
          ))}
        </div>
      </div>

      {/* Bottom scan line */}
      <div className="absolute bottom-0 left-0 right-0 grid-line" />
    </header>
  );
}

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit: string;
  formatValue?: (v: number) => string;
  onChange: (v: number) => void;
}

function NeonSlider({ label, value, min, max, step = 1, unit, formatValue, onChange }: SliderProps) {
  const pct = ((value - min) / (max - min)) * 100;
  const displayVal = formatValue ? formatValue(value) : value.toString();

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[9px] tracking-[0.25em] text-[#666] uppercase">{label}</span>
        <div className="flex items-baseline gap-1">
          <span className="text-base font-display font-bold neon-text">{displayVal}</span>
          <span className="text-[9px] text-[#444] tracking-wider">{unit}</span>
        </div>
      </div>
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{ "--val": `${pct}%` } as React.CSSProperties}
          className="w-full h-3 cursor-pointer"
        />
      </div>
      <div className="flex justify-between text-[8px] text-[#333] tracking-wider">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
}

interface ResultCardProps {
  label: string;
  value: string;
  subValue?: string;
  type: "risk" | "impact" | "decision";
  decisionType?: SimResult["decision"];
  delay: number;
}

function ResultCard({ label, value, subValue, type, decisionType, delay }: ResultCardProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  const getDecisionColor = () => {
    if (type !== "decision") return "#00d4ff";
    if (decisionType === "ONAYLANDI") return "#00ff88";
    if (decisionType === "REVİZE EDİLMELİ") return "#ffaa00";
    return "#ff4444";
  };

  const getDecisionGlow = () => {
    if (type !== "decision") return "rgba(0,212,255,0.15)";
    if (decisionType === "ONAYLANDI") return "rgba(0,255,136,0.1)";
    if (decisionType === "REVİZE EDİLMELİ") return "rgba(255,170,0,0.1)";
    return "rgba(255,68,68,0.1)";
  };

  const color = getDecisionColor();
  const glow = getDecisionGlow();

  if (!show) return <div className="h-32 glass-card rounded" />;

  return (
    <div
      className="relative rounded overflow-hidden animate-fade-slide"
      style={{
        background: `rgba(13,17,23,0.7)`,
        backdropFilter: "blur(16px)",
        border: `1px solid ${color}33`,
        boxShadow: `0 0 20px ${glow}, inset 0 1px 0 ${color}1a`,
      }}
    >
      {/* Top accent bar */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
          opacity: 0.8,
        }}
      />

      <div className="p-4">
        {/* Label */}
        <div className="flex items-center gap-2 mb-3">
          <div
            className="w-1 h-3 rounded-full"
            style={{ background: color, boxShadow: `0 0 6px ${color}` }}
          />
          <span className="text-[8px] tracking-[0.3em] uppercase" style={{ color: `${color}99` }}>
            {label}
          </span>
        </div>

        {/* Value */}
        <div
          className="font-display font-bold animate-count-up"
          style={{
            fontSize: type === "decision" ? "1rem" : "2rem",
            color,
            textShadow: `0 0 20px ${color}88, 0 0 40px ${color}44`,
            lineHeight: 1,
          }}
        >
          {value}
        </div>

        {subValue && (
          <p className="mt-2 text-[9px] tracking-widest" style={{ color: `${color}66` }}>
            {subValue}
          </p>
        )}
      </div>

      {/* Corner decorations */}
      <div
        className="absolute bottom-2 right-2 w-4 h-4"
        style={{
          borderBottom: `1px solid ${color}44`,
          borderRight: `1px solid ${color}44`,
        }}
      />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Page() {
  const [selectedCity, setSelectedCity] = useState(CITIES[0]);
  const [selectedDistrict, setSelectedDistrict] = useState(CITIES[0].districts[0]);
  const [budget, setBudget] = useState(50);
  const [duration, setDuration] = useState(12);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SimResult | null>(null);
  const [time, setTime] = useState("");
  const [loadingStep, setLoadingStep] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const LOADING_STEPS = [
    "VERİ AKIŞI BAŞLATILIYOR...",
    "PARAMETRE MATRİSİ HESAPLANYOR...",
    "RİSK MODELİ ANALİZ EDİLİYOR...",
    "KARAR ALGORİTMASI ÇALIŞIYOR...",
    "SONUÇLAR DERLENİYOR...",
  ];

  useEffect(() => {
    const update = () => setTime(new Date().toLocaleTimeString("tr-TR", { hour12: false }));
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, []);

  const handleCityChange = useCallback((cityId: string) => {
    const city = CITIES.find((c) => c.id === cityId);
    if (city) {
      setSelectedCity(city);
      setSelectedDistrict(city.districts[0]);
      setResult(null);
    }
  }, []);

  const runSimulation = async () => {
    setLoading(true);
    setResult(null);
    setLoadingStep(0);

    // Animate through steps
    let step = 0;
    intervalRef.current = setInterval(() => {
      step++;
      if (step < LOADING_STEPS.length) {
        setLoadingStep(step);
      } else {
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
    }, 500);

    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) throw new Error("GEMINI_API_KEY tanımlı değil, fallback'e düşülüyor.");

      const { GoogleGenerativeAI } = await import("@google/generative-ai");
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        generationConfig: { responseMimeType: "application/json" },
      });

      const prompt = `Sen bir kamu yatırım risk analiz sistemisin. Verilen parametreler için JSON formatında sonuç üret.
Sadece şu formatta JSON dön, başka hiçbir şey yazma:
{"risk": <0-100 arası integer>, "impact": <0-100 arası integer>, "decision": <"ONAYLANDI" | "REVİZE EDİLMELİ" | "RET">, "decisionCode": <"APR-XXXX" | "REV-XXXX" | "RJT-XXXX">}
Mantıklı değerler üret: yüksek bütçe ve uzun süre düşük riski; düşük bütçe kısa süre yüksek riski gösterir.
Şehir: ${selectedCity.name}, İlçe: ${selectedDistrict}, Bütçe: ${budget}M TL, Süre: ${duration} ay.`;

      if (intervalRef.current) clearInterval(intervalRef.current);

      const geminiResult = await model.generateContent(prompt);
      const text = geminiResult.response.text();
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);

      setResult({
        risk: parsed.risk ?? Math.floor(Math.random() * 60) + 20,
        impact: parsed.impact ?? Math.floor(Math.random() * 40) + 50,
        decision: parsed.decision ?? "REVİZE EDİLMELİ",
        decisionCode: parsed.decisionCode ?? "REV-2024",
        timestamp: new Date().toLocaleTimeString("tr-TR"),
      });
    } catch {
      if (intervalRef.current) clearInterval(intervalRef.current);
      // Fallback random result
      const r = Math.floor(Math.random() * 60) + 20;
      const imp = Math.floor(Math.random() * 40) + 50;
      const dec: SimResult["decision"] = r < 35 ? "ONAYLANDI" : r < 65 ? "REVİZE EDİLMELİ" : "RET";
      setResult({
        risk: r,
        impact: imp,
        decision: dec,
        decisionCode: `${dec === "ONAYLANDI" ? "APR" : dec === "REVİZE EDİLMELİ" ? "REV" : "RJT"}-${Math.floor(Math.random() * 9000 + 1000)}`,
        timestamp: new Date().toLocaleTimeString("tr-TR"),
      });
    }

    setLoading(false);
  };

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0a] overflow-hidden">
      {/* Scan line overlay */}
      <div className="scan-overlay" />

      {/* Header */}
      <HeaderBar time={time} />

      {/* Main 3-column layout */}
      <div className="flex-1 flex gap-0 overflow-hidden min-h-0">

        {/* ── LEFT PANEL: Controls ─────────────────────────────────── */}
        <aside className="w-72 flex-shrink-0 bg-[#0d1117] border-r border-[#1a2332] flex flex-col overflow-y-auto">
          {/* Panel header */}
          <div className="px-5 py-3 border-b border-[#1a2332]">
            <div className="flex items-center gap-2">
              <div className="w-px h-3 bg-[#00d4ff] opacity-60" />
              <span className="text-[8px] tracking-[0.35em] text-[#444] uppercase">
                PARAMETRE KONTROLCÜSÜ
              </span>
            </div>
          </div>

          <div className="flex-1 p-5 space-y-6">
            {/* Location selector */}
            <div className="space-y-3">
              <label className="block text-[8px] tracking-[0.3em] text-[#666] uppercase">
                LOKASYON SEÇİCİ
              </label>

              {/* City dropdown */}
              <div className="space-y-1">
                <span className="text-[7px] tracking-widest text-[#444] uppercase">ŞEHİR</span>
                <div className="relative">
                  <select
                    value={selectedCity.id}
                    onChange={(e) => handleCityChange(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-[#1a2332] text-[#c0c0c0] text-[10px] px-3 py-2.5 pr-8 rounded focus:outline-none focus:border-[#00d4ff] tracking-wider transition-colors"
                  >
                    {CITIES.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* District dropdown */}
              <div className="space-y-1">
                <span className="text-[7px] tracking-widest text-[#444] uppercase">İLÇE</span>
                <div className="relative">
                  <select
                    value={selectedDistrict}
                    onChange={(e) => setSelectedDistrict(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-[#1a2332] text-[#c0c0c0] text-[10px] px-3 py-2.5 pr-8 rounded focus:outline-none focus:border-[#00d4ff] tracking-wider transition-colors"
                  >
                    {selectedCity.districts.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-[#1a2332] to-transparent" />

            {/* Budget slider */}
            <NeonSlider
              label="BÜTÇE AYARI"
              value={budget}
              min={5}
              max={500}
              step={5}
              unit="M TL"
              formatValue={(v) => v >= 100 ? (v / 1000 * 10).toFixed(0) === "0" ? v.toString() : v.toString() : v.toString()}
              onChange={setBudget}
            />

            {/* Duration slider */}
            <NeonSlider
              label="SÜRE AYARI"
              value={duration}
              min={1}
              max={60}
              unit=" AY"
              onChange={setDuration}
            />

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-[#1a2332] to-transparent" />

            {/* Current selection summary */}
            <div className="space-y-2 p-3 bg-[#0a0a0a] rounded border border-[#1a2332]">
              <p className="text-[7px] tracking-[0.3em] text-[#444] uppercase mb-2">
                AKTİF PARAMETRELER
              </p>
              {[
                ["KONUM", `${selectedCity.name} / ${selectedDistrict}`],
                ["BÜTÇE", `${budget}M TL`],
                ["SÜRE", `${duration} AY`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between items-center">
                  <span className="text-[7px] text-[#444] tracking-widest">{k}</span>
                  <span className="text-[9px] text-[#00d4ff] font-mono">{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Simulate button */}
          <div className="p-5 border-t border-[#1a2332]">
            <button
              onClick={runSimulation}
              disabled={loading}
              className="w-full relative overflow-hidden group"
              style={{
                background: loading
                  ? "rgba(0,212,255,0.05)"
                  : "linear-gradient(135deg, rgba(0,212,255,0.15) 0%, rgba(0,212,255,0.05) 100%)",
                border: "1px solid",
                borderColor: loading ? "#1a2332" : "#00d4ff",
                borderRadius: "4px",
                padding: "14px 20px",
                boxShadow: loading ? "none" : "0 0 20px rgba(0,212,255,0.15), inset 0 0 20px rgba(0,212,255,0.03)",
                transition: "all 0.3s",
              }}
            >
              {/* Shimmer effect */}
              {!loading && (
                <div
                  className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"
                  style={{
                    background: "linear-gradient(90deg, transparent, rgba(0,212,255,0.15), transparent)",
                  }}
                />
              )}

              {loading ? (
                <div className="flex items-center justify-center gap-3">
                  <div
                    className="w-3 h-3 border border-[#00d4ff] border-t-transparent rounded-full animate-spin"
                    style={{ borderTopColor: "transparent" }}
                  />
                  <span className="text-[8px] tracking-[0.3em] text-[#00d4ff] animate-scan-pulse">
                    {LOADING_STEPS[loadingStep]}
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-3">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <polygon points="2,1 11,6 2,11" fill="#00d4ff" />
                  </svg>
                  <span
                    className="text-[10px] tracking-[0.35em] font-display font-bold"
                    style={{ color: "#00d4ff", textShadow: "0 0 10px rgba(0,212,255,0.6)" }}
                  >
                    SİMÜLASYONU BAŞLAT
                  </span>
                </div>
              )}
            </button>
          </div>
        </aside>

        {/* ── CENTER PANEL: Map ─────────────────────────────────────── */}
        <main className="flex-1 relative min-w-0">
          {/* Map overlay label */}
          <div
            className="absolute top-4 left-4 z-[1000] px-3 py-1.5 rounded"
            style={{
              background: "rgba(13,17,23,0.85)",
              backdropFilter: "blur(8px)",
              border: "1px solid #1a2332",
            }}
          >
            <div className="flex items-center gap-2">
              <div className="status-dot" style={{ width: 6, height: 6 }} />
              <span className="text-[8px] tracking-widest text-[#666] uppercase">
                {selectedCity.name.toUpperCase()} — {selectedDistrict.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Corner decorations */}
          <div className="absolute top-3 right-3 z-[1000] w-6 h-6 pointer-events-none"
            style={{ borderTop: "1px solid rgba(0,212,255,0.3)", borderRight: "1px solid rgba(0,212,255,0.3)" }} />
          <div className="absolute bottom-3 left-3 z-[1000] w-6 h-6 pointer-events-none"
            style={{ borderBottom: "1px solid rgba(0,212,255,0.3)", borderLeft: "1px solid rgba(0,212,255,0.3)" }} />

          <MapComponent city={selectedCity} />
        </main>

        {/* ── RIGHT PANEL: Analysis Output ─────────────────────────── */}
        <aside className="w-72 flex-shrink-0 bg-[#0d1117] border-l border-[#1a2332] flex flex-col">
          {/* Panel header */}
          <div className="px-5 py-3 border-b border-[#1a2332]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-px h-3 bg-[#00d4ff] opacity-60" />
                <span className="text-[8px] tracking-[0.35em] text-[#444] uppercase">
                  ANALİZ ÇIKTILARI
                </span>
              </div>
              {result && (
                <span className="text-[7px] tracking-widest text-[#444]">
                  {result.timestamp}
                </span>
              )}
            </div>
          </div>

          <div className="flex-1 p-5 flex flex-col gap-4 overflow-y-auto">
            {!result && !loading && (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                {/* Idle state visual */}
                <div className="relative w-20 h-20">
                  <div
                    className="absolute inset-0 rounded-full border animate-ping"
                    style={{ borderColor: "rgba(0,212,255,0.1)", animationDuration: "3s" }}
                  />
                  <div
                    className="absolute inset-2 rounded-full border"
                    style={{ borderColor: "rgba(0,212,255,0.15)" }}
                  />
                  <div
                    className="absolute inset-4 rounded-full border"
                    style={{ borderColor: "rgba(0,212,255,0.2)" }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="status-dot" style={{ width: 10, height: 10 }} />
                  </div>
                </div>
                <div>
                  <p className="text-[9px] tracking-[0.3em] text-[#444] uppercase mb-1">
                    BEKLEME MODUNDA
                  </p>
                  <p className="text-[8px] text-[#333] tracking-wider">
                    Parametreleri ayarlayın ve
                  </p>
                  <p className="text-[8px] text-[#333] tracking-wider">
                    simülasyonu başlatın.
                  </p>
                </div>
              </div>
            )}

            {loading && (
              <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                <div className="relative">
                  <div className="w-16 h-16 border border-[#00d4ff] border-t-transparent rounded-full animate-spin"
                    style={{ borderTopColor: "transparent" }} />
                  <div className="absolute inset-2 w-12 h-12 border border-[#00d4ff] border-b-transparent rounded-full animate-spin"
                    style={{ animationDirection: "reverse", animationDuration: "0.8s", borderBottomColor: "transparent" }} />
                </div>
                <div className="text-center space-y-2">
                  <p className="text-[8px] tracking-[0.3em] text-[#00d4ff] animate-scan-pulse uppercase">
                    {LOADING_STEPS[loadingStep]}
                  </p>
                  <div className="flex justify-center gap-1">
                    {LOADING_STEPS.map((_, i) => (
                      <div
                        key={i}
                        className="h-px flex-1 transition-all duration-300"
                        style={{
                          background: i <= loadingStep ? "#00d4ff" : "#1a2332",
                          boxShadow: i <= loadingStep ? "0 0 4px #00d4ff" : "none",
                          width: 20,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {result && !loading && (
              <>
                {/* Risk card */}
                <ResultCard
                  label="RİSK ORANI"
                  value={`${result.risk}%`}
                  subValue={result.risk < 35 ? "DÜŞÜK RİSK ZONESİ" : result.risk < 65 ? "ORTA RİSK ALANI" : "YÜKSEK RİSK — DİKKAT"}
                  type="risk"
                  delay={0}
                />

                {/* Impact card */}
                <ResultCard
                  label="ETKİ ALANI SKORU"
                  value={`${result.impact}`}
                  subValue="/ 100 MAKSİMUM ETKİ"
                  type="impact"
                  delay={200}
                />

                {/* Decision card */}
                <ResultCard
                  label="SİSTEM KARARI"
                  value={result.decision}
                  subValue={`REF: ${result.decisionCode}`}
                  type="decision"
                  decisionType={result.decision}
                  delay={400}
                />

                {/* Metadata */}
                <div
                  className="p-3 rounded space-y-2"
                  style={{
                    background: "rgba(10,10,10,0.6)",
                    border: "1px solid #1a2332",
                  }}
                >
                  <p className="text-[7px] tracking-[0.3em] text-[#333] uppercase mb-2">
                    SİMÜLASYON META
                  </p>
                  {[
                    ["LOKASYON", `${selectedCity.name}/${selectedDistrict}`],
                    ["BÜTÇE", `${budget}M TL`],
                    ["SÜRE", `${duration} AY`],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between">
                      <span className="text-[7px] text-[#333] tracking-wider">{k}</span>
                      <span className="text-[7px] text-[#555] font-mono">{v}</span>
                    </div>
                  ))}
                </div>

                {/* Reset hint */}
                <button
                  onClick={() => setResult(null)}
                  className="text-[7px] tracking-widest text-[#333] hover:text-[#00d4ff] transition-colors uppercase text-center w-full py-1"
                >
                  ↺ SİFİRLA
                </button>
              </>
            )}
          </div>

          {/* System status footer */}
          <div className="p-4 border-t border-[#1a2332]">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "CPU", val: "32%" },
                { label: "NET", val: "OK" },
                { label: "API", val: "ONLINE" },
                { label: "DB", val: "SYNC" },
              ].map((s) => (
                <div key={s.label} className="flex justify-between items-center">
                  <span className="text-[7px] text-[#333] tracking-widest">{s.label}</span>
                  <span className="text-[7px] text-[#00d4ff] font-mono">{s.val}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
