import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: "#F0A500",
          light:   "#FFD060",
          dim:     "#9A6800",
          glass:   "rgba(240,165,0,0.10)",
        },
        crypto: {
          bg:      "#07080C",
          bg2:     "#0D0F15",
          bg3:     "#121519",
          bg4:     "#181C24",
          bg5:     "#1E222E",
          border:  "rgba(255,255,255,0.06)",
          "border-g": "rgba(240,165,0,0.20)",
          text:    "#EAECf4",
          text2:   "#8A90A8",
          text3:   "#4A5068",
          red:     "#FF3B5C",
          green:   "#00E5A0",
          blue:    "#4A9EFF",
        },
      },
      fontFamily: {
        orbitron: ["Orbitron", "monospace"],
        mono:     ["Space Mono", "monospace"],
        sora:     ["Sora", "sans-serif"],
      },
      backgroundImage: {
        kente: `repeating-linear-gradient(90deg,
          #F0A500 0,#F0A500 16px,transparent 16px,transparent 20px,
          #FF3B5C 20px,#FF3B5C 32px,transparent 32px,transparent 36px,
          #00E5A0 36px,#00E5A0 48px,transparent 48px,transparent 52px)`,
        scanlines: `repeating-linear-gradient(0deg,
          transparent,transparent 3px,
          rgba(0,0,0,0.05) 3px,rgba(0,0,0,0.05) 4px)`,
      },
      keyframes: {
        "blink-dot": {
          "0%,100%": { opacity: "1" },
          "50%":     { opacity: "0.2" },
        },
        "cur-blink": {
          "0%,100%": { opacity: "1" },
          "50%":     { opacity: "0" },
        },
        "ticker-scroll": {
          from: { transform: "translateX(0)" },
          to:   { transform: "translateX(-50%)" },
        },
        "idle-float": {
          "0%,100%": { transform: "rotate(-1deg) translateY(0px)" },
          "30%":     { transform: "rotate(0.4deg) translateY(-2.5px)" },
          "70%":     { transform: "rotate(-0.5deg) translateY(-1px)" },
        },
        "speak-sway": {
          "0%,100%": { transform: "rotate(-1.5deg) translateY(0px)" },
          "25%":     { transform: "rotate(0.9deg) translateY(-3.5px)" },
          "50%":     { transform: "rotate(-0.5deg) translateY(-2px)" },
          "75%":     { transform: "rotate(1.1deg) translateY(-4px)" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "toast-in": {
          from: { transform: "translateY(12px)", opacity: "0" },
          to:   { transform: "translateY(0)", opacity: "1" },
        },
        wave: {
          "0%,100%": { transform: "scaleY(0.25)", opacity: "0.45" },
          "50%":     { transform: "scaleY(1)",    opacity: "1" },
        },
      },
      animation: {
        "blink-dot":      "blink-dot 1.4s ease-in-out infinite",
        "blink-dot-fast": "blink-dot 1.2s ease-in-out infinite",
        "cur-blink":      "cur-blink 0.9s step-end infinite",
        "ticker-scroll":  "ticker-scroll 50s linear infinite",
        "idle-float":     "idle-float 5s ease-in-out infinite",
        "speak-sway":     "speak-sway 2.2s ease-in-out infinite",
        shimmer:          "shimmer 1.5s infinite",
        "fade-in-up":     "fade-in-up 0.3s ease",
        "toast-in":       "toast-in 0.3s ease",
        wave:             "wave 0.7s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
