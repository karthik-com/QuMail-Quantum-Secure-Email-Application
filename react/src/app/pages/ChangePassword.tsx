import { useState } from "react";
import { Link, useNavigate } from "react-router";

import {
  Lock,
  Eye,
  EyeOff,
  Shield,
  Bell,
  Settings as SettingsIcon,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

import { ProfileDropdown } from "../components/ProfileDropdown";

const inputStyle: React.CSSProperties = {
  background: "#FFFDF9",
  border: "1px solid #DCCFC0",
  color: "#3B2A23",
  outline: "none",
};

export default function ChangePassword() {

  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showCurrentPass, setShowCurrentPass] =
    useState(false);

  const [showNewPass, setShowNewPass] =
    useState(false);

  const [showConfirmPass, setShowConfirmPass] =
    useState(false);

  const [toast, setToast] = useState<{
    msg: string;
    ok: boolean;
  } | null>(null);

  const [loading, setLoading] =
    useState(false);

  // =====================================================
  // TOAST
  // =====================================================

  const showToast = (
    msg: string,
    ok = true
  ) => {

    setToast({
      msg,
      ok,
    });

    setTimeout(
      () => setToast(null),
      2500
    );
  };

  // =====================================================
  // PASSWORD STRENGTH
  // =====================================================

  const getPasswordStrength = (
    pass: string
  ): number => {

    let strength = 0;

    if (pass.length >= 8)
      strength += 25;

    if (pass.length >= 12)
      strength += 15;

    if (
      /[a-z]/.test(pass) &&
      /[A-Z]/.test(pass)
    )
      strength += 20;

    if (/[0-9]/.test(pass))
      strength += 20;

    if (/[^a-zA-Z0-9]/.test(pass))
      strength += 20;

    return Math.min(
      strength,
      100
    );
  };

  const passwordStrength =
    getPasswordStrength(
      newPassword
    );

  // =====================================================
  // STRENGTH COLOR
  // =====================================================

  const getStrengthColor = (
    strength: number
  ): string => {

    if (strength < 40)
      return "#cc0000";

    if (strength < 70)
      return "#ff8800";

    return "#00cc66";
  };

  // =====================================================
  // STRENGTH LABEL
  // =====================================================

  const getStrengthLabel = (
    strength: number
  ): string => {

    if (strength === 0)
      return "";

    if (strength < 40)
      return "Weak";

    if (strength < 70)
      return "Medium";

    return "Strong";
  };

  // =====================================================
  // EYE BUTTON
  // =====================================================

  const eyeBtn = (
    visible: boolean,
    toggle: () => void
  ) => (

    <button
      onClick={toggle}
      type="button"
      className="opacity-50 hover:opacity-75 transition-opacity"
      style={{
        color: "#7A6D63"
      }}
    >

      {visible ? (
        <EyeOff className="w-4 h-4" />
      ) : (
        <Eye className="w-4 h-4" />
      )}

    </button>
  );

  // =====================================================
  // CHANGE PASSWORD
  // =====================================================

  const handleSubmit = async (
    e: React.FormEvent
  ) => {

    e.preventDefault();

    // -----------------------------------------------------
    // VALIDATION
    // -----------------------------------------------------

    if (
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {

      showToast(
        "Please fill all fields.",
        false
      );

      return;
    }

    if (
      newPassword !==
      confirmPassword
    ) {

      showToast(
        "New password and confirmation do not match.",
        false
      );

      return;
    }

    if (
      currentPassword ===
      newPassword
    ) {

      showToast(
        "New password cannot be the same as current password.",
        false
      );

      return;
    }

    // -----------------------------------------------------
    // PASSWORD STRENGTH
    // -----------------------------------------------------

    if (passwordStrength < 40) {

      showToast(
        "Please choose a stronger password.",
        false
      );

      return;
    }

    setLoading(true);

    try {

      // ===================================================
      // GET TOKEN
      // ===================================================

      const token =
        localStorage.getItem(
          "access"
        );

      if (!token) {

        showToast(
          "Not authenticated.",
          false
        );

        navigate("/login");

        return;
      }

      // ===================================================
      // CHANGE PASSWORD API
      // ===================================================

      const res = await fetch(
        "http://127.0.0.1:8000/change-password/",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`,
          },

          body: JSON.stringify({

            current_password:
              currentPassword,

            new_password:
              newPassword,

            confirm_password:
              confirmPassword,

          }),
        }
      );

      const data =
        await res.json().catch(
          () => ({})
        );

      // ===================================================
      // SUCCESS
      // ===================================================

      if (res.ok) {

        showToast(
          data.message ||
          "Password changed successfully."
        );

        // -------------------------------------------------
        // Clear password fields
        // -------------------------------------------------

        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");

        // -------------------------------------------------
        // Go to dashboard
        // -------------------------------------------------

        setTimeout(() => {

          navigate("/dashboard");

        }, 900);

      }

      // ===================================================
      // TEMPORARY PASSWORD EXPIRED
      // ===================================================

      else if (
        data.error_type ===
        "temporary_password_expired"
      ) {

        showToast(
          data.error ||
          "Your temporary password has expired.",
          false
        );

        // -------------------------------------------------
        // User must get a new temporary password
        // from the administrator.
        // -------------------------------------------------

        setTimeout(() => {

          navigate("/login");

        }, 1800);

      }

      // ===================================================
      // OTHER ERROR
      // ===================================================

      else {

        showToast(

          data.error ||
          data.detail ||
          "Failed to change password.",

          false
        );
      }

    } catch (err) {

      console.error(
        "Change password error:",
        err
      );

      showToast(
        "Network error.",
        false
      );

    } finally {

      setLoading(false);
    }
  };

  // =====================================================
  // BUTTON VALIDATION
  // =====================================================

  const allOk =
    currentPassword.length > 0 &&
    newPassword.length > 0 &&
    confirmPassword === newPassword &&
    passwordStrength >= 40;

  // =====================================================
  // UI
  // =====================================================

  return (

    <div
      className="h-screen flex flex-col"
      style={{
        background: "#FAF3E7"
      }}
    >

      {/* =================================================
          TOP NAVBAR
      ================================================= */}

      <nav
        className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center px-6"
        style={{
          background:
            "rgba(59,42,35,0.92)",

          backdropFilter:
            "blur(22px)",

          WebkitBackdropFilter:
            "blur(22px)",

          borderBottom:
            "1px solid rgba(184,155,94,0.18)",

          boxShadow:
            "0 4px 40px rgba(59,42,35,0.12)",
        }}
      >

        <Link
          to="/"
          className="flex items-center gap-3 flex-shrink-0 no-underline"
        >

          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{
              background:
                "rgba(184,155,94,0.18)",

              border:
                "1px solid rgba(184,155,94,0.45)",
            }}
          >

            <span
              className="font-black text-base"
              style={{
                fontFamily:
                  "Orbitron, sans-serif",

                color:
                  "#B89B5E",
              }}
            >
              Q
            </span>

          </div>

          <span
            className="text-lg font-bold tracking-widest"
            style={{
              fontFamily:
                "Orbitron, sans-serif",

              color:
                "#FAF3E7",
            }}
          >
            Qumail
          </span>

        </Link>

        <div className="hidden md:flex flex-1 justify-center px-4">

          <span
            className="text-xs tracking-widest uppercase"
            style={{
              fontFamily:
                "JetBrains Mono, monospace",

              color:
                "rgba(250,243,231,0.45)",
            }}
          >
            Quantum Secure Email Communication
          </span>

        </div>

        <div
          className="flex items-center gap-3 flex-shrink-0 ml-auto"
        >

          <button
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{
              background:
                "rgba(184,155,94,0.12)",

              border:
                "1px solid rgba(184,155,94,0.28)",

              color:
                "#B89B5E",
            }}
          >
            <Bell className="w-4 h-4" />
          </button>

          <button
            onClick={() =>
              navigate("/settings")
            }
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{
              background:
                "rgba(184,155,94,0.12)",

              border:
                "1px solid rgba(184,155,94,0.28)",

              color:
                "#B89B5E",
            }}
          >
            <SettingsIcon className="w-4 h-4" />
          </button>

          <ProfileDropdown
            isDark={false}
          />

        </div>

      </nav>

      {/* =================================================
          PAGE CONTENT
      ================================================= */}

      <div
        className="flex-1 flex items-center justify-center px-6 pt-16"
      >

        <div className="w-full max-w-md">

          {/* =================================================
              CARD
          ================================================= */}

          <div
            className="rounded-3xl p-8"
            style={{
              background:
                "#FFFDF9",

              border:
                "1px solid #E6DDD2",

              boxShadow:
                "0 24px 80px rgba(59,42,35,0.08), inset 0 1px 0 rgba(255,255,255,0.9)",
            }}
          >

            {/* =================================================
                HEADER
            ================================================= */}

            <h1
              className="text-center mb-1 pb-4 relative"
              style={{
                fontFamily:
                  "Orbitron, sans-serif",

                fontSize:
                  "1.5rem",

                fontWeight: 800,

                color:
                  "#3B2A23",

                borderBottom:
                  "1px solid #E6DDD2",
              }}
            >

              Change your password

              <button
                type="button"
                onClick={() =>
                  navigate("/settings")
                }
                className="absolute top-0 right-0 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
                style={{
                  background:
                    "rgba(184,155,94,0.1)",

                  border:
                    "1px solid rgba(184,155,94,0.28)",

                  color:
                    "#B89B5E",

                  cursor:
                    "pointer",
                }}
              >
                ×
              </button>

            </h1>

            {/* =================================================
                FORM
            ================================================= */}

            <form
              onSubmit={handleSubmit}
              className="space-y-6 mt-6"
            >

              {/* =================================================
                  CURRENT PASSWORD
              ================================================= */}

              <div
                className="flex items-center gap-4"
              >

                <label
                  className="min-w-fit text-sm"
                  style={{
                    color:
                      "#7A6D63",

                    fontFamily:
                      "JetBrains Mono, monospace",

                    fontWeight:
                      500,
                  }}
                >
                  Password
                </label>

                <div
                  className="relative flex-1"
                >

                  <input
                    type={
                      showCurrentPass
                        ? "text"
                        : "password"
                    }

                    value={
                      currentPassword
                    }

                    onChange={(e) =>
                      setCurrentPassword(
                        e.target.value
                      )
                    }

                    placeholder="••••••••••••"

                    className="w-full rounded-xl text-sm transition-all duration-200 placeholder:opacity-30"

                    style={{
                      ...inputStyle,

                      padding:
                        "0.75rem 2.6rem 0.75rem 1.2rem",
                    }}

                    onFocus={(e) =>
                      (
                        e.currentTarget.style
                          .borderColor =
                          "#B89B5E"
                      )
                    }

                    onBlur={(e) =>
                      (
                        e.currentTarget.style
                          .borderColor =
                          "#DCCFC0"
                      )
                    }
                  />

                  <div
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >

                    {eyeBtn(
                      showCurrentPass,
                      () =>
                        setShowCurrentPass(
                          !showCurrentPass
                        )
                    )}

                  </div>

                </div>

              </div>

              {/* =================================================
                  NEW PASSWORD
              ================================================= */}

              <div
                className="flex items-center gap-4"
              >

                <div className="min-w-fit">

                  <label
                    className="text-sm block"
                    style={{
                      color:
                        "#7A6D63",

                      fontFamily:
                        "JetBrains Mono, monospace",

                      fontWeight:
                        500,

                      marginBottom:
                        "0.25rem",
                    }}
                  >
                    New Password
                  </label>

                  {newPassword && (

                    <span
                      className="text-xs"
                      style={{
                        color:
                          getStrengthColor(
                            passwordStrength
                          ),

                        fontFamily:
                          "JetBrains Mono, monospace",

                        fontWeight:
                          600,
                      }}
                    >
                      {getStrengthLabel(
                        passwordStrength
                      )}
                    </span>

                  )}

                </div>

                <div
                  className="relative flex-1"
                >

                  <input
                    type={
                      showNewPass
                        ? "text"
                        : "password"
                    }

                    value={
                      newPassword
                    }

                    onChange={(e) =>
                      setNewPassword(
                        e.target.value
                      )
                    }

                    placeholder="••••••••••••"

                    className="w-full rounded-xl text-sm transition-all duration-200 placeholder:opacity-30"

                    style={{
                      ...inputStyle,

                      padding:
                        "0.75rem 2.6rem 0.75rem 1.2rem",
                    }}

                    onFocus={(e) =>
                      (
                        e.currentTarget.style
                          .borderColor =
                          "#B89B5E"
                      )
                    }

                    onBlur={(e) =>
                      (
                        e.currentTarget.style
                          .borderColor =
                          "#DCCFC0"
                      )
                    }
                  />

                  <div
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >

                    {eyeBtn(
                      showNewPass,
                      () =>
                        setShowNewPass(
                          !showNewPass
                        )
                    )}

                  </div>

                </div>

              </div>

              {/* =================================================
                  STRENGTH BAR
              ================================================= */}

              {newPassword && (

                <div
                  className="flex items-center gap-3 -mt-2 px-1"
                >

                  <div
                    className="flex-1 h-1.5 rounded-full"
                    style={{
                      background:
                        "#E6DDD2",
                    }}
                  >

                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width:
                          `${passwordStrength}%`,

                        background:
                          getStrengthColor(
                            passwordStrength
                          ),
                      }}
                    />

                  </div>

                </div>

              )}

              {/* =================================================
                  CONFIRM PASSWORD
              ================================================= */}

              <div
                className="flex items-center gap-4"
              >

                <div className="min-w-fit">

                  <label
                    className="text-sm block"
                    style={{
                      color:
                        "#7A6D63",

                      fontFamily:
                        "JetBrains Mono, monospace",

                      fontWeight:
                        500,

                      marginBottom:
                        "0.25rem",
                    }}
                  >
                    Confirm Password
                  </label>

                  {confirmPassword && (

                    <span
                      className="text-xs"
                      style={{
                        color:
                          confirmPassword ===
                          newPassword
                            ? "#00cc66"
                            : "#cc0000",

                        fontFamily:
                          "JetBrains Mono, monospace",

                        fontWeight:
                          600,
                      }}
                    >
                      {confirmPassword ===
                      newPassword
                        ? "Match"
                        : "No Match"}
                    </span>

                  )}

                </div>

                <div
                  className="relative flex-1"
                >

                  <input
                    type={
                      showConfirmPass
                        ? "text"
                        : "password"
                    }

                    value={
                      confirmPassword
                    }

                    onChange={(e) =>
                      setConfirmPassword(
                        e.target.value
                      )
                    }

                    placeholder="••••••••••••"

                    className="w-full rounded-xl text-sm transition-all duration-200 placeholder:opacity-30"

                    style={{
                      ...inputStyle,

                      padding:
                        "0.75rem 2.6rem 0.75rem 1.2rem",
                    }}

                    onFocus={(e) =>
                      (
                        e.currentTarget.style
                          .borderColor =
                          "#B89B5E"
                      )
                    }

                    onBlur={(e) =>
                      (
                        e.currentTarget.style
                          .borderColor =
                          "#DCCFC0"
                      )
                    }
                  />

                  <div
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >

                    {eyeBtn(
                      showConfirmPass,
                      () =>
                        setShowConfirmPass(
                          !showConfirmPass
                        )
                    )}

                  </div>

                </div>

              </div>

              {/* =================================================
                  SUBMIT
              ================================================= */}

              <button
                type="submit"
                disabled={
                  loading ||
                  !allOk
                }
                className="w-full py-3 rounded-xl font-semibold tracking-widest uppercase transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 mt-8"
                style={{
                  background:
                    loading
                      ? "rgba(184,155,94,0.4)"
                      : allOk
                      ? "#B89B5E"
                      : "#DCCFC0",

                  color:
                    allOk
                      ? "#FAF3E7"
                      : "#A89B91",

                  fontFamily:
                    "Orbitron, sans-serif",

                  fontSize:
                    "0.75rem",

                  letterSpacing:
                    "0.18em",

                  boxShadow:
                    allOk
                      ? "0 4px 20px rgba(184,155,94,0.35)"
                      : "none",

                  cursor:
                    loading ||
                    !allOk
                      ? "not-allowed"
                      : "pointer",
                }}

                onMouseEnter={(e) => {

                  if (
                    allOk &&
                    !loading
                  ) {

                    e.currentTarget.style
                      .background =
                      "#A6874E";
                  }

                }}

                onMouseLeave={(e) => {

                  if (
                    allOk &&
                    !loading
                  ) {

                    e.currentTarget.style
                      .background =
                      "#B89B5E";
                  }

                }}
              >

                {loading
                  ? "Setting..."
                  : "Set Password"}

              </button>

            </form>

          </div>

          {/* =================================================
              SECURITY BADGE
          ================================================= */}

          <div
            className="flex items-center justify-center gap-2 mt-4"
          >

            <Shield
              className="w-3 h-3"
              style={{
                color:
                  "#A89B91",
              }}
            />

            <span
              className="text-xs"
              style={{
                fontFamily:
                  "JetBrains Mono, monospace",

                color:
                  "#A89B91",
              }}
            >
              TLS 1.3 · CRYSTALS-Kyber · CRYSTALS-Dilithium
            </span>

          </div>

        </div>

      </div>

      {/* =================================================
          TOAST
      ================================================= */}

      {toast && (

        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 px-5 py-3 rounded-2xl z-50"
          style={{
            background:
              toast.ok
                ? "rgba(240,255,248,0.97)"
                : "rgba(255,240,240,0.97)",

            border:
              toast.ok
                ? "1px solid rgba(0,170,85,0.28)"
                : "1px solid rgba(204,0,0,0.28)",

            backdropFilter:
              "blur(20px)",

            WebkitBackdropFilter:
              "blur(20px)",

            boxShadow:
              "0 8px 32px rgba(59,42,35,0.12)",

            whiteSpace:
              "nowrap",
          }}
        >

          {toast.ok ? (

            <CheckCircle
              size={14}
              style={{
                color:
                  "#00aa55",

                flexShrink: 0,
              }}
            />

          ) : (

            <AlertCircle
              size={14}
              style={{
                color:
                  "#cc0000",

                flexShrink: 0,
              }}
            />

          )}

          <span
            style={{
              fontFamily:
                "Orbitron, sans-serif",

              fontSize:
                "0.65rem",

              fontWeight:
                700,

              letterSpacing:
                "0.08em",

              color:
                toast.ok
                  ? "#00aa55"
                  : "#cc0000",
            }}
          >
            {toast.msg}
          </span>

        </div>

      )}

    </div>
  );
}