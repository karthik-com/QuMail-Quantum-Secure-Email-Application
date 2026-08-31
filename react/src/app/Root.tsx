import { createContext, useContext, useState, useEffect, useRef } from "react";
import { Outlet, Link, useLocation } from "react-router";

// ─── Theme context ─────────────────────────────────────────────────────────────

interface ThemeCtx {
  isDark: boolean;
  toggle: () => void;
}

export const ThemeContext = createContext<ThemeCtx>({ isDark: false, toggle: () => {} });
export const useTheme = () => useContext(ThemeContext);

// ─── Palette ──────────────────────────────────────────────────────────────────

const C = {
  espresso: "#3B2A23",
  gold: "#B89B5E",
  ivory: "#FAF3E7",
  pattern: "#E9E0D2",
  footer: "#84756A",
};

// ─── Particle canvas ──────────────────────────────────────────────────────────

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  hue: number;
}

function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // gold / light-brown dots
    const dotColors = ["184,155,94", "200,169,106", "212,191,160"];

    particlesRef.current = Array.from({ length: 55 }, (_, i) => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.28,
      vy: (Math.random() - 0.5) * 0.28,
      size: Math.random() * 1.4 + 0.4,
      hue: i % 3,
    }));

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const ps = particlesRef.current;

      ps.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        const col = dotColors[p.hue];
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${col},0.38)`;
        ctx.fill();

        for (let j = i + 1; j < ps.length; j++) {
          const dx = ps[j].x - p.x;
          const dy = ps[j].y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 130) {
            const alpha = (1 - dist / 130) * 0.09;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(ps[j].x, ps[j].y);
            ctx.strokeStyle = `rgba(184,155,94,${alpha})`;
            ctx.lineWidth = 0.55;
            ctx.stroke();
          }
        }
      });

      rafRef.current = requestAnimationFrame(animate);
    };

    animate();
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

function Navbar() {
  const location = useLocation();
  const onLogin = location.pathname === "/login";
  const onRegister = location.pathname === "/register";
  const [btnHovered, setBtnHovered] = useState(false);

  return (
    <nav
      className="relative z-50 h-16 flex items-center px-6 lg:px-12 flex-shrink-0"
      style={{
        background: "rgba(59,42,35,0.92)",
        backdropFilter: "blur(22px)",
        WebkitBackdropFilter: "blur(22px)",
        borderBottom: "1px solid rgba(184,155,94,0.18)",
        boxShadow: "0 4px 40px rgba(59,42,35,0.12)",
      }}
    >
      {/* Logo */}
      <Link to="/" className="flex items-center gap-3 flex-shrink-0 no-underline">
        <div
          className="relative w-9 h-9 rounded-xl flex items-center justify-center"
          style={{
            background: "rgba(184,155,94,0.12)",
            border: "1px solid rgba(184,155,94,0.42)",
          }}
        >
          <span
            className="font-black text-base"
            style={{ fontFamily: "Orbitron, sans-serif", color: C.gold }}
          >
            Q
          </span>
        </div>
        <span
          className="text-lg font-bold tracking-widest"
          style={{ fontFamily: "Orbitron, sans-serif", color: C.ivory }}
        >
          Qumail
        </span>
      </Link>

      {/* Center tagline */}
      <div className="hidden md:flex flex-1 justify-center px-4">
        <span
          className="text-xs tracking-widest uppercase"
          style={{ fontFamily: "JetBrains Mono, monospace", color: "#D8CDBD", opacity: 0.7 }}
        >
          Quantum Secure Email Communication
        </span>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {!onLogin && !onRegister && (
          <Link to="/login" className="no-underline">
            <button
              onMouseEnter={() => setBtnHovered(true)}
              onMouseLeave={() => setBtnHovered(false)}
              className="px-4 py-1.5 rounded-lg text-xs tracking-widest uppercase transition-all duration-200"
              style={{
                fontFamily: "Orbitron, sans-serif",
                fontSize: "0.6rem",
                letterSpacing: "0.18em",
                background: "transparent",
                color: C.gold,
                border: `1px solid ${C.gold}`,
                boxShadow: btnHovered ? "0 0 14px rgba(184,155,94,0.28)" : "none",
                opacity: btnHovered ? 1 : 0.85,
              }}
            >
              Login
            </button>
          </Link>
        )}

        {onLogin && (
          <Link to="/register" className="no-underline">
            <button
              className="px-4 py-1.5 rounded-lg text-xs tracking-widest uppercase transition-all duration-200"
              style={{
                fontFamily: "Orbitron, sans-serif",
                fontSize: "0.6rem",
                letterSpacing: "0.18em",
                background: "transparent",
                color: C.gold,
                border: `1px solid ${C.gold}`,
              }}
            >
              Register
            </button>
          </Link>
        )}

        {onRegister && (
          <Link to="/login" className="no-underline">
            <button
              className="px-4 py-1.5 rounded-lg text-xs tracking-widest uppercase transition-all duration-200"
              style={{
                fontFamily: "Orbitron, sans-serif",
                fontSize: "0.6rem",
                letterSpacing: "0.18em",
                background: "transparent",
                color: C.gold,
                border: `1px solid ${C.gold}`,
              }}
            >
              Login
            </button>
          </Link>
        )}
      </div>
    </nav>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="flex-shrink-0 relative py-3" style={{ zIndex: 1 }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div
          className="h-px mb-2"
          style={{
            background: "linear-gradient(90deg, transparent 0%, rgba(184,155,94,0.28) 40%, rgba(184,155,94,0.28) 60%, transparent 100%)",
          }}
        />
        <p
          className="text-center text-xs"
          style={{ fontFamily: "JetBrains Mono, monospace", color: C.footer, opacity: 0.7 }}
        >
          &copy; Qumail Application 2026 &mdash; All communications protected by post-quantum cryptography
        </p>
      </div>
    </footer>
  );
}

// ─── Root layout ──────────────────────────────────────────────────────────────

export default function Root() {
  const [isDark] = useState(false);

  useEffect(() => {
    document.documentElement.classList.remove("dark");
  }, []);

  return (
    <ThemeContext.Provider value={{ isDark, toggle: () => {} }}>
      <div
        className="h-screen text-foreground flex flex-col overflow-hidden relative"
        style={{ background: C.ivory, fontFamily: "Inter, sans-serif" }}
      >
        {/* Particle canvas */}
        <ParticleCanvas />

        {/* Subtle pattern overlay */}
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            zIndex: 0,
            opacity: 0.065,
            backgroundImage: `linear-gradient(${C.pattern} 1px, transparent 1px), linear-gradient(90deg, ${C.pattern} 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />

        {/* Warm gold ambient glow */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
          <div
            className="absolute w-[520px] h-[520px] rounded-full blur-3xl"
            style={{
              top: "-8%",
              left: "-6%",
              background: "radial-gradient(circle, rgba(184,155,94,0.10) 0%, transparent 70%)",
            }}
          />
          <div
            className="absolute w-[400px] h-[400px] rounded-full blur-3xl"
            style={{
              bottom: "4%",
              right: "-4%",
              background: "radial-gradient(circle, rgba(184,155,94,0.08) 0%, transparent 70%)",
            }}
          />
        </div>

        <Navbar />
        <div className="flex-1 overflow-y-auto relative" style={{ zIndex: 1 }}>
          <Outlet />
        </div>
        <Footer />
      </div>
    </ThemeContext.Provider>
  );
}
