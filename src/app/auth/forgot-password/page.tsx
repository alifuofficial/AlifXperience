"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail, Lock, ShieldCheck, KeyRound, Loader2, CheckCircle2 } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Request Email, 2: Enter Code & Pass, 3: Success Confirmation
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const router = useRouter();

  // Step 1: Request Reset Code
  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/reset-password/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to request code.");

      setSuccessMsg(data.message);
      setStep(2);
    } catch (err: any) {
      setError(err.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify Code and Update Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/reset-password/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed.");

      setStep(3);
    } catch (err: any) {
      setError(err.message || "Invalid or expired reset code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left Side - Visual */}
      <div className="hidden md:flex md:w-1/2 bg-brand-900 relative items-center justify-center p-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-600 via-brand-800 to-indigo-950 opacity-80" />
        <div className="relative z-10 text-white max-w-md space-y-6">
          <Link href="/auth/signin" className="inline-flex items-center space-x-2 text-brand-200 hover:text-white transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Sign In</span>
          </Link>
          <h1 className="text-5xl font-bold font-serif leading-tight">Secure & Safe Recovery.</h1>
          <p className="text-brand-100/70 text-lg">We employ multi-layer encryption to keep your digital identity protected at all times.</p>
          <div className="pt-8 flex items-center space-x-4">
             <div className="p-3 bg-brand-700/30 rounded-2xl border border-brand-500/20 backdrop-blur-md">
                <KeyRound className="w-8 h-8 text-brand-300 animate-pulse" />
             </div>
             <p className="text-sm text-brand-200 max-w-[200px]">Password reset codes are generated and hashed securely.</p>
          </div>
        </div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl" />
      </div>

      {/* Right Side - Form Work */}
      <div className="flex-1 flex items-center justify-center p-8 bg-surface">
        <div className="max-w-md w-full space-y-8">
          
          {/* Back button for mobile */}
          <div className="md:hidden">
            <Link href="/auth/signin" className="inline-flex items-center space-x-2 text-brand-600 hover:text-brand-900 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-semibold">Back to Sign In</span>
            </Link>
          </div>

          {/* STEP 1: REQUEST CODE */}
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-3xl font-bold font-serif text-brand-900">Forgot Password?</h2>
                <p className="text-brand-400 mt-2 text-sm leading-relaxed">
                  Enter the email address registered with your account. We will send you a 6-digit code to securely verify your identity.
                </p>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-150 text-red-600 rounded-xl text-xs font-semibold">
                  {error}
                </div>
              )}

              <form onSubmit={handleRequestCode} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-brand-500">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-300" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 rounded-xl border border-brand-200 focus:outline-none focus:ring-2 focus:ring-brand-650 focus:border-transparent transition-all bg-brand-50/20 text-sm font-medium"
                      placeholder="name@company.com"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-brand-900 hover:bg-accent-600 text-white py-4 rounded-xl font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-70 flex items-center justify-center space-x-2 cursor-pointer"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <span>Send Reset Code</span>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* STEP 2: ENTER CODE & RESET PASSWORD */}
          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-3xl font-bold font-serif text-brand-900">Enter Code</h2>
                <p className="text-brand-400 mt-2 text-sm leading-relaxed">
                  A verification code has been dispatched. Please enter the 6-digit code sent to <strong className="text-brand-850 font-bold">{email}</strong>.
                </p>
              </div>

              {successMsg && (
                <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl text-xs font-semibold leading-relaxed">
                  {successMsg}
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-50 border border-red-150 text-red-600 rounded-xl text-xs font-semibold">
                  {error}
                </div>
              )}

              <form onSubmit={handleResetPassword} className="space-y-5">
                
                {/* 6 digit code */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-brand-500">6-Digit Verification Code</label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-300" />
                    <input
                      type="text"
                      maxLength={6}
                      required
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} // Numbers only
                      className="w-full pl-12 pr-4 py-4 rounded-xl border border-brand-200 focus:outline-none focus:ring-2 focus:ring-brand-650 focus:border-transparent transition-all bg-brand-50/20 text-sm font-semibold tracking-[0.3em] placeholder:tracking-normal"
                      placeholder="000000"
                    />
                  </div>
                </div>

                {/* New Password */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-brand-500">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-300" />
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 rounded-xl border border-brand-200 focus:outline-none focus:ring-2 focus:ring-brand-650 focus:border-transparent transition-all bg-brand-50/20 text-sm font-medium"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-brand-500">Confirm New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-300" />
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 rounded-xl border border-brand-200 focus:outline-none focus:ring-2 focus:ring-brand-650 focus:border-transparent transition-all bg-brand-50/20 text-sm font-medium"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-brand-900 hover:bg-accent-600 text-white py-4 rounded-xl font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-70 flex items-center justify-center space-x-2 cursor-pointer"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <span>Update Password</span>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* STEP 3: SUCCESS ACTION */}
          {step === 3 && (
            <div className="text-center space-y-6 animate-fade-in py-6">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-inner">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
              </div>
              
              <div className="space-y-2">
                <h2 className="text-3xl font-bold font-serif text-brand-900">Success!</h2>
                <p className="text-brand-450 text-sm max-w-sm mx-auto leading-relaxed">
                  Your password has been successfully reset. You can now use your brand new credentials to sign in securely.
                </p>
              </div>

              <button
                onClick={() => router.push("/auth/signin")}
                className="w-full bg-brand-900 hover:bg-accent-600 text-white py-4 rounded-xl font-bold transition-all shadow-md hover:shadow-lg flex items-center justify-center cursor-pointer"
              >
                Go to Sign In
              </button>
            </div>
          )}

          {/* Prompt/Helper Footer */}
          {step !== 3 && (
            <p className="text-center text-sm text-brand-400">
              Remembered your credentials?{" "}
              <Link href="/auth/signin" className="font-bold text-brand-900 hover:underline">
                Sign In
              </Link>
            </p>
          )}

        </div>
      </div>
    </div>
  );
}
