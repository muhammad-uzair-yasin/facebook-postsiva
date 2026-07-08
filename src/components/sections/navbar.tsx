"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuthContext } from "@/lib/hooks/auth/AuthContext";

export const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const { user, isHydrated, logout } = useAuthContext();
  const isLoggedIn = isHydrated && Boolean(user);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 py-4",
        scrolled ? "bg-white/80 backdrop-blur-md shadow-sm py-2" : "bg-transparent"
      )}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary/30">
            P
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">
            Post<span className="text-primary">siva</span>
          </span>
        </Link>

        {!isLoggedIn && (
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <Link href="/features" className="hover:text-primary transition-colors">Features</Link>
            <Link href="/#how-it-works" className="hover:text-primary transition-colors">How it Works</Link>
            <Link href="/about" className="hover:text-primary transition-colors">About Us</Link>
            <Link href="/#contact" className="hover:text-primary transition-colors">Contact Us</Link>
          </div>
        )}

        <div className="flex items-center gap-3 sm:gap-4">
          {isLoggedIn ? (
            <>
              <span className="hidden max-w-[200px] truncate text-sm font-medium text-slate-600 sm:inline">
                {user?.email}
              </span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-9 rounded-lg px-4 text-xs font-semibold"
                onClick={() => void logout()}
              >
                Log out
              </Button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-semibold text-slate-600 hover:text-primary transition-colors">
                Log in
              </Link>
              <Link href="/signup">
                <Button size="sm" className="h-9 px-4 text-xs rounded-lg bg-primary hover:bg-primary/90 text-white font-bold shadow-lg shadow-primary/20">Get Started</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </motion.nav>
  );
};

