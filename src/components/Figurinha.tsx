import Mascot from "./Mascot";

// "Foil card" wrapper around the Mascot.
export default function Figurinha({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        borderRadius: 22,
        background: "linear-gradient(160deg,#214a86,#12305c 60%,#0d1f44)",
        border: "1.5px solid rgba(126,184,247,.4)",
        padding: 18,
        boxShadow: "0 24px 60px rgba(0,0,0,.45)",
      }}
    >
      {/* diagonal foil sheen */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(120deg, transparent 30%, rgba(255,255,255,.12) 45%, rgba(255,255,255,.02) 55%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      {/* header row */}
      <div className="relative flex items-center justify-between text-xs font-extrabold tracking-widest">
        <span style={{ color: "var(--gold)" }}>CRAQUE</span>
        <span className="text-sky">#10</span>
      </div>

      {/* mascot */}
      <div className="relative mx-auto my-2 w-40">
        <Mascot />
      </div>

      {/* name */}
      <div className="relative text-center font-black tracking-wide">
        PROF. LÍBERO FILHO
      </div>

      {/* stats row */}
      <div className="relative mt-2 flex items-center justify-center gap-2 text-xs font-semibold text-sky">
        <span>OVR 99</span>
        <span>·</span>
        <span>PAL ∞</span>
        <span>·</span>
        <span>MÃO 🔥</span>
      </div>
    </div>
  );
}
