export function Footer() {
  const socials = [
    { label: "Twitter/X",  icon: "𝕏" },
    { label: "Telegram",   icon: "✈" },
    { label: "YouTube",    icon: "▶" },
    { label: "Instagram",  icon: "◉" },
    { label: "TikTok",     icon: "♪" },
  ];

  return (
    <footer className="bg-crypto-bg2 border-t border-crypto-border px-4 lg:px-6 py-5 flex flex-wrap items-center justify-between gap-4">
      <div className="font-mono text-[9px] text-crypto-text3 leading-[1.9]">
        <strong className="text-gold">CryptoChannel Africa</strong> · AI-Powered Crypto Media Network
        <br />
        Anchor: <strong className="text-gold">Cryztatoken of Africa</strong> · Broadcasting Live · Est. 2025
      </div>

      <div className="flex gap-2">
        {socials.map(s => (
          <button
            key={s.label}
            title={s.label}
            className="w-8 h-8 rounded-lg border border-crypto-border bg-none text-crypto-text3 text-[13px] flex items-center justify-center cursor-pointer hover:border-gold hover:text-gold transition-all"
          >
            {s.icon}
          </button>
        ))}
      </div>

      <div className="font-mono text-[8px] text-crypto-text3 text-right leading-[1.8]">
        Not financial advice.<br />
        Powered by AI · Built for Africa · Global Reach<br />
        © 2026 CryptoChannel Africa
      </div>
    </footer>
  );
}
