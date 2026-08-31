import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { User, KeyRound, LogOut } from "lucide-react";
import { logout } from "../utils/auth";

interface ProfileDropdownProps {
  isDark: boolean;
}

export function ProfileDropdown({ isDark }: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleChangePassword = () => {
    setIsOpen(false);
    navigate("/change-password");
  };

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
    navigate("/login");
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-105"
          style={{
                background: "#B89B5E",
                border: "1px solid rgba(184,155,94,0.35)",
                color: "#FAF3E7",
                fontFamily: "Orbitron, sans-serif",
                fontSize: "0.75rem",
                fontWeight: 700,
              }}
      >
        <User className="w-4 h-4" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-56 rounded-xl overflow-hidden z-50"
          style={{
            background: isDark ? "rgba(5,18,50,0.95)" : "rgba(255,255,255,0.95)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: isDark
              ? "1px solid rgba(0,212,255,0.2)"
              : "1px solid rgba(0,100,200,0.2)",
            boxShadow: isDark
              ? "0 8px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)"
              : "0 8px 32px rgba(0,60,160,0.15), inset 0 1px 0 rgba(255,255,255,0.9)",
          }}
        >
          {/* Change Password */}
          <button
            onClick={handleChangePassword}
            className="w-full px-4 py-3 flex items-center gap-3 transition-all duration-200 hover:scale-[1.02]"
            style={{
              background: "transparent",
              color: isDark ? "rgba(226,238,255,0.9)" : "rgba(10,22,40,0.9)",
              borderBottom: isDark
                ? "1px solid rgba(0,212,255,0.08)"
                : "1px solid rgba(0,100,200,0.08)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = isDark
                ? "rgba(0,212,255,0.08)"
                : "rgba(0,100,200,0.08)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            <KeyRound className="w-4 h-4" style={{ color: isDark ? "#00d4ff" : "#005f88" }} />
            <span
              className="text-sm font-medium"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Change Password
            </span>
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full px-4 py-3 flex items-center gap-3 transition-all duration-200 hover:scale-[1.02]"
            style={{
              background: "transparent",
              color: isDark ? "rgba(255,68,68,0.9)" : "rgba(204,0,0,0.9)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = isDark
                ? "rgba(255,68,68,0.08)"
                : "rgba(204,0,0,0.08)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            <LogOut className="w-4 h-4" />
            <span
              className="text-sm font-medium"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Logout
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
