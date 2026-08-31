import { useState } from "react";

// ─── Form Input ───────────────────────────────────────────────────────────────

interface FormInputProps {
  label: string;
  type: string;
  placeholder: string;
  icon?: React.ReactNode;
  isDark: boolean;
  rightEl?: React.ReactNode;
  value?: string;
  maxLength?: number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  error?: string;
}

export function FormInput({ label, type, placeholder, icon, isDark, rightEl, value, maxLength, onChange, required, error }: FormInputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <div className="space-y-1.5">
      <label
        className="block text-xs tracking-wider uppercase"
        style={{
          fontFamily: "JetBrains Mono, monospace",
          color: focused
            ? isDark ? "#00d4ff" : "#0077aa"
            : isDark ? "rgba(226,238,255,0.52)" : "rgba(10,22,40,0.48)",
          transition: "color 0.18s",
        }}
      >
        {label}
      </label>
      <div className="relative">
        {icon && (
          <div
            className="absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-200"
            style={{ color: focused ? (isDark ? "#00d4ff" : "#0077aa") : isDark ? "rgba(226,238,255,0.3)" : "rgba(10,22,40,0.3)" }}
          >
            {icon}
          </div>
        )}
        <input
          type={type}
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          value={value}
          onChange={onChange}
          maxLength={maxLength}
          required={required}
          autoComplete="off"
          className="w-full rounded-xl text-sm transition-all duration-200 placeholder:opacity-25"
          style={{
            padding: `0.65rem ${rightEl ? "2.6rem" : "0.9rem"} 0.65rem ${icon ? "2.6rem" : "0.9rem"}`,
            background: focused
              ? isDark ? "rgba(0,212,255,0.07)" : "rgba(0,100,200,0.06)"
              : isDark ? "rgba(0,212,255,0.04)" : "rgba(0,100,200,0.03)",
            border: focused
              ? isDark ? "1px solid rgba(0,212,255,0.58)" : "1px solid rgba(0,100,200,0.58)"
              : isDark ? "1px solid rgba(0,212,255,0.18)" : "1px solid rgba(0,100,200,0.2)",
            boxShadow: focused
              ? isDark
                ? "0 0 0 3px rgba(0,212,255,0.1), inset 0 1px 0 rgba(0,212,255,0.05)"
                : "0 0 0 3px rgba(0,100,200,0.1)"
              : "none",
            WebkitBoxShadow: isDark
            ? "0 0 0 1000px rgba(0,212,255,0.04) inset"
            : "0 0 0 1000px white inset",
            WebkitTextFillColor: isDark
            ? "#e2eeff"
            : "#0a1628",
            color: isDark ? "#e2eeff" : "#0a1628",
            outline: "none",
          }}
        />
        {error && (
          <p className="mt-1 text-xs text-red-500">
            {error}
          </p>
        )}
        {rightEl && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightEl}</div>
        )}
      </div>
    </div>
  );
}

// ─── Gradient Button ──────────────────────────────────────────────────────────

interface GradButtonProps {
  children: React.ReactNode;
  gradient: string;
  glow: string;
  glowHover: string;
  onClick?: () => void;
}

export function GradButton({ children, gradient, glow, glowHover, onClick }: GradButtonProps) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
      className="w-full py-3 rounded-xl font-semibold tracking-widest uppercase transition-all duration-200 active:scale-[0.98]"
      style={{
        background: gradient,
        color: "#030b1a",
        boxShadow: hovered ? glowHover : glow,
        fontFamily: "Orbitron, sans-serif",
        fontSize: "0.63rem",
        letterSpacing: "0.18em",
        transform: hovered ? "scale(1.014)" : "scale(1)",
      }}
    >
      {children}
    </button>
  );
}

// ─── Glass card style helper ──────────────────────────────────────────────────

export function glassCardStyle(isDark: boolean): React.CSSProperties {
  return isDark
    ? {
        background: "rgba(5,18,50,0.62)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        border: "1px solid rgba(0,212,255,0.13)",
        boxShadow: "0 24px 80px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.04)",
      }
    : {
        background: "rgba(255,255,255,0.8)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        border: "1px solid rgba(0,100,200,0.14)",
        boxShadow: "0 24px 80px rgba(0,60,160,0.1), inset 0 1px 0 rgba(255,255,255,0.9)",
      };
}
