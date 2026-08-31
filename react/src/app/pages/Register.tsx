import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Mail, Lock, Eye, EyeOff, User, Phone, Shield, UserPlus } from "lucide-react";
import { FormInput, GradButton, glassCardStyle } from "../components/FormElements";

export default function Register() {
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
          });
  const navigate = useNavigate();
  
  const validateForm = () => {
  const newErrors = {
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  };

  // Full Name
  if (!name.trim()) {
    newErrors.name = "Full name is required.";
  } else if (!/^[A-Za-z ]+$/.test(name)) {
    newErrors.name = "Full name can contain only alphabets.";
  } else if (name.length > 20) {
    newErrors.name = "Full name must not exceed 20 characters.";
  }

  // Email
  if (!email.trim()) {
    newErrors.email = "Email address is required.";
  }

  // Mobile Number
  if (!phone.trim()) {
    newErrors.phone = "Mobile number is required.";
  } else if (!/^\d+$/.test(phone)) {
    newErrors.phone = "Mobile number can contain only numbers.";
  } else if (phone.length !== 10) {
    newErrors.phone = "Mobile number must contain exactly 10 digits.";
  }

  // Password
  if (!password) {
    newErrors.password = "Password is required.";
  } else if (password.length < 8) {
    newErrors.password = "Password must contain at least 8 characters.";
  } else if (!/[A-Z]/.test(password)) {
    newErrors.password = "Password must contain at least one uppercase letter.";
  } else if (!/[a-z]/.test(password)) {
    newErrors.password = "Password must contain at least one lowercase letter.";
  } else if (!/[0-9]/.test(password)) {
    newErrors.password = "Password must contain at least one number.";
  } else if (!/[!@#$%^&*]/.test(password)) {
    newErrors.password =
      "Password must contain at least one special character.";
  } else {

  // ==========================================
  // NAME / EMAIL CHECK
  // ==========================================

  const passwordLower = password.toLowerCase();

  const nameLower = name
    .toLowerCase()
    .replace(/\s+/g, "");
  
  const emailLower = email
    .toLowerCase();

  const emailUsername = emailLower.split("@")[0];

  if (
    (nameLower.length >= 3 && passwordLower.includes(nameLower)) ||
    (emailUsername.length >= 3 && passwordLower.includes(emailUsername))
  ) {
    newErrors.password =
      "Password must not contain your name or email.";
  }
}

  // Confirm Password
  if (!confirmPassword) {
    newErrors.confirmPassword = "Please confirm your password.";
  } else if (password !== confirmPassword) {
    newErrors.confirmPassword = "Passwords do not match.";
  }

  setErrors(newErrors);

  return !Object.values(newErrors).some((error) => error !== "");
};

  const passwordRequirements = {
  length: password.length >= 8,
  uppercase: /[A-Z]/.test(password),
  lowercase: /[a-z]/.test(password),
  number: /\d/.test(password),
  special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  noNameNoMail:
    password.length >= 0 &&
    !(
      (name.toLowerCase().length >= 3 && password.toLowerCase().includes(name.toLowerCase())) || 
      (email.toLowerCase().length >= 3 && password.toLowerCase().includes(email.toLowerCase()))
    ),
  };
  const eyeBtn = (visible: boolean, toggle: () => void) => (
    <button
      onClick={toggle}
      className="opacity-50 hover:opacity-75 transition-opacity"
      style={{ color: "#7A6D63" }}
    >
      {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
    </button>
  );

  const handleRegister = async () => {
    if (!validateForm()) {
    return;
  }
    try {
      // setError("");

      const response = await fetch(
        "http://127.0.0.1:8000/register/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            name: name,
            email: email,
            password: password,
            confirm_password: confirmPassword,
            phone_number: phone
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        // setError(data.error);
        return;
      }

      navigate("/login");
    } catch (err) {
      // setError("Server error");
    }
  };

  return (
    <main
      className="relative pt-16 min-h-screen flex items-center justify-center px-6"
      style={{ zIndex: 1 }}
    >
      {/* Page glow */}
      <div
        className="absolute w-[360px] h-[360px] rounded-full blur-3xl pointer-events-none"
        style={{
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -55%)",
          background: "radial-gradient(circle, rgba(184,155,94,0.07) 0%, transparent 70%)",
        }}
      />

      <div className="w-full max-w-md py-14">
        {/* Card */}
        <div className="rounded-2xl overflow-hidden" style={glassCardStyle(false)}>

          {/* Card header */}
          <div
            className="px-8 pt-8 pb-6"
            style={{ borderBottom: "1px solid #E6DDD2" }}
          >
            {/* Icon badge */}
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
              style={{
                background: "rgba(184,155,94,0.12)",
                border: "1px solid rgba(184,155,94,0.35)",
              }}
            >
              <UserPlus className="w-5 h-5" style={{ color: "#B89B5E" }} />
            </div>
            <h1
              className="font-bold mb-1.5"
              style={{
                fontFamily: "Orbitron, sans-serif",
                fontSize: "1.05rem",
                color: "#3B2A23",
              }}
            >
              Create Your Quantum Vault
            </h1>
            <p className="text-xs leading-relaxed" style={{ color: "#7A6D63" }}>
              Join thousands securing their digital communications with quantum-grade encryption.
            </p>
          </div>

          {/* Form */}
          <div className="px-8 py-7 space-y-3.5">
            <FormInput
              label="Full Name"
              type="text"
              placeholder="Aiden Mercer"
              icon={<User className="w-4 h-4" />}
              isDark={false}
              value={name}
              maxLength={20}
              required
              error={errors.name}
              onChange={(e) => {
                      const value = e.target.value;

                      if (/^[A-Za-z ]*$/.test(value)) {
                        setName(value);

                        setErrors((prev) => ({
                          ...prev,
                          name: "",
                        }));
                      }
                    }}
            />
            <FormInput
              label="Create Email Address"
              type="email"
              placeholder="aiden@qumail.io"
              icon={<Mail className="w-4 h-4" />}
              isDark={false}
              value={email}
              required
              error={errors.email}
              onChange={(e) => {
                      const value = e.target.value;

                      setEmail(value);

                      setErrors((prev) => ({
                        ...prev,
                        email: "",
                      }));
                    }}
            />
            <FormInput
              label="Mobile Number"
              type="tel"
              placeholder="+91 XXXXXXXXXX"
              icon={<Phone className="w-4 h-4" />}
              isDark={false}
              value={phone}
              maxLength={10}
              required
              error={errors.phone}
              onChange={(e) => {
                      const value = e.target.value;

                      if (/^\d*$/.test(value)) {
                        setPhone(value);

                        setErrors((prev) => ({
                          ...prev,
                          phone: "",
                        }));
                      }
                    }}
            />
            <FormInput
              label="Password"
              type={showPass ? "text" : "password"}
              placeholder="••••••••••••"
              icon={<Lock className="w-4 h-4" />}
              isDark={false}
              value={password}
              maxLength={20}
              required
              error={errors.password}
              onChange={(e) => {
                    const value = e.target.value;

                    setPassword(value);

                    setErrors((prev) => ({
                      ...prev,
                      password: "",
                    }));
                  }}
              rightEl={eyeBtn(showPass, () => setShowPass(!showPass))}
            />
            <div className="mt-2 ml-1 text-xs">
              <p style={{ color: "#8C8177" }}>
                Password must contain:
              </p>

              <div className="mt-1 space-y-1">
                <p style={{ color: passwordRequirements.length ? "#4CAF50" : "#A69B91" }}>
                  {passwordRequirements.length ? "✓" : "•"} At least 8 characters
                </p>

                <p style={{ color: passwordRequirements.uppercase ? "#4CAF50" : "#A69B91" }}>
                  {passwordRequirements.uppercase ? "✓" : "•"} One uppercase letter
                </p>

                <p style={{ color: passwordRequirements.lowercase ? "#4CAF50" : "#A69B91" }}>
                  {passwordRequirements.lowercase ? "✓" : "•"} One lowercase letter
                </p>

                <p style={{ color: passwordRequirements.number ? "#4CAF50" : "#A69B91" }}>
                  {passwordRequirements.number ? "✓" : "•"} One number
                </p>

                <p style={{ color: passwordRequirements.special ? "#4CAF50" : "#A69B91" }}>
                  {passwordRequirements.special ? "✓" : "•"} One special character
                </p>
                <p style={{ color: passwordRequirements.noNameNoMail ? "#4CAF50" : "#A69B91" }}>
                  {passwordRequirements.noNameNoMail ? "✓" : "•"} {" "} Must not contain your name or email
                </p>
              </div>
            </div>
            <FormInput
              label="Confirm Password"
              type={showConfirm ? "text" : "password"}
              placeholder="••••••••••••"
              icon={<Shield className="w-4 h-4" />}
              isDark={false}
              value={confirmPassword}
              required
              error={errors.confirmPassword}
              onChange={(e) => {
                    const value = e.target.value;

                    setConfirmPassword(value);

                    setErrors((prev) => ({
                      ...prev,
                      confirmPassword: "",
                    }));
                  }}
              rightEl={eyeBtn(showConfirm, () => setShowConfirm(!showConfirm))}
            />

          

            <div className="pt-2">
              <GradButton
                gradient="linear-gradient(135deg, #B89B5E 0%, #B89B5E 100%)"
                glow="0 4px 22px rgba(184,155,94,0.28)"
                glowHover="0 8px 36px rgba(184,155,94,0.45)"
                onClick={handleRegister}
              >
                Create Quantum Account
              </GradButton>
            </div>

            <p className="text-center text-xs" style={{ color: "#7A6D63" }}>
              Already secured?{" "}
              <Link
                to="/login"
                className="underline hover:opacity-80 transition-opacity"
                style={{ color: "#B89B5E" }}
              >
                Sign in
              </Link>
            </p>
          </div>

          {/* Card footer strip */}
          <div
            className="px-8 py-3 flex items-center gap-2 justify-center"
            style={{
              borderTop: "1px solid #E6DDD2",
              background: "rgba(184,155,94,0.025)",
            }}
          >
            <Shield className="w-3 h-3" style={{ color: "#A89B91", opacity: 0.6 }} />
            <span
              className="text-xs"
              style={{ fontFamily: "JetBrains Mono, monospace", color: "#A89B91" }}
            >
              TLS 1.3 · CRYSTALS-Kyber · CRYSTALS-Dilithium
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}
