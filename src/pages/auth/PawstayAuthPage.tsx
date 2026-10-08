import React, { useState, useId, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, Checkbox, message, Typography } from "antd";
import { UserOutlined, MailOutlined, LockOutlined, PhoneOutlined, EyeInvisibleOutlined, EyeTwoTone } from "@ant-design/icons";
import { loginCustomer, registerCustomer, verifyOtp, resendOtp } from '@/api/authApi';
import { useAuth } from "@/auth/AuthContext";
import { ROLE_BASE } from "@/auth/roles";
import { getErrorMessage } from "@/api/client";
import "./auth.css"; // Keep their original CSS for AntD overrides

const { Title, Text } = Typography;
type AuthState = 'login' | 'register' | 'otp';

export default function PawstayAuthPage() {
    const { signIn } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const getInitialView = (): AuthState => {
        if (location.pathname.includes('register')) return 'register';
        if (location.pathname.includes('verify-otp')) return 'otp';
        return 'login';
    };

    const [view, setView] = useState<AuthState>(getInitialView());
    const [loading, setLoading] = useState(false);
    
    // OTP states
    const emailFromUrl = new URLSearchParams(location.search).get("email") || "";
    const [savedEmail, setSavedEmail] = useState(emailFromUrl);
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [resending, setResending] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        setView(getInitialView());
    }, [location.pathname]);

    useEffect(() => {
        if (countdown > 0) {
            const t = setTimeout(() => setCountdown(c => c - 1), 1000);
            return () => clearTimeout(t);
        }
    }, [countdown]);

    const handleSwitchView = (newView: AuthState) => {
        if (newView === 'login') navigate('/login');
        if (newView === 'register') navigate('/register');
        if (newView === 'otp') navigate(`/verify-otp?email=${encodeURIComponent(savedEmail)}`);
    };

    // Form Submits
    const onLoginFinish = async (values: any) => {
        setLoading(true);
        try {
            const res = await loginCustomer({ email: values.email, password: values.password });
            signIn("customer");
            const userName = res.result?.fullName || "there";
            message.success(`Hello, ${userName}! Welcome back.`);
            navigate(ROLE_BASE["customer"] || "/");
        } catch (error: any) {
            message.error(getErrorMessage(error));
        } finally {
            setLoading(false);
        }
    };

    const onRegisterFinish = async (values: any) => {
        setLoading(true);
        try {
            const res = await registerCustomer({
                email: values.email,
                password: values.password,
                confirmPassword: values.confirmPassword,
                fullName: values.fullName,
                phoneNumber: values.phone,
            });
            message.success(res.message || "Account created! Check your email for the OTP code.");
            setSavedEmail(values.email);
            navigate(`/verify-otp?email=${encodeURIComponent(values.email)}`);
        } catch (error: any) {
            message.error(getErrorMessage(error));
        } finally {
            setLoading(false);
        }
    };

    // OTP Handlers
    const handleOtpChange = (index: number, val: string) => {
        if (!/^\d*$/.test(val)) return;
        const newOtp = [...otp];
        newOtp[index] = val.slice(-1);
        setOtp(newOtp);
        if (val && index < 5) inputRefs.current[index + 1]?.focus();
    };

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleOtpPaste = (e: React.ClipboardEvent) => {
        const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
        if (pasted.length === 6) {
            setOtp(pasted.split(""));
            inputRefs.current[5]?.focus();
        }
        e.preventDefault();
    };

    const onOtpSubmit = async () => {
        const code = otp.join("");
        if (code.length < 6) { message.warning("Please enter all 6 digits"); return; }
        if (!savedEmail) { message.error("Email not found"); return; }
        
        setLoading(true);
        try {
            const res = await verifyOtp({ email: savedEmail, otpCode: code });
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

    const handleResendOtp = async () => {
        if (!savedEmail) return;
        setResending(true);
        try {
            const res = await resendOtp({ email: savedEmail });
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

    const isOtpComplete = otp.every(d => d !== "");

    // Colors & Styles from new UI
    const colors = { bg: "#F9F8F4", accent: "#244C3C", textMuted: "#758078", border: "#DCDDD4", formBg: "rgba(255, 251, 242, 0.72)", white: "#FFFFFF" };
    const font = '"Nunito", sans-serif';

    return (
        <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: colors.bg, fontFamily: font }}>
            {/* NỬA TRÁI: ẢNH CHÚ CHÓ */}
            <div style={{ flex: 1.2, padding: 16, display: 'flex' }}>
                <div style={{
                    width: '100%', height: '100%', minHeight: 'calc(100vh - 32px)', borderRadius: 24, overflow: 'hidden', position: 'relative',
                    backgroundImage: 'url("https://images.unsplash.com/photo-1668180540678-e6ccd67d1c17?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=1200")',
                    backgroundSize: 'cover', backgroundPosition: 'center',
                }}>
                    <div style={{
                        position: 'absolute', bottom: 24, left: 24, right: 24,
                        backgroundColor: colors.accent, borderRadius: 16, padding: '24px 32px', color: colors.white
                    }}>
                        <h2 style={{ margin: '0 0 8px 0', fontSize: 24, fontWeight: 800 }}>Good care. Happy pets.<br/>Peace of mind.</h2>
                        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, opacity: 0.9 }}>
                            From fresh trims to cozy stays, their next little adventure starts here.
                        </p>
                    </div>
                </div>
            </div>

            {/* NỬA PHẢI: FORM */}
            <div style={{ 
                flex: 1, display: 'flex', flexDirection: 'column', 
                alignItems: 'center', padding: '16px 8%', boxSizing: 'border-box',
                overflowY: 'auto', maxHeight: '100vh'
            }}>
                <div style={{ maxWidth: 400, width: '100%', margin: 'auto 0' }}>
                    
                    <div style={{ marginBottom: 24 }}>
                        <h1 style={{ color: colors.accent, margin: 0, fontSize: 24, fontWeight: 900, letterSpacing: '-0.02em' }}>pawstay.</h1>
                        <p style={{ color: colors.textMuted, margin: '4px 0 0 0', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                            Your pet's happy place
                        </p>
                    </div>

                    <div style={{ marginBottom: 16 }}>
                        <h2 style={{ color: colors.accent, margin: '0 0 8px 0', fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em' }}>
                            {view === 'login' ? 'Welcome back.' : view === 'register' ? 'Join pawstay.' : 'Verify email.'}
                        </h2>
                        <p style={{ color: colors.textMuted, margin: 0, fontSize: 13, lineHeight: 1.4 }}>
                            {view === 'login' 
                                ? "Sign in to book grooming, plan a cozy stay, and keep your pet's care in one place."
                                : view === 'register'
                                ? "Create an account to easily book appointments, manage your pet's profile, and more."
                                : "We've sent a 6-digit verification code to your email. Enter it below."}
                        </p>
                    </div>

                    {/* Box Form */}
                    <div style={{
                        background: colors.formBg, border: `1px solid ${colors.border}`,
                        borderRadius: 16, padding: 20, boxSizing: 'border-box'
                    }}>
                        {view === 'login' && (
                            <Form name="login" onFinish={onLoginFinish} layout="vertical" requiredMark={false}>
                                <Form.Item name="email" label={<span style={{color: colors.accent, fontWeight: 700}}>Email address</span>}
                                    rules={[{ required: true, message: 'Email is required' }, { type: 'email', message: 'Invalid email' }]}
                                >
                                    <Input className="auth-input" prefix={<MailOutlined className="auth-input-icon" />} placeholder="you@example.com" />
                                </Form.Item>

                                <Form.Item name="password" label={<span style={{color: colors.accent, fontWeight: 700}}>Password</span>}
                                    rules={[{ required: true, message: 'Password is required' }]}
                                >
                                    <Input.Password className="auth-input" prefix={<LockOutlined className="auth-input-icon" />} placeholder="Enter your password"
                                        iconRender={v => v ? <EyeTwoTone twoToneColor={colors.accent} /> : <EyeInvisibleOutlined />}
                                    />
                                </Form.Item>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                    <Form.Item name="remember" valuePropName="checked" noStyle>
                                        <Checkbox style={{color: colors.textMuted}}>Remember me</Checkbox>
                                    </Form.Item>
                                    <a href="#" style={{ color: colors.accent, fontSize: 13, fontWeight: 700 }}>Forgot password?</a>
                                </div>

                                <Button type="primary" htmlType="submit" loading={loading} block
                                    style={{ height: 40, borderRadius: 10, background: colors.accent, fontWeight: 700 }}
                                >
                                    Sign In
                                </Button>
                            </Form>
                        )}

                        {view === 'register' && (
                            <Form name="register" onFinish={onRegisterFinish} layout="vertical" requiredMark={false} scrollToFirstError>
                                <Form.Item name="fullName" label={<span style={{color: colors.accent, fontWeight: 700}}>Full name</span>}
                                    rules={[{ required: true, message: 'Full name is required', whitespace: true }]}
                                >
                                    <Input className="auth-input" prefix={<UserOutlined className="auth-input-icon" />} placeholder="Nguyen Van A" />
                                </Form.Item>

                                <Form.Item name="email" label={<span style={{color: colors.accent, fontWeight: 700}}>Email address</span>}
                                    rules={[{ required: true, message: 'Email is required' }, { type: 'email', message: 'Invalid email format' }]}
                                >
                                    <Input className="auth-input" prefix={<MailOutlined className="auth-input-icon" />} placeholder="you@example.com" />
                                </Form.Item>

                                <Form.Item name="phone" label={<span style={{color: colors.accent, fontWeight: 700}}>Phone number</span>}
                                    rules={[{ required: true, message: 'Phone number is required' }]}
                                >
                                    <Input className="auth-input" prefix={<PhoneOutlined className="auth-input-icon" />} placeholder="0901 234 567" />
                                </Form.Item>

                                <Form.Item name="password" label={<span style={{color: colors.accent, fontWeight: 700}}>Password</span>}
                                    rules={[{ required: true, message: 'Password is required' }, { min: 6, message: 'At least 6 characters' }]}
                                >
                                    <Input.Password className="auth-input" prefix={<LockOutlined className="auth-input-icon" />} placeholder="Create a strong password"
                                        iconRender={v => v ? <EyeTwoTone twoToneColor={colors.accent} /> : <EyeInvisibleOutlined />}
                                    />
                                </Form.Item>

                                <Form.Item name="confirmPassword" label={<span style={{color: colors.accent, fontWeight: 700}}>Confirm password</span>}
                                    dependencies={['password']}
                                    rules={[
                                        { required: true, message: 'Please confirm your password' },
                                        ({ getFieldValue }) => ({
                                            validator(_, value) {
                                                if (!value || getFieldValue('password') === value) return Promise.resolve();
                                                return Promise.reject(new Error('Passwords do not match'));
                                            },
                                        }),
                                    ]}
                                >
                                    <Input.Password className="auth-input" prefix={<LockOutlined className="auth-input-icon" />} placeholder="Repeat your password"
                                        iconRender={v => v ? <EyeTwoTone twoToneColor={colors.accent} /> : <EyeInvisibleOutlined />}
                                    />
                                </Form.Item>

                                <Button type="primary" htmlType="submit" loading={loading} block
                                    style={{ height: 40, borderRadius: 10, background: colors.accent, fontWeight: 700, marginTop: 8 }}
                                >
                                    Create Account
                                </Button>
                            </Form>
                        )}

                        {view === 'otp' && (
                            <div>
                                <div style={{ color: colors.accent, fontWeight: 700, marginBottom: 8, fontSize: 13 }}>6-Digit Code</div>
                                <div className="otp-input-row" onPaste={handleOtpPaste} style={{ margin: '0 0 24px 0', gap: 8 }}>
                                    {otp.map((digit, i) => (
                                        <input
                                            key={i}
                                            ref={el => { inputRefs.current[i] = el; }}
                                            className={`otp-box ${digit ? "otp-box--filled" : ""}`}
                                            type="text" inputMode="numeric" maxLength={1} value={digit}
                                            onChange={e => handleOtpChange(i, e.target.value)}
                                            onKeyDown={e => handleOtpKeyDown(i, e)}
                                            autoComplete="off"
                                            style={{ 
                                                width: '100%', height: 48, borderRadius: 10,
                                                textAlign: 'center', fontSize: 20, fontWeight: 700, color: colors.accent
                                            }}
                                        />
                                    ))}
                                </div>

                                <Button type="primary" loading={loading} disabled={!isOtpComplete} onClick={onOtpSubmit} block
                                    style={{ height: 40, borderRadius: 10, background: isOtpComplete ? colors.accent : '#d1d5db', fontWeight: 700 }}
                                >
                                    Verify & Activate
                                </Button>

                                <div style={{ textAlign: 'center', marginTop: 16 }}>
                                    <span style={{ color: colors.textMuted, fontSize: 13, marginRight: 8 }}>Didn't receive code?</span>
                                    <Button type="link" onClick={handleResendOtp} disabled={countdown > 0 || resending} loading={resending} 
                                        style={{ padding: 0, color: colors.accent, fontWeight: 700 }}
                                    >
                                        {countdown > 0 ? `Resend in ${countdown}s` : "Resend"}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div style={{ marginTop: 16, textAlign: 'center', color: colors.textMuted, fontSize: 13 }}>
                        {view === 'login' && (
                            <>Don't have an account? <button type="button" onClick={() => handleSwitchView('register')} style={{ background: 'none', border: 'none', color: colors.accent, fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}>Sign up</button></>
                        )}
                        {view === 'register' && (
                            <>Already have an account? <button type="button" onClick={() => handleSwitchView('login')} style={{ background: 'none', border: 'none', color: colors.accent, fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}>Sign in</button></>
                        )}
                        {view === 'otp' && (
                            <button type="button" onClick={() => handleSwitchView('login')} style={{ background: 'none', border: 'none', color: colors.accent, fontWeight: 700, cursor: 'pointer', textDecoration: 'underline', marginTop: 8 }}>Back to login</button>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}
