// Fixed full-viewport background, rendered once in the root layout.
// z-index is NEGATIVE so it never covers content.
export default function Bg() {
  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        zIndex: -1,
        background:
          "linear-gradient(150deg, var(--bg1) 0%, var(--bg2) 100%)",
      }}
    >
      {/* diagonal-line texture */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "repeating-linear-gradient(45deg, rgba(255,255,255,.025) 0 2px, transparent 2px 26px)",
        }}
      />
      {/* concentric circle decorations on the right side */}
      <div
        style={{
          position: "absolute",
          top: "-10%",
          right: "-15%",
          width: "70vmax",
          height: "70vmax",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, transparent 38%, rgba(126,184,247,.06) 38.5% 39%, transparent 39.5% 52%, rgba(126,184,247,.05) 52.5% 53%, transparent 53.5% 66%, rgba(126,184,247,.04) 66.5% 67%, transparent 67.5%)",
        }}
      />
    </div>
  );
}
