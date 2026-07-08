"use client";

import { useState } from "react";
import { useAuthContext } from "@/lib/hooks/auth/AuthContext";
import { resendVerificationEmailRequest, changePasswordRequest, fetchCurrentUser } from "@/lib/hooks/auth/api";
import Link from "next/link";
import {
  Mail,
  ShieldCheck,
  ShieldAlert,
  Lock,
  KeyRound,
  RefreshCw,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function formatMemberSince(createdAt: string | undefined): string {
  if (!createdAt) return "—";
  try {
    const d = new Date(createdAt);
    return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  } catch {
    return "—";
  }
}

export default function ProfileSettingsClient() {
  const { user } = useAuthContext();
  const [accountError, setAccountError] = useState<string | null>(null);
  const [accountSuccess, setAccountSuccess] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [changePwLoading, setChangePwLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [refreshingUser, setRefreshingUser] = useState(false);

  const handleResendVerification = async () => {
    setAccountError(null);
    setAccountSuccess(null);
    setResendLoading(true);
    try {
      await resendVerificationEmailRequest();
      setAccountSuccess("Verification email sent. Check your inbox.");
    } catch (e) {
      setAccountError(e instanceof Error ? e.message : "Failed to send");
    } finally {
      setResendLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setAccountError(null);
    setAccountSuccess(null);
    if (newPassword !== confirmPassword) {
      setAccountError("New passwords do not match");
      return;
    }
    setChangePwLoading(true);
    try {
      await changePasswordRequest(currentPassword, newPassword);
      setAccountSuccess("Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e) {
      setAccountError(e instanceof Error ? e.message : "Failed to update password");
    } finally {
      setChangePwLoading(false);
    }
  };

  const handleRefreshProfile = async () => {
    setRefreshingUser(true);
    try {
      await fetchCurrentUser({ forceRefresh: true });
      setAccountSuccess("Profile refreshed.");
      setTimeout(() => setAccountSuccess(null), 3000);
    } catch {
      setAccountError("Failed to refresh profile");
    } finally {
      setRefreshingUser(false);
    }
  };

  if (!user) {
    return (
      <div className="p-6 md:p-10 xl:p-12 2xl:p-16 min-h-full flex items-center justify-center">
        <p className="text-slate-500">Loading your account…</p>
      </div>
    );
  }

  const displayName = user.full_name || user.username || user.email?.split("@")[0] || "User";
  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="max-w-3xl space-y-6">
        <h2 className="text-2xl font-black text-slate-900">Profile</h2>

        {accountError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800 text-sm">
            {accountError}
          </div>
        )}
        {accountSuccess && (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-green-800 text-sm">
            {accountSuccess}
          </div>
        )}

        {/* Profile summary card */}
        <div className="bg-primary/10 rounded-2xl border border-primary/20 p-6 md:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-white text-2xl font-black shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-slate-900">{displayName}</h2>
              <p className="text-slate-600 flex items-center gap-2 mt-1">
                <Mail className="w-4 h-4 text-slate-500 shrink-0" />
                {user.email}
              </p>
              {user.created_at && (
                <p className="text-slate-500 text-sm mt-2">
                  Member since {formatMemberSince(user.created_at)}
                </p>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 gap-2 border-slate-200"
              onClick={handleRefreshProfile}
              disabled={refreshingUser}
            >
              <RefreshCw className={`w-4 h-4 ${refreshingUser ? "animate-spin" : ""}`} />
              Refresh data
            </Button>
          </div>
        </div>

        {/* Email verification */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            Email verification
          </h3>
          <div className="flex flex-wrap items-center gap-3">
            {user.email_verified ? (
              <span className="inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1.5 text-sm font-medium text-green-800">
                <ShieldCheck className="w-4 h-4" />
                Verified
              </span>
            ) : (
              <>
                <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1.5 text-sm font-medium text-amber-800">
                  <ShieldAlert className="w-4 h-4" />
                  Not verified
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={resendLoading}
                  onClick={handleResendVerification}
                >
                  {resendLoading ? "Sending…" : "Resend verification email"}
                </Button>
              </>
            )}
          </div>
          <p className="text-slate-500 text-sm mt-2">
            {user.email_verified
              ? "Your email is verified. You can use all account features."
              : "Check your inbox for the verification link or resend it above."}
          </p>
        </div>

        {/* Password */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary" />
            Password
          </h3>
          <form className="space-y-4" onSubmit={handleChangePassword}>
            <div>
              <label className="text-sm font-bold text-slate-700 block mb-1.5">Current password</label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={changePwLoading}
                  className="pl-10 rounded-xl border-slate-200"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-bold text-slate-700 block mb-1.5">New password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={changePwLoading}
                  className="pl-10 rounded-xl border-slate-200"
                  minLength={6}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-bold text-slate-700 block mb-1.5">Confirm new password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={changePwLoading}
                  className="pl-10 rounded-xl border-slate-200"
                  minLength={6}
                />
              </div>
            </div>
            <Button type="submit" disabled={changePwLoading} className="rounded-xl gap-2">
              {changePwLoading ? "Updating…" : "Save changes"}
            </Button>
          </form>
          <p className="text-slate-500 text-sm mt-4">
            Forgot your password?{" "}
            <Link href="/forgot-password" className="text-primary font-medium hover:underline inline-flex items-center gap-1">
              Reset it here
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </p>
        </div>
    </div>
  );
}
