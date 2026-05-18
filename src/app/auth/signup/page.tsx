"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shield, Mail, Lock, User, ArrowLeft, Loader2, CheckCircle, AlertTriangle } from "lucide-react";

export default function SignUp() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  
  const [regAllowed, setRegAllowed] = useState<boolean | null>(null);
  const [siteName, setSiteName] = useState("NEXUS");

  const router = useRouter();

  useEffect(() => {
    // Check if public registration is enabled in global settings
    fetch("/api/settings/public")
      .then((res) => res.json())
      .then((data) => {
        setRegAllowed(data.allowRegistration !== "false");
        if (data.siteName) setSiteName(data.siteName);
      })
      .catch(() => {
        setRegAllowed(true); // Fallback to true if API fails
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong. Please try again.");
      }

      setSuccess(true);
      setLoading(false);

      // Redirect to sign in page after 3 seconds
      setTimeout(() => {
        router.push("/auth/signin");
      }, 3000);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (regAllowed === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Verifying security gate...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left Side - Visual Banner */}
      <div className="hidden md:flex md:w-1/2 bg-brand-900 relative items-center justify-center p-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-600 via-brand-800 to-indigo-950 opacity-85" />
        <div className="relative z-10 text-white max-w-md space-y-6">
          <Link href="/" className="inline-flex items-center space-x-2 text-brand-200 hover:text-white transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Home</span>
          </Link>
          <h1 className="text-5xl font-bold font-serif leading-tight">Empowering Tech Writers.</h1>
          <p className="text-brand-100/70 text-lg">Create a free reader account to comment on articles, bookmark your favorite columns, and receive weekly editorial digests.</p>
          <div className="pt-8 flex items-center space-x-4">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-brand-800 bg-slate-400" />
              ))}
            </div>
            <p className="text-sm text-brand-200">Joined by 10k+ readers</p>
          </div>
        </div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl" />
      </div>

      {/* Right Side - Forms & Locking */}
      <div className="flex-1 flex items-center justify-center p-8 bg-surface">
        <div className="max-w-md w-full space-y-8">
          
          {/* If registration is closed in admin settings */}
          {!regAllowed ? (
            <div className="text-center space-y-6 bg-white p-8 rounded-2xl border border-brand-100 shadow-md">
              <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-amber-600">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold font-serif text-brand-900">Registration Closed</h2>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Public user registrations are currently disabled on the <strong>{siteName}</strong> platform. 
                  Please check back later or contact an administrator to request an invitation.
                </p>
              </div>
              <div className="pt-4 flex flex-col gap-2">
                <Link
                  href="/auth/signin"
                  className="w-full bg-brand-900 hover:bg-accent-600 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all text-center"
                >
                  Sign In to Existing Account
                </Link>
                <Link
                  href="/"
                  className="w-full border border-slate-200 text-slate-500 hover:bg-slate-50 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all text-center"
                >
                  Back to Home
                </Link>
              </div>
            </div>
          ) : success ? (
            /* Registration Success Screen */
            <div className="text-center space-y-6 bg-white p-8 rounded-2xl border border-brand-100 shadow-md">
              <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold font-serif text-brand-900">Welcome Aboard!</h2>
                <p className="text-slate-400 text-sm">
                  Your account has been created successfully. We've sent a welcome email to your address if SMTP is live.
                </p>
                <p className="text-brand-600 font-semibold text-xs animate-pulse mt-4">
                  Redirecting to Sign In in a few seconds...
                </p>
              </div>
            </div>
          ) : (
            /* Active Registration Form */
            <div className="space-y-8">
              <div className="text-center md:text-left">
                <h2 className="text-3xl font-bold font-serif text-brand-900">Create Account</h2>
                <p className="text-slate-400 mt-2">Get started with your {siteName} account</p>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Full Name */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold ml-1 text-brand-950">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent transition-all bg-slate-50/50 text-brand-900"
                      placeholder="Sarah Connor"
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold ml-1 text-brand-950">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent transition-all bg-slate-50/50 text-brand-900"
                      placeholder="name@company.com"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold ml-1 text-brand-950">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent transition-all bg-slate-50/50 text-brand-900"
                      placeholder="Minimum 8 characters"
                    />
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold ml-1 text-brand-950">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent transition-all bg-slate-50/50 text-brand-900"
                      placeholder="Repeat your password"
                    />
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-brand-600 text-white py-4 rounded-xl font-bold hover:bg-brand-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-75 flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Shield className="w-5 h-5" />
                      <span>Start Your Journey</span>
                    </>
                  )}
                </button>
              </form>

              <p className="text-center text-sm text-slate-400">
                Already have an account?{" "}
                <Link href="/auth/signin" className="font-bold text-brand-600 hover:underline">
                  Sign In Securely
                </Link>
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
