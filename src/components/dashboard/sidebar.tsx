"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  User,
  LogOut,
  X,
  MessageSquare,
  Settings,
  Building2,
  CheckCircle2,
  Plus,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthContext } from "@/lib/hooks/auth/AuthContext";
import { useWorkspaceContext } from "@/lib/hooks/workspace/WorkspaceContext";

const menuItems = [
  {
    title: "My Profile",
    icon: User,
    href: "/profile",
  },
  {
    title: "Create Post",
    icon: Plus,
    href: "/create",
  },
  {
    title: "Posts",
    icon: CheckCircle2,
    href: "/posts/published",
  },
  {
    title: "AI Watcher",
    icon: Eye,
    href: "/ai-watcher",
  },
  {
    title: "Inbox",
    icon: MessageSquare,
    href: "/inbox",
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
  const router = useRouter();
  const { logout } = useAuthContext();
  const { currentWorkspace, setCurrentWorkspace } = useWorkspaceContext();

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
  };

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

        <button
          type="button"
          onClick={() => {
            setCurrentWorkspace(null);
            setIsOpen(false);
            router.push("/select-workspace");
          }}
          className="mb-6 flex w-full items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5 text-left transition-colors hover:bg-slate-100"
        >
          <Building2 className="h-5 w-5 shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold uppercase tracking-wide text-slate-400">
              Workspace
            </p>
            <p className="truncate text-sm font-semibold text-slate-900">
              {currentWorkspace?.name ?? "Switch workspace"}
            </p>
          </div>
        </button>

        <nav className="flex-1 space-y-1">
          {menuItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href === "/posts/published" &&
                (pathname.startsWith("/posts/published") ||
                  pathname.startsWith("/posts/scheduled") ||
                  pathname.startsWith("/posts/drafts"))) ||
              (item.href === "/create" && pathname.startsWith("/create")) ||
              (item.href === "/ai-watcher" && pathname.startsWith("/ai-watcher")) ||
              (item.href === "/settings" && pathname.startsWith("/settings")) ||
              (item.href === "/inbox" && (pathname === "/inbox" || pathname.startsWith("/comments")));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className="block relative"
              >
                <div
                  className={cn(
                    "flex items-center gap-3.5 px-4 py-3.5 rounded-xl transition-all duration-200 group relative",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900",
                  )}
                >
                  <item.icon
                    className={cn(
                      "w-5 h-5 transition-transform duration-200",
                      isActive ? "scale-110" : "group-hover:scale-110",
                    )}
                  />
                  <span className="font-bold text-sm flex-1">{item.title}</span>
                  {isActive ? (
                    <motion.div
                      layoutId="active-pill"
                      className="absolute left-0 w-1 h-6 bg-primary rounded-r-full"
                    />
                  ) : null}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="pt-5 border-t border-slate-100 space-y-2">
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
