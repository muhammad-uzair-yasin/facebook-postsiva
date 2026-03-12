"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { 
  User, 
  Database, 
  Clock, 
  LogOut,
  Home,
  CheckCircle2,
  Plus,
  Sparkles,
  Crown,
  ArrowUp,
  X,
  Brain,
  MessageSquare,
  Settings
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthContext } from "@/lib/hooks/auth/AuthContext";
import { useSubscription, getStoredSubscription } from "@/lib/hooks/tier/useSubscription";

const menuItems = [
  {
    title: "My Profile",
    icon: User,
    href: "/profile",
  },
  {
    title: "Published Posts",
    icon: CheckCircle2,
    href: "/published",
  },
  {
    title: "Create Post",
    icon: Plus,
    href: "/post",
  },
  {
    title: "Post Storage",
    icon: Database,
    href: "/storage",
  },
  {
    title: "Persona Management",
    icon: Sparkles,
    href: "/persona",
  },
  {
    title: "Scheduled Posts",
    icon: Clock,
    href: "/scheduled",
  },
  {
    title: "AI Commenting",
    icon: MessageSquare,
    href: "#",
    comingSoon: true,
  },
  {
    title: "Comments",
    icon: MessageSquare,
    href: "/comments",
  },
  {
    title: "AI Usage",
    icon: Brain,
    href: "/ai-usage",
  },
  {
    title: "Settings",
    icon: Settings,
    href: "/settings",
  },
];

interface DashboardSidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export const DashboardSidebar = ({ isOpen, setIsOpen }: DashboardSidebarProps) => {
  const pathname = usePathname();
  const { logout } = useAuthContext();
  const { subscription } = useSubscription('facebook');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
  };

  // Get subscription info (from hook or localStorage)
  const subscriptionInfo = subscription || (mounted ? getStoredSubscription() : null);
  const isPaid = subscriptionInfo?.is_paid || false;
  const tierName = subscriptionInfo?.tier_name || 'free';

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[100] md:hidden"
        />
      )}

      <div className={cn(
        "fixed inset-y-0 left-0 z-[110] w-64 bg-white border-r border-slate-100 flex flex-col p-5 transition-transform duration-300 md:translate-x-0 md:static md:h-screen",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between mb-10 ml-1">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary/30">
              P
            </div>
            <span className="text-xl font-black text-slate-900 tracking-tight">
              Post<span className="text-primary">siva</span>
            </span>
          </Link>
          <button 
            onClick={() => setIsOpen(false)}
            className="md:hidden w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-500 hover:text-primary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            const isComingSoon = (item as any).comingSoon;
            
            const content = (
              <div className={cn(
                "flex items-center gap-3.5 px-4 py-3.5 rounded-xl transition-all duration-200 group relative",
                isComingSoon 
                  ? "text-slate-400 cursor-not-allowed opacity-75" 
                  : isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              )}>
                <item.icon className={cn(
                  "w-5 h-5 transition-transform duration-200",
                  isActive && !isComingSoon ? "scale-110" : "group-hover:scale-110"
                )} />
                <span className="font-bold text-sm flex-1">{item.title}</span>
                {isComingSoon && (
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Soon
                  </span>
                )}
                
                {isActive && !isComingSoon && (
                  <motion.div 
                    layoutId="active-pill"
                    className="absolute left-0 w-1 h-6 bg-primary rounded-r-full"
                  />
                )}
              </div>
            );
            
            if (isComingSoon) {
              return (
                <div key={item.href} className="block relative">
                  {content}
                </div>
              );
            }
            
            return (
              <Link 
                key={item.href} 
                href={item.href}
                onClick={() => setIsOpen(false)}
                className="block relative"
              >
                {content}
              </Link>
            );
          })}
        </nav>

        <div className="pt-5 border-t border-slate-100 space-y-2">
          {/* Subscription Info or Upgrade Button */}
          {isPaid ? (
            <Link
              href="/subscription"
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors group"
            >
              <Crown className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <div className="flex-1 text-left">
                <span className="font-bold text-sm block capitalize">{tierName} Plan</span>
                <span className="text-xs font-medium text-primary/70">Active Subscription</span>
              </div>
            </Link>
          ) : (
            <Link
              href="/pricing"
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-white hover:from-primary/90 hover:to-primary/70 transition-all group shadow-lg shadow-primary/20"
            >
              <ArrowUp className="w-5 h-5 group-hover:translate-y-[-2px] transition-transform" />
              <span className="font-bold text-sm">Upgrade</span>
            </Link>
          )}
          
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-red-500 hover:bg-red-50 transition-colors group"
          >
            <LogOut className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            <span className="font-bold text-sm">Logout</span>
          </button>
        </div>
      </div>
    </>
  );
};
