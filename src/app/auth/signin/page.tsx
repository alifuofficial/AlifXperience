"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shield, Mail, Lock, ArrowLeft } from "lucide-react";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    if (result?.error) {
      setError("Invalid email or password");
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left Side - Visual */}
      <div className="hidden md:flex md:w-1/2 bg-brand-900 relative items-center justify-center p-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-600 via-brand-800 to-indigo-950 opacity-80" />
        <div className="relative z-10 text-white max-w-md space-y-6">
          <Link href="/" className="inline-flex items-center space-x-2 text-brand-200 hover:text-white transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Home</span>
          </Link>
          <h1 className="text-5xl font-bold font-serif leading-tight">Join the Tech Revolution.</h1>
          <p className="text-brand-100/70 text-lg">Access exclusive insights, personalized feeds, and a community of tech visionaries.</p>
          <div className="pt-8 flex items-center space-x-4">
             <div className="flex -space-x-2">
                {[1,2,3,4].map(i => <div key={i} className="w-10 h-10 rounded-full border-2 border-brand-800 bg-slate-300" />)}
             </div>
             <p className="text-sm text-brand-200">Joined by 10k+ readers</p>
          </div>
        </div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl" />
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-surface">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center md:text-left">
            <h2 className="text-3xl font-bold font-serif">Welcome Back</h2>
            <p className="text-muted mt-2">Sign in to your AlifXperience account</p>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent transition-all bg-slate-50/50"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent transition-all bg-slate-50/50"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded text-brand-600 focus:ring-brand-600" />
                <span className="text-muted">Remember me</span>
              </label>
              <Link href="/auth/forgot-password" className="font-semibold text-brand-600 hover:underline">Forgot Password?</Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-600 text-white py-4 rounded-xl font-bold hover:bg-brand-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-70 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Shield className="w-5 h-5" />
                  <span>Sign In Securely</span>
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-muted">
            Don't have an account?{" "}
            <Link href="/auth/signup" className="font-bold text-brand-600 hover:underline">
              Start your journey
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
