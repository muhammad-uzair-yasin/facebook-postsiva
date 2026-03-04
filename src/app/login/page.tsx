"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Facebook, Mail, ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/sections/navbar";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuthContext } from "@/lib/hooks/auth/AuthContext";
import { buildGoogleOAuthLoginUrl, getFrontendCallbackUrl } from "@/lib/config";

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, error: authError, user, isHydrated } = useAuthContext();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState("");
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // If already logged in, redirect to select-workspace
  useEffect(() => {
    if (!isHydrated) {
      setIsCheckingAuth(true);
      return;
    }
    if (user) {
      router.replace("/select-workspace");
      return;
    }
    setIsCheckingAuth(false);
  }, [isHydrated, user, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");

    try {
      await login({ email, password });
    } catch (err) {
      setLocalError(authError || "Invalid email or password. Please try again.");
    }
  };

  const handleGoogleLogin = () => {
    // Redirect to Google OAuth endpoint
    const redirectUri = getFrontendCallbackUrl();
    window.location.href = buildGoogleOAuthLoginUrl(redirectUri);
  };

  // Show loading state while checking authentication or hydrating
  if (!isHydrated || isCheckingAuth) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-primary rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-500 font-medium">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-white flex items-center justify-center relative overflow-hidden pt-20">
      {/* Background Grid & Glow */}
      <div className="absolute inset-0 grid-bg opacity-40 -z-10" />
      <div className="glow-effect top-1/4 -left-20 w-[500px] h-[500px] -z-10" />
      <div className="glow-effect bottom-1/4 -right-20 w-[500px] h-[500px] -z-10" />

      <div className="container max-w-6xl mx-auto px-6 flex flex-col lg:flex-row items-center gap-16 relative z-10 py-12">
        {/* Left Side: Brand Info */}
        <div className="flex-1 text-center lg:text-left">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Link href="/" className="inline-flex items-center gap-2 mb-8 group">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                <Facebook className="w-6 h-6 fill-current" />
              </div>
              <span className="text-2xl font-black text-slate-900 tracking-tight">Postsiva</span>
            </Link>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 leading-tight">
              Scale your reach <br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-[#82C3FF]">faster than ever</span>
            </h1>
            <p className="text-lg text-slate-600 mb-8 max-w-md mx-auto lg:mx-0">
              Join thousands of founders and marketing teams using Postsiva to automate their growth on Facebook.
            </p>
            
            <div className="space-y-4">
               {[
                 "Automated post scheduling",
                 "AI-powered audience targeting",
                 "Deep-dive growth analytics"
               ].map((text, i) => (
                 <div key={i} className="flex items-center gap-3 text-slate-700 font-medium justify-center lg:justify-start">
                   <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                     <ArrowRight className="w-3 h-3" />
                   </div>
                   {text}
                 </div>
               ))}
            </div>
          </motion.div>
        </div>

        {/* Right Side: Login Form */}
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50"
          >
            <div className="mb-8">
              <h2 className="text-2xl font-black text-slate-900 mb-2">Welcome Back</h2>
              <p className="text-slate-500">Log in to your account to continue</p>
            </div>

            <div className="space-y-4 mb-8">
              <Button 
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                variant="outline" 
                className="w-full h-12 rounded-xl border-slate-200 hover:bg-slate-50 gap-3 font-bold text-slate-700 hover:text-black disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Image src="https://www.google.com/favicon.ico" alt="Google" width={20} height={20} className="w-5 h-5" />
                Continue with Google
              </Button>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-100"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-4 text-slate-400 font-medium tracking-widest">Or with email</span>
                </div>
              </div>
            </div>

            <form className="space-y-5" onSubmit={handleLogin}>
              {(localError || authError) && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-bold text-center"
                >
                  {localError || authError}
                </motion.div>
              )}
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input 
                    type="email" 
                    placeholder="name@company.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className="h-12 pl-12 rounded-xl border-slate-200 focus:ring-primary/20 focus:border-primary disabled:bg-slate-50 disabled:cursor-not-allowed"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-sm font-bold text-slate-700">Password</label>
                  <Link href="/forgot-password" className="text-xs font-bold text-primary hover:underline">Forgot password?</Link>
                </div>
                <Input 
                  type="password" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="h-12 px-4 rounded-xl border-slate-200 focus:ring-primary/20 focus:border-primary disabled:bg-slate-50 disabled:cursor-not-allowed"
                  required
                />
              </div>
              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 font-bold text-base shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Signing In..." : "Sign In"}
              </Button>
            </form>

            <div className="mt-8 text-center space-y-4">
              <p className="text-slate-500 font-medium">
                Don&apos;t have an account?{" "}
                <Link href="/signup" className="text-primary font-bold hover:underline">Create account</Link>
              </p>
              <div className="pt-4">
                <Link href="/">
                  <Button variant="ghost" className="text-slate-400 hover:text-primary gap-2 font-bold text-sm transition-all duration-300">
                    <ArrowRight className="w-4 h-4 rotate-180" />
                    Back to Home
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
    </>
  );
}

