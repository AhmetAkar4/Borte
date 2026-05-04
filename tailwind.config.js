/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        neon: "#00d4ff",
        "neon-dim": "#0099bb",
        silver: "#c0c0c0",
        panel: "#0d1117",
        border: "#1a2332",
      },
      fontFamily: {
        mono: ["'Share Tech Mono'", "monospace"],
        display: ["'Orbitron'", "monospace"],
      },
      animation: {
        "pulse-neon": "pulseNeon 2s ease-in-out infinite",
        "scan-line": "scanLine 3s linear infinite",
        "data-in": "dataIn 0.6s ease-out forwards",
        flicker: "flicker 4s linear infinite",
      },
      keyframes: {
        pulseNeon: {
          "0%, 100%": { boxShadow: "0 0 5px #00d4ff, 0 0 10px #00d4ff" },
          "50%": { boxShadow: "0 0 15px #00d4ff, 0 0 30px #00d4ff, 0 0 45px #00d4ff" },
        },
        scanLine: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
        dataIn: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        flicker: {
          "0%, 98%, 100%": { opacity: "1" },
          "99%": { opacity: "0.7" },
        },
      },
    },
  },
  plugins: [],
};
