"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/sections/navbar";
import Footer from "@/components/sections/footer";
import { Home, ArrowLeft, Search, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white relative flex flex-col">
      {/* Background Grid & Glow */}
      <div className="absolute inset-0 grid-bg opacity-40 -z-10" />
      <div className="glow-effect top-0 -left-20 w-[600px] h-[600px] -z-10" />
      <div className="glow-effect top-0 -right-20 w-[600px] h-[600px] -z-10" />
      
      <Navbar />
      
      <main className="flex-1 flex items-center justify-center relative z-10 py-24 px-6">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center space-y-8"
          >
            {/* 404 Badge */}
            <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-black mb-6 tracking-widest uppercase">
              <AlertCircle className="w-4 h-4" />
              <span>PAGE NOT FOUND</span>
            </div>

            {/* Large 404 Number */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <h1 className="text-9xl md:text-[12rem] font-black text-transparent bg-clip-text bg-gradient-to-r from-primary via-[#82C3FF] to-primary leading-none">
                404
              </h1>
              <div className="absolute inset-0 text-9xl md:text-[12rem] font-black text-slate-100 -z-10 blur-2xl">
                404
              </div>
            </motion.div>

            {/* Error Message */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="space-y-4"
            >
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 uppercase tracking-tight">
                Oops! Page Not Found
              </h2>
              <p className="text-lg md:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto">
                The page you&apos;re looking for doesn&apos;t exist or has been moved. 
                Let&apos;s get you back on track.
              </p>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center pt-6"
            >
              <Link href="/">
                <Button 
                  size="lg" 
                  className="group h-14 px-10 rounded-2xl text-base bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 font-bold transition-all duration-300"
                >
                  <Home className="mr-2 h-5 w-5 transition-transform group-hover:scale-110" />
                  Go to Homepage
                </Button>
              </Link>
              <Button
                variant="outline"
                size="lg"
                onClick={() => window.history.back()}
                className="h-14 px-10 rounded-2xl text-base bg-white/50 backdrop-blur-sm border-primary text-primary hover:bg-primary hover:text-white transition-all duration-300 font-bold"
              >
                <ArrowLeft className="mr-2 h-5 w-5" />
                Go Back
              </Button>
            </motion.div>

            {/* Helpful Links */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="pt-12 border-t border-slate-200"
            >
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">
                Popular Pages
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                {[
                  { label: "Features", href: "/features" },
                  { label: "About Us", href: "/about" },
                  { label: "Login", href: "/login" },
                  { label: "Sign Up", href: "/signup" },
                ].map((link, index) => (
                  <Link
                    key={index}
                    href={link.href}
                    className="px-4 py-2 rounded-xl bg-slate-50 hover:bg-primary/10 text-slate-600 hover:text-primary font-bold text-sm transition-all duration-300 border border-slate-200 hover:border-primary/30"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </motion.div>

            {/* Search Suggestion */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="pt-8"
            >
              <div className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-50 border border-slate-200">
                <Search className="w-5 h-5 text-slate-400" />
                <p className="text-sm text-slate-600 font-medium">
                  Try using the navigation menu or search for what you need
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
