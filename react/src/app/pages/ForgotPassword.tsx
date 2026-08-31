import { useState, useEffect } from "react";
import { Link } from "react-router";
import { Mail, Lock, Eye, EyeOff, Shield, CheckCircle, ArrowLeft } from "lucide-react";
import { useTheme } from "../Root";
import { FormInput, GradButton, glassCardStyle } from "../components/FormElements";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "../components/ui/input-otp";

type Step = "email" | "otp" | "reset" | "success";

export default function ForgotPassword() {
  const { isDark } = useTheme();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "info";
  } | null>(null);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  // Password strength calculation
  const getPasswordStrength = (pass: string): number => {
    let strength = 0;
    if (pass.length >= 8) strength += 25;
    if (pass.length >= 12) strength += 15;
    if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) strength += 20;
    if (/[0-9]/.test(pass)) strength += 20;
    if (/[^a-zA-Z0-9]/.test(pass)) strength += 20;
    return Math.min(strength, 100);
  };

  const passwordStrength = getPasswordStrength(newPass);

  const getStrengthColor = (strength: number): string => {
    if (strength < 40) return isDark ? "#ff4444" : "#cc0000";
    if (strength < 70) return isDark ? "#ffaa00" : "#ff8800";
    return isDark ? "#00ff88" : "#00cc66";
  };

  const getStrengthLabel = (strength: number): string => {
    if (strength === 0) return "";
    if (strength < 40) return "Weak";
    if (strength < 70) return "Medium";
    return "Strong";
  };

  // Eye toggle button
  const eyeBtn = (visible: boolean, toggle: () => void) => (
    <button
      onClick={toggle}
      type="button"
      className="opacity-38 hover:opacity-75 transition-opacity"
      style={{ color: isDark ? "#e2eeff" : "#0a1628" }}
    >
      {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
    </button>
  );

  // Form handlers
  const handleSendOTP = async (
  e: React.FormEvent
) => {

  e.preventDefault();

  try {

    const response = await fetch(

      "http://127.0.0.1:8000/forgot-password/",

      {

        method: "POST",

        headers: {

          "Content-Type": "application/json"
        },

        body: JSON.stringify({

          email: email
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {

      alert(data.error);

      return;
    }

    setStep("otp");

    setResendTimer(30);

  } catch {

    setNotification({

      message: "Server error occurred",

      type: "info"
    });

    setTimeout(() => {

      setNotification(null);

    }, 3000);
  }
};

const handleVerifyOTP = async (
  e: React.FormEvent
) => {

  e.preventDefault();

  const cleanOtp = otp.toLowerCase();

  if (cleanOtp.length !== 6) {
    alert("Please enter the 6-character OTP.");
    return;
  }

  if (!/^[a-z0-9]{6}$/.test(cleanOtp)) {
    alert("OTP must contain only lowercase letters and numbers.");
    return;
  }

  try {

    const response = await fetch(

      "http://127.0.0.1:8000/verify-forgot-otp/",

      {

        method: "POST",

        headers: {

          "Content-Type": "application/json"
        },

        body: JSON.stringify({

          email: email,

          otp: cleanOtp
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {

      alert(data.error);

      return;
    }

    setStep("reset");

  } catch {

    setNotification({

      message: "Server error occurred",

      type: "info"
    });

    setTimeout(() => {

      setNotification(null);

    }, 3000);
  }
};

const handleResendOTP = async () => {

  if (resendTimer > 0) return;

  try {

    const response = await fetch(

      "http://127.0.0.1:8000/forgot-password/",

      {

        method: "POST",

        headers: {

          "Content-Type": "application/json"
        },

        body: JSON.stringify({

          email: email
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {

      alert(data.error);

      return;
    }

    alert("OTP resent successfully");

    setResendTimer(30);

  } catch {

    setNotification({

      message: "Server error occurred",

      type: "info"
    });

    setTimeout(() => {

      setNotification(null);

    }, 3000);
  }
};

const handleResetPassword = async (
  e: React.FormEvent
) => {

  e.preventDefault();

  if (newPass !== confirmPass) {

    alert("Passwords do not match");

    return;
  }

  try {

    const response = await fetch(

      "http://127.0.0.1:8000/reset-password/",

      {

        method: "POST",

        headers: {

          "Content-Type": "application/json"
        },

        body: JSON.stringify({

          email: email,

          otp: otp,

          new_password: newPass,

          confirm_password: confirmPass
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {

      alert(data.error);

      return;
    }

    setStep("success");

  } catch {

    setNotification({

      message: "Server error occurred",

      type: "info"
    });

    setTimeout(() => {

      setNotification(null);

    }, 3000);
  }
};

  return (
    <main
      className="relative pt-16 min-h-screen flex items-center justify-center px-6"
      style={{ zIndex: 1 }}
    >
      {/* Extra page glow */}
      <div
        className="absolute w-[360px] h-[360px] rounded-full blur-3xl pointer-events-none"
        style={{
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -60%)",
          background: isDark
            ? "radial-gradient(circle, rgba(168,85,247,0.09) 0%, transparent 70%)"
            : "radial-gradient(circle, rgba(124,58,237,0.06) 0%, transparent 70%)",
        }}
      />

      <div className="w-full max-w-md py-14">
        {/* Card */}
        <div className="rounded-2xl overflow-hidden" style={glassCardStyle(isDark)}>
          {/* Card header */}
          <div
            className="px-8 pt-8 pb-6"
            style={{
              borderBottom: isDark
                ? "1px solid rgba(0,212,255,0.09)"
                : "1px solid rgba(0,100,200,0.09)",
            }}
          >
            {/* Icon badge */}
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
              style={{
                background: isDark ? "rgba(168,85,247,0.1)" : "rgba(124,58,237,0.09)",
                border: isDark ? "1px solid rgba(168,85,247,0.28)" : "1px solid rgba(124,58,237,0.22)",
              }}
            >
              {step === "success" ? (
                <CheckCircle className="w-5 h-5" style={{ color: isDark ? "#a855f7" : "#7c3aed" }} />
              ) : (
                <Shield className="w-5 h-5" style={{ color: isDark ? "#a855f7" : "#7c3aed" }} />
              )}
            </div>
            <h1
              className="font-bold mb-1.5"
              style={{
                fontFamily: "Orbitron, sans-serif",
                fontSize: "1.05rem",
                color: isDark ? "#e2eeff" : "#0a1628",
              }}
            >
              {step === "email" && "Quantum Vault Recovery"}
              {step === "otp" && "Verify Your Identity"}
              {step === "reset" && "Create New Password"}
              {step === "success" && "Password Reset Complete"}
            </h1>
            <p className="text-xs leading-relaxed" style={{ opacity: 0.44 }}>
              {step === "email" && "Enter your registered Qumail address to receive OTP verification."}
              {step === "otp" && "We've sent a 6-character code to your phone. Enter it below to continue."}
              {step === "reset" && "Choose a strong password to secure your quantum vault."}
              {step === "success" && "Your password has been successfully reset. You can now sign in."}
            </p>
          </div>

          {/* Step 1: Email */}
          {step === "email" && (
            <form onSubmit={handleSendOTP} className="px-8 py-7 space-y-4">
              <FormInput
                label="Email Address"
                type="email"
                placeholder="aiden@qumail.io"
                icon={<Mail className="w-4 h-4" />}
                isDark={isDark}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <div className="pt-1">
                <GradButton
                  gradient="linear-gradient(135deg, #a855f7 0%, #6366f1 100%)"
                  glow="0 4px 22px rgba(168,85,247,0.28)"
                  glowHover="0 8px 36px rgba(168,85,247,0.48)"
                >
                  Send OTP
                </GradButton>
              </div>

              <div className="flex items-center justify-center pt-2">
                <Link
                  to="/login"
                  className="flex items-center gap-1.5 text-xs hover:underline transition-all"
                  style={{
                    fontFamily: "JetBrains Mono, monospace",
                    color: isDark ? "#00d4ff" : "#005f88",
                  }}
                >
                  <ArrowLeft className="w-3 h-3" />
                  Back to Login
                </Link>
              </div>
            </form>
          )}

          {/* Step 2: OTP Verification */}
          {step === "otp" && (
            <form onSubmit={handleVerifyOTP} className="px-8 py-7 space-y-5">
              <div className="space-y-1.5">
                <label
                  className="block text-xs tracking-wider uppercase"
                  style={{
                    fontFamily: "JetBrains Mono, monospace",
                    color: isDark ? "rgba(226,238,255,0.52)" : "rgba(10,22,40,0.48)",
                  }}
                >
                  Verification Code
                </label>
                <div className="flex justify-center py-3">
                  <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={(value) => {
                      const cleanValue = value.toLowerCase();

                      if (/^[a-z0-9]*$/.test(cleanValue)) {
                        setOtp(cleanValue);
                      }
                    }}
                  >
                    <InputOTPGroup>
                      {[0, 1, 2, 3, 4, 5].map((index) => (
                        <InputOTPSlot
                          key={index}
                          index={index}
                          className="w-11 h-12 text-base"
                          style={{
                            background: isDark ? "rgba(0,212,255,0.05)" : "rgba(0,100,200,0.04)",
                            border: isDark
                              ? "1px solid rgba(168,85,247,0.28)"
                              : "1px solid rgba(124,58,237,0.28)",
                            color: isDark ? "#e2eeff" : "#0a1628",
                            fontFamily: "JetBrains Mono, monospace",
                          }}
                        />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </div>

              {/* Resend timer */}
              <div className="text-center">
                {resendTimer > 0 ? (
                  <p className="text-xs opacity-45" style={{ fontFamily: "JetBrains Mono, monospace" }}>
                    Resend in {String(Math.floor(resendTimer / 60)).padStart(2, "0")}:
                    {String(resendTimer % 60).padStart(2, "0")}
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    className="text-xs hover:underline transition-all"
                    style={{
                      fontFamily: "JetBrains Mono, monospace",
                      color: isDark ? "#a855f7" : "#7c3aed",
                    }}
                  >
                    Resend OTP
                  </button>
                )}
              </div>

              <div className="pt-1">
                <GradButton
                  gradient="linear-gradient(135deg, #a855f7 0%, #6366f1 100%)"
                  glow="0 4px 22px rgba(168,85,247,0.28)"
                  glowHover="0 8px 36px rgba(168,85,247,0.48)"
                >
                  Verify OTP
                </GradButton>
              </div>

              <div className="flex items-center justify-center pt-2">
                <Link
                  to="/login"
                  className="flex items-center gap-1.5 text-xs hover:underline transition-all"
                  style={{
                    fontFamily: "JetBrains Mono, monospace",
                    color: isDark ? "#00d4ff" : "#005f88",
                  }}
                >
                  <ArrowLeft className="w-3 h-3" />
                  Back to Login
                </Link>
              </div>
            </form>
          )}

          {/* Step 3: Reset Password */}
          {step === "reset" && (
            <form onSubmit={handleResetPassword} className="px-8 py-7 space-y-4">
              <FormInput
                label="New Password"
                type={showNewPass ? "text" : "password"}
                placeholder="••••••••••••"
                icon={<Lock className="w-4 h-4" />}
                isDark={isDark}
                rightEl={eyeBtn(showNewPass, () => setShowNewPass(!showNewPass))}
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
              />

              {/* Password strength indicator */}
              {newPass && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span style={{ opacity: 0.44, fontFamily: "JetBrains Mono, monospace" }}>
                      Password Strength
                    </span>
                    <span
                      style={{
                        color: getStrengthColor(passwordStrength),
                        fontFamily: "JetBrains Mono, monospace",
                        fontWeight: 600,
                      }}
                    >
                      {getStrengthLabel(passwordStrength)}
                    </span>
                  </div>
                  <div
                    className="h-1.5 rounded-full overflow-hidden"
                    style={{
                      background: isDark ? "rgba(0,212,255,0.08)" : "rgba(0,100,200,0.08)",
                    }}
                  >
                    <div
                      className="h-full transition-all duration-300 rounded-full"
                      style={{
                        width: `${passwordStrength}%`,
                        background: getStrengthColor(passwordStrength),
                        boxShadow: `0 0 8px ${getStrengthColor(passwordStrength)}66`,
                      }}
                    />
                  </div>
                </div>
              )}

              <FormInput
                label="Confirm Password"
                type={showConfirmPass ? "text" : "password"}
                placeholder="••••••••••••"
                icon={<Lock className="w-4 h-4" />}
                isDark={isDark}
                rightEl={eyeBtn(showConfirmPass, () => setShowConfirmPass(!showConfirmPass))}
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
              />

              <div className="pt-1">
                <GradButton
                  gradient="linear-gradient(135deg, #a855f7 0%, #6366f1 100%)"
                  glow="0 4px 22px rgba(168,85,247,0.28)"
                  glowHover="0 8px 36px rgba(168,85,247,0.48)"
                >
                  Reset Password
                </GradButton>
              </div>

              <div className="flex items-center justify-center pt-2">
                <Link
                  to="/login"
                  className="flex items-center gap-1.5 text-xs hover:underline transition-all"
                  style={{
                    fontFamily: "JetBrains Mono, monospace",
                    color: isDark ? "#00d4ff" : "#005f88",
                  }}
                >
                  <ArrowLeft className="w-3 h-3" />
                  Back to Login
                </Link>
              </div>
            </form>
          )}

          {/* Step 4: Success */}
          {step === "success" && (
            <div className="px-8 py-7 space-y-4">
              {/* Success illustration */}
              <div className="flex justify-center py-4">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center"
                  style={{
                    background: isDark
                      ? "radial-gradient(circle, rgba(168,85,247,0.15) 0%, rgba(168,85,247,0.05) 100%)"
                      : "radial-gradient(circle, rgba(124,58,237,0.12) 0%, rgba(124,58,237,0.04) 100%)",
                    border: isDark ? "2px solid rgba(168,85,247,0.4)" : "2px solid rgba(124,58,237,0.35)",
                    boxShadow: isDark
                      ? "0 0 30px rgba(168,85,247,0.25)"
                      : "0 0 30px rgba(124,58,237,0.15)",
                  }}
                >
                  <CheckCircle
                    className="w-10 h-10"
                    style={{ color: isDark ? "#a855f7" : "#7c3aed" }}
                  />
                </div>
              </div>

              <div className="pt-1">
                <Link to="/login">
                  <GradButton
                    gradient="linear-gradient(135deg, #00d4ff 0%, #a855f7 100%)"
                    glow="0 4px 22px rgba(0,212,255,0.28)"
                    glowHover="0 8px 36px rgba(0,212,255,0.48)"
                  >
                    Sign In Now
                  </GradButton>
                </Link>
              </div>
            </div>
          )}

          {/* Card footer strip */}
          <div
            className="px-8 py-3 flex items-center gap-2 justify-center"
            style={{
              borderTop: isDark
                ? "1px solid rgba(168,85,247,0.08)"
                : "1px solid rgba(124,58,237,0.08)",
              background: isDark ? "rgba(168,85,247,0.02)" : "rgba(124,58,237,0.02)",
            }}
          >
            <Shield className="w-3 h-3 opacity-28" />
            <span
              className="text-xs opacity-28"
              style={{ fontFamily: "JetBrains Mono, monospace" }}
            >
              TLS 1.3 · CRYSTALS-Kyber · CRYSTALS-Dilithium
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}
