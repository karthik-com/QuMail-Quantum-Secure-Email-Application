import { useState } from "react";
import { Link } from "react-router";

// ─── Quantum illustration ─────────────────────────────────────────────────────

function QuantumIllustration() {
  const hexPoints = "150,108 182,126 182,162 150,180 118,162 118,126";
  const dotColors = ["#B89B5E", "#C8A96A", "#D4BFA0", "#B89B5E", "#C8A96A", "#D4BFA0"];

  const orbitDots = Array.from({ length: 6 }, (_, i) => {
    const rad = (i * 60 * Math.PI) / 180;
    return { cx: 150 + 92 * Math.cos(rad), cy: 150 + 92 * Math.sin(rad), color: dotColors[i] };
  });

  return (
    <div className="relative flex items-center justify-center w-full max-w-sm mx-auto">
      <div
        className="absolute inset-0 rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(184,155,94,0.18) 0%, rgba(184,155,94,0.04) 60%, transparent 100%)" }}
      />
      <svg viewBox="0 0 300 300" className="relative w-full h-auto">
        <defs>
          <filter id="q-glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="q-glow-sm" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <radialGradient id="q-bg-h" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#B89B5E" stopOpacity="0.09" />
            <stop offset="100%" stopColor="#D4BFA0" stopOpacity="0.03" />
          </radialGradient>
        </defs>

        <circle cx="150" cy="150" r="140" fill="url(#q-bg-h)" />

        <circle cx="150" cy="150" r="128" fill="none" stroke="#B89B5E" strokeWidth="0.6" strokeOpacity="0.22" strokeDasharray="5 9">
          <animateTransform attributeName="transform" type="rotate" from="0 150 150" to="360 150 150" dur="42s" repeatCount="indefinite" />
        </circle>
        <circle cx="150" cy="150" r="92" fill="none" stroke="#C8A96A" strokeWidth="0.6" strokeOpacity="0.26" strokeDasharray="8 5">
          <animateTransform attributeName="transform" type="rotate" from="0 150 150" to="-360 150 150" dur="30s" repeatCount="indefinite" />
        </circle>
        <circle cx="150" cy="150" r="62" fill="none" stroke="#D4BFA0" strokeWidth="0.9" strokeOpacity="0.38" />

        {[0, 60, 120, 180, 240, 300].map((angle) => {
          const rad = (angle * Math.PI) / 180;
          return (
            <line
              key={angle}
              x1={150 + 62 * Math.cos(rad)} y1={150 + 62 * Math.sin(rad)}
              x2={150 + 128 * Math.cos(rad)} y2={150 + 128 * Math.sin(rad)}
              stroke={angle % 120 === 0 ? "#B89B5E" : "#C8A96A"}
              strokeWidth="0.5" strokeOpacity="0.24"
            />
          );
        })}

        {orbitDots.map(({ cx, cy, color }, i) => (
          <circle key={i} cx={cx} cy={cy} r="2.8" fill={color} opacity="0.72" filter="url(#q-glow-sm)" />
        ))}

        <polygon
          points={hexPoints}
          fill="rgba(250,243,231,0.88)"
          stroke="#3B2A23"
          strokeWidth="1.4"
          filter="url(#q-glow)"
        />

        <rect x="136" y="145" width="28" height="22" rx="5" fill="#B89B5E" opacity="0.95" filter="url(#q-glow-sm)" />
        <path d="M141 145 L141 138 Q141 129 150 129 Q159 129 159 138 L159 145" fill="none" stroke="#B89B5E" strokeWidth="2.8" strokeLinecap="round" filter="url(#q-glow-sm)" />
        <circle cx="150" cy="153" r="3.2" fill="#3B2A23" />
        <rect x="148.5" y="155.5" width="3" height="6" rx="1" fill="#3B2A23" />

        <g>
          <circle cx="150" cy="22" r="4.5" fill="#B89B5E" filter="url(#q-glow)">
            <animateTransform attributeName="transform" type="rotate" from="0 150 150" to="360 150 150" dur="7s" repeatCount="indefinite" />
          </circle>
        </g>
        <g>
          <circle cx="55" cy="150" r="3.5" fill="#C8A96A" filter="url(#q-glow)">
            <animateTransform attributeName="transform" type="rotate" from="0 150 150" to="-360 150 150" dur="5s" repeatCount="indefinite" />
          </circle>
        </g>
        <g>
          <circle cx="245" cy="105" r="3" fill="#D4BFA0" opacity="0.8" filter="url(#q-glow-sm)">
            <animateTransform attributeName="transform" type="rotate" from="0 150 150" to="360 150 150" dur="11s" repeatCount="indefinite" />
          </circle>
        </g>

        {([
          [150, 22], [278, 150], [150, 278], [22, 150],
        ] as [number, number][]).map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r="2.5" fill="none" stroke={i % 2 === 0 ? "#B89B5E" : "#C8A96A"} strokeWidth="1.2" strokeOpacity="0.44" />
        ))}
      </svg>
    </div>
  );
}

// ─── Home page ────────────────────────────────────────────────────────────────

export default function Home() {
  const [signInHovered, setSignInHovered] = useState(false);

  return (
    <main className="relative h-full flex items-center" style={{ zIndex: 1 }}>
      <div className="w-full max-w-7xl mx-auto px-6 lg:px-12 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 xl:gap-12 items-center">

          {/* Left — text + CTAs */}
          <div className="space-y-4 order-2 lg:order-1">
            <div className="space-y-3">
              <h1
                className="font-black leading-[1.05]"
                style={{
                  fontFamily: "Orbitron, sans-serif",
                  fontSize: "clamp(1.9rem, 4vw, 3.4rem)",
                }}
              >
                <span className="block" style={{ color: "#3B2A23", opacity: 0.82 }}>Welcome to</span>
                <span className="block" style={{ color: "#B89B5E" }}>
                  Qumail
                </span>
              </h1>
              <p
                className="text-base font-medium leading-snug max-w-lg"
                style={{ color: "#6E625A" }}
              >
                Next-generation quantum-inspired encrypted email platform
              </p>
              <p className="text-sm leading-relaxed max-w-lg" style={{ color: "#6E625A", opacity: 0.72 }}>
                Qumail uses post-quantum cryptographic protocols to keep your communications
                impenetrable — today and in the quantum era. End-to-end encrypted,
                zero-knowledge architecture, built for the future of secure digital correspondence.
              </p>
            </div>

            {/* CTA buttons */}
            <div className="flex flex-wrap gap-4">
              <Link to="/register" className="no-underline">
                <button
                  className="px-7 py-3 rounded-xl font-semibold tracking-wider uppercase transition-all duration-200 hover:scale-[1.03] active:scale-[0.98]"
                  style={{
                    fontFamily: "Orbitron, sans-serif",
                    fontSize: "0.65rem",
                    letterSpacing: "0.16em",
                    background: "#B89B5E",
                    color: "#FAF3E7",
                    boxShadow: "0 4px 24px rgba(184,155,94,0.38)",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#A6874E")}
                  onMouseLeave={e => (e.currentTarget.style.background = "#B89B5E")}
                >
                  Get Started
                </button>
              </Link>
              <Link to="/login" className="no-underline">
                <button
                  className="px-7 py-3 rounded-xl font-semibold tracking-wider uppercase transition-all duration-200 hover:scale-[1.03] active:scale-[0.98]"
                  style={{
                    fontFamily: "Orbitron, sans-serif",
                    fontSize: "0.65rem",
                    letterSpacing: "0.16em",
                    background: signInHovered ? "#F3E9D2" : "transparent",
                    color: "#3B2A23",
                    border: "1px solid #3B2A23",
                    transition: "background 0.18s, transform 0.2s",
                  }}
                  onMouseEnter={() => setSignInHovered(true)}
                  onMouseLeave={() => setSignInHovered(false)}
                >
                  Sign In
                </button>
              </Link>
            </div>

            {/* Trust line */}
            <p
              className="text-xs"
              style={{ fontFamily: "JetBrains Mono, monospace", color: "#84756A" }}
            >
              CRYSTALS-Kyber &nbsp;·&nbsp; CRYSTALS-Dilithium &nbsp;·&nbsp; TLS 1.3
            </p>
          </div>

          {/* Right — illustration */}
          <div className="order-1 lg:order-2 flex items-center justify-center">
            <div className="w-full max-w-[280px] lg:max-w-xs mx-auto">
              <QuantumIllustration />
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
