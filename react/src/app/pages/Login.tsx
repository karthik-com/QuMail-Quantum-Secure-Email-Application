import { useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Shield,
} from "lucide-react";

import {
  FormInput,
  GradButton,
  glassCardStyle,
} from "../components/FormElements";

export default function Login() {

  const [showPass, setShowPass] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Errors displayed under fields
  const [errors, setErrors] = useState({
    email: "",
    password: "",
  });

  const navigate = useNavigate();

  // =====================================================
  // PASSWORD EYE BUTTON
  // =====================================================

  const eyeBtn = (
    visible: boolean,
    toggle: () => void
  ) => (

    <button
      type="button"
      onClick={toggle}
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
  // LOGIN
  // =====================================================

  const handleLogin = async () => {

    // ----------------------------------------
    // CLEAR OLD ERRORS
    // ----------------------------------------

    const newErrors = {
      email: "",
      password: "",
    };

    // ----------------------------------------
    // EMAIL VALIDATION
    // ----------------------------------------

    if (!email.trim()) {

      newErrors.email =
        "Enter your email";
    }

    // ----------------------------------------
    // PASSWORD VALIDATION
    // ----------------------------------------

    if (!password) {

      newErrors.password =
        "Enter your password";
    }

    // ----------------------------------------
    // DISPLAY VALIDATION ERRORS
    // ----------------------------------------

    setErrors(newErrors);

    // ----------------------------------------
    // STOP IF EMPTY
    // ----------------------------------------

    if (
      newErrors.email ||
      newErrors.password
    ) {

      return;
    }

    // =====================================================
    // LOGIN API
    // =====================================================

    try {

      const response = await fetch(
        "http://127.0.0.1:8000/login/",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            username: email,
            password: password,
          }),
        }
      );

      const data =
        await response.json();

      // =====================================================
      // LOGIN FAILED
      // =====================================================

      if (!response.ok) {

        // ----------------------------------------
        // INVALID EMAIL
        // ----------------------------------------

        if (
          data.error_type === "email"
        ) {

          setErrors({
            email:
              "Invalid email ID",

            password: "",
          });
        }

        // ----------------------------------------
        // INVALID PASSWORD
        // ----------------------------------------

        else if (
          data.error_type === "password"
        ) {

          setErrors({
            email: "",

            password:
              data.error ||
              "Invalid password",
          });
        }

        // ----------------------------------------
        // BOTH INVALID
        // ----------------------------------------

        else if (
          data.error_type === "both"
        ) {

          setErrors({
            email: "",

            password:
              "Invalid email ID and password",
          });
        }

        // ----------------------------------------
        // TEMPORARY PASSWORD EXPIRED
        // ----------------------------------------

        else if (
          data.error_type ===
          "temporary_password_expired"
        ) {

          setErrors({
            email: "",

            password:
              data.error ||
              "Your temporary password has expired. Please contact the administrator.",
          });
        }

        // ----------------------------------------
        // ACCOUNT LOCKED
        // ----------------------------------------

        else if (
          data.error_type ===
          "account_locked"
        ) {

          setErrors({
            email: "",

            password:
              data.error ||
              "Your account is locked. Please contact the administrator.",
          });
        }

        // ----------------------------------------
        // FALLBACK
        // ----------------------------------------

        else {

          setErrors({
            email: "",

            password:
              data.error ||
              "Login failed",
          });
        }

        return;
      }

      // =====================================================
      // LOGIN SUCCESS
      // =====================================================

      localStorage.setItem(
        "access",
        data.access
      );

      localStorage.setItem(
        "refresh",
        data.refresh
      );

      // =====================================================
      // TEMPORARY PASSWORD
      // =====================================================

      if (
        data.must_change_password === true
      ) {

        navigate(
          "/change-password"
        );

        return;
      }

      // =====================================================
      // NORMAL LOGIN
      // =====================================================

      if (data.is_admin) {

        navigate(
          "/admin-dashboard"
        );

      } else {

        navigate(
          "/dashboard"
        );
      }

    } catch (err) {

      console.error(
        "Login error:",
        err
      );

      setErrors({
        email: "",

        password:
          "Unable to connect to server",
      });
    }
  };

  // =====================================================
  // UI
  // =====================================================

  return (

    <main
      className="relative pt-16 min-h-screen flex items-center justify-center px-6"
      style={{
        zIndex: 1
      }}
    >

      {/* Page glow */}

      <div
        className="absolute w-[360px] h-[360px] rounded-full blur-3xl pointer-events-none"
        style={{
          top: "50%",
          left: "50%",

          transform:
            "translate(-50%, -60%)",

          background:
            "radial-gradient(circle, rgba(184,155,94,0.07) 0%, transparent 70%)",
        }}
      />

      <div
        className="w-full max-w-md py-14"
      >

        {/* Card */}

        <div
          className="rounded-2xl overflow-hidden"
          style={glassCardStyle(false)}
        >

          {/* =================================================
              HEADER
          ================================================= */}

          <div
            className="px-8 pt-8 pb-6"
            style={{
              borderBottom:
                "1px solid #E6DDD2",
            }}
          >

            {/* Icon */}

            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
              style={{
                background:
                  "rgba(184,155,94,0.12)",

                border:
                  "1px solid rgba(184,155,94,0.35)",
              }}
            >

              <Lock
                className="w-5 h-5"
                style={{
                  color: "#B89B5E"
                }}
              />

            </div>

            <h1
              className="font-bold mb-1.5"
              style={{
                fontFamily:
                  "Orbitron, sans-serif",

                fontSize:
                  "1.05rem",

                color:
                  "#3B2A23",
              }}
            >
              Access Your Quantum Vault
            </h1>

            <p
              className="text-xs leading-relaxed"
              style={{
                color:
                  "#7A6D63",
              }}
            >
              Authenticate to access your
              end-to-end encrypted inbox.
            </p>

          </div>

          {/* =================================================
              FORM
          ================================================= */}

          <div
            className="px-8 py-7 space-y-4"
          >

            {/* =================================================
                EMAIL
            ================================================= */}

            <div>

              <FormInput
                label="Email Address"
                type="email"
                placeholder="aiden@qumail.io"

                icon={
                  <Mail className="w-4 h-4" />
                }

                isDark={false}

                value={email}

                onChange={(e) => {

                  setEmail(
                    e.target.value
                  );

                  setErrors((prev) => ({
                    ...prev,
                    email: "",
                  }));
                }}
              />

              {errors.email && (

                <p className="text-red-500 text-xs mt-1">
                  {errors.email}
                </p>

              )}

            </div>

            {/* =================================================
                PASSWORD
            ================================================= */}

            <div>

              <FormInput
                label="Password"

                type={
                  showPass
                    ? "text"
                    : "password"
                }

                placeholder="••••••••••••"

                icon={
                  <Lock className="w-4 h-4" />
                }

                isDark={false}

                value={password}

                onChange={(e) => {

                  setPassword(
                    e.target.value
                  );

                  setErrors((prev) => ({
                    ...prev,
                    password: "",
                  }));
                }}

                rightEl={
                  eyeBtn(
                    showPass,
                    () =>
                      setShowPass(
                        !showPass
                      )
                  )
                }
              />

              {errors.password && (

                <p className="text-red-500 text-xs mt-1">
                  {errors.password}
                </p>

              )}

            </div>

            {/* =================================================
                SIGN IN
            ================================================= */}

            <div className="pt-1">

              <GradButton
                gradient="linear-gradient(135deg, #B89B5E 0%, #B89B5E 100%)"

                glow="0 4px 22px rgba(184,155,94,0.28)"

                glowHover="0 8px 36px rgba(184,155,94,0.45)"

                onClick={handleLogin}
              >
                Sign In
              </GradButton>

            </div>

            {/* =================================================
                CREATE ACCOUNT
            ================================================= */}

            <p
              className="text-center text-xs"
              style={{
                color:
                  "#7A6D63",
              }}
            >

              No account?{" "}

              <Link
                to="/register"
                className="underline hover:opacity-80 transition-opacity"
                style={{
                  color:
                    "#B89B5E",
                }}
              >
                Create one
              </Link>

            </p>

          </div>

          {/* =================================================
              FOOTER
          ================================================= */}

          <div
            className="px-8 py-3 flex items-center gap-2 justify-center"
            style={{
              borderTop:
                "1px solid #E6DDD2",

              background:
                "rgba(184,155,94,0.025)",
            }}
          >

            <Shield
              className="w-3 h-3"
              style={{
                color:
                  "#A89B91",

                opacity:
                  0.6,
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

    </main>
  );
}