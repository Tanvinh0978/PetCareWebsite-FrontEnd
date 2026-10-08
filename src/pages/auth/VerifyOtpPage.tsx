import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Button, Typography, message } from "antd";
import { verifyOtp, resendOtp } from "@/api/authApi";
import { getErrorMessage } from "@/api/client";
import "./auth.css";

const { Title, Text } = Typography;

export default function VerifyOtpPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = new URLSearchParams(location.search).get("email");

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!email) navigate("/register");
    else inputRefs.current[0]?.focus();
  }, [email, navigate]);

  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [countdown]);

  const handleChange = (index: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const newOtp = [...otp];
    newOtp[index] = val.slice(-1);
    setOtp(newOtp);
    if (val && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      inputRefs.current[5]?.focus();
    }
    e.preventDefault();
  };

  const handleSubmit = async () => {
    const code = otp.join("");
    if (code.length < 6) { message.warning("Please enter all 6 digits"); return; }
    if (!email) return;
    setLoading(true);
    try {
      const res = await verifyOtp({ email, otpCode: code });
      message.success(res.message || "Account activated! Welcome to PetCare.");
      navigate("/login");
    } catch (error: any) {
      message.error(getErrorMessage(error));
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    try {
      const res = await resendOtp({ email });
      message.success(res.message || "New OTP sent to your email.");
      setCountdown(60);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (error: any) {
      message.error(getErrorMessage(error));
    } finally {
      setResending(false);
    }
  };

  const isComplete = otp.every(d => d !== "");

  return (
    <div className="auth-shell">
      {/* ══ LEFT PANEL ══ */}
      <div className="auth-left">
        <div className="auth-left-bg-image"
          style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1592194996308-7b43878e84a6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1500&q=80")' }}
        />
        <div className="auth-left-overlay" />

        <div className="auth-left-content">
          <div className="auth-left-logo">
            🐾 PetCare
          </div>
          <p className="auth-left-sub">
            Just one more step to activate your account and start booking services.
          </p>
        </div>
      </div>

      {/* ══ RIGHT PANEL ══ */}
      <div className="auth-right">
        <div className="auth-form-card">
          <div className="auth-form-header">
            <Title level={2} className="auth-form-title">📩 Verify Your Email</Title>
            <Text className="auth-form-subtitle">
              We sent a 6-digit OTP to<br/>
              <strong style={{ color: '#111827' }}>{email}</strong>
            </Text>
          </div>

          {/* OTP Input Boxes */}
          <div className="otp-input-row" onPaste={handlePaste}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={el => { inputRefs.current[i] = el; }}
                className={`otp-box ${digit ? "otp-box--filled" : ""}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                autoComplete="off"
              />
            ))}
          </div>

          <Button
            type="primary"
            className="auth-btn-primary"
            style={{ marginTop: 24 }}
            loading={loading}
            disabled={!isComplete}
            onClick={handleSubmit}
            block
          >
            Verify & Activate
          </Button>

          <div className="otp-resend-box">
            <Text className="auth-footer-text" style={{ marginRight: 8 }}>Didn't receive the code?</Text>
            <Button type="link" onClick={handleResend} disabled={countdown > 0 || resending} loading={resending} className="auth-link-bold" style={{ padding: 0 }}>
              {countdown > 0 ? `Resend in ${countdown}s` : "Resend OTP"}
            </Button>
          </div>

          <div className="auth-footer">
            <Link to="/login" className="auth-back-link">← Back to Login</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
