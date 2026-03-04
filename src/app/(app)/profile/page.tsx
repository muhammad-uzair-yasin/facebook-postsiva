"use client";

import { motion } from "framer-motion";
import { RefreshCw, Mail, CheckCircle2, Clock, Calendar, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useFacebookUserProfile } from "@/lib/hooks/facebook/userProfile/useFacebookUserProfile";
import { useAuthContext } from "@/lib/hooks/auth/AuthContext";
import { useWorkspaceContext } from "@/lib/hooks/workspace/WorkspaceContext";

export default function ProfilePage() {
  const { user } = useAuthContext();
  const { currentWorkspace } = useWorkspaceContext();
  const workspaceProfile = currentWorkspace?.facebook_profile;
  const { profile, loading, error, loadProfile } = useFacebookUserProfile({
    autoLoad: !workspaceProfile,
    initialProfile: workspaceProfile ?? undefined,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Local state for form fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [timezone, setTimezone] = useState("");

  // Update form fields when profile data is loaded
  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || "");
      setLastName(profile.last_name || "");
      setEmail(profile.email || user?.email || "");
      if (profile.timezone) {
        const tz = typeof profile.timezone === 'number' 
          ? `GMT${profile.timezone >= 0 ? '+' : ''}${profile.timezone}:00`
          : String(profile.timezone);
        setTimezone(tz);
      } else {
        setTimezone("GMT+5:00 Pakistan Standard Time");
      }
    } else if (user) {
      // Fallback to user data if profile is not available
      setEmail(user.email || "");
    }
  }, [profile, user]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadProfile({ refresh: true });
    } catch (err) {
      console.error("Failed to refresh profile:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Get initials for avatar
  const getInitials = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();
    }
    if (profile?.name) {
      const names = profile.name.split(" ");
      if (names.length >= 2) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
      }
      return profile.name.substring(0, 2).toUpperCase();
    }
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return "MU";
  };

  // Get display name
  const getDisplayName = () => {
    if (profile?.name) return profile.name;
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    if (user?.full_name) return user.full_name;
    if (user?.email) return user.email.split("@")[0];
    return "User";
  };

  return (
    <div className="p-4 md:p-10 min-h-screen space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-10 items-start">
        {/* Left Column: Profile Summary */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:sticky lg:top-10 space-y-8"
        >
          <div className="bg-primary rounded-3xl md:rounded-[2.5rem] p-6 md:p-8 text-white relative overflow-hidden shadow-2xl shadow-primary/20">
            <div className="relative z-10 flex flex-col items-center text-center gap-4">
              {loading && !profile ? (
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center relative border-4 border-white/30 shrink-0">
                  <Loader2 className="w-8 h-8 animate-spin text-white" />
                </div>
              ) : (
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center relative border-4 border-white/30 shrink-0 overflow-hidden">
                  {profile?.profile_picture_url ? (
                    <img 
                      src={profile.profile_picture_url} 
                      alt={getDisplayName()}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-primary text-3xl font-bold">
                      {getInitials()}
                    </div>
                  )}
                  {profile?.verified && (
                    <div className="absolute -top-1 -left-1 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                      <div className="w-2.5 h-2.5 bg-primary rounded-full animate-pulse" />
                    </div>
                  )}
                </div>
              )}
              <div className="min-w-0">
                <h1 className="text-2xl md:text-3xl font-black mb-1 tracking-tight truncate">
                  {loading && !profile ? "Loading..." : getDisplayName()}
                </h1>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  {(email || profile?.email) && (
                    <div className="flex items-center gap-1.5 text-white/80 font-bold text-sm truncate">
                      <Mail className="w-4 h-4 shrink-0" />
                      {profile?.email || email}
                    </div>
                  )}
                  {profile?.verified && (
                    <div className="px-3 py-1 bg-white/10 rounded-full border border-white/20 text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Verified
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Account Status */}
            <div className="mt-8 pt-6 border-t border-white/20 relative z-10 space-y-3">
              <div className="flex items-center justify-between text-white/80 text-sm font-medium">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>Member Since</span>
                </div>
                <span>Jan 2024</span>
              </div>
              <div className="flex items-center justify-between text-white/80 text-sm font-medium">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Posts This Month</span>
                </div>
                <span>12 / 50</span>
              </div>
            </div>

            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-48 h-48 md:w-64 md:h-64 bg-white/5 blur-[60px] md:blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2" />
          </div>

          <Button 
            variant="outline" 
            className="w-full bg-white border-slate-200 text-slate-900 hover:bg-primary hover:text-white gap-2 h-12 px-6 rounded-2xl font-bold text-sm disabled:opacity-50"
            onClick={handleRefresh}
            disabled={isRefreshing || loading}
          >
            {isRefreshing || loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            {isRefreshing ? "Refreshing..." : "Refresh Data"}
          </Button>
          {error && (
            <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-200 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </motion.div>

        {/* Right Column: Profile Information */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl md:rounded-[2.5rem] p-6 md:p-10 shadow-2xl shadow-primary/5 border border-slate-100"
        >
          <h2 className="text-xl md:text-2xl font-black text-slate-900 mb-6 md:mb-10 pb-4 border-b border-slate-100">
            Profile Information
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-10 mb-10">
            <div className="space-y-2 md:space-y-4">
              <label className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest ml-1">First Name</label>
              <Input 
                type="text" 
                value={firstName} 
                onChange={(e) => setFirstName(e.target.value)}
                className="h-12 md:h-14 px-4 md:px-6 rounded-xl md:rounded-2xl border-slate-200 focus:ring-primary/20 focus:border-primary text-base md:text-lg font-bold text-slate-900"
              />
            </div>
            <div className="space-y-2 md:space-y-4">
              <label className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Last Name</label>
              <Input 
                type="text" 
                value={lastName} 
                onChange={(e) => setLastName(e.target.value)}
                className="h-12 md:h-14 px-4 md:px-6 rounded-xl md:rounded-2xl border-slate-200 focus:ring-primary/20 focus:border-primary text-base md:text-lg font-bold text-slate-900"
              />
            </div>
            <div className="space-y-2 md:space-y-4 sm:col-span-2">
              <label className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
              <Input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 md:h-14 px-4 md:px-6 rounded-xl md:rounded-2xl border-slate-200 focus:ring-primary/20 focus:border-primary text-base md:text-lg font-bold text-slate-900"
              />
            </div>
            <div className="space-y-2 md:space-y-4 sm:col-span-2">
              <label className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Timezone</label>
              <Input 
                type="text" 
                value={timezone} 
                onChange={(e) => setTimezone(e.target.value)}
                className="h-12 md:h-14 px-4 md:px-6 rounded-xl md:rounded-2xl border-slate-200 focus:ring-primary/20 focus:border-primary text-base md:text-lg font-bold text-slate-900"
              />
            </div>
          </div>

          <Button className="w-full h-14 rounded-2xl text-base font-black gap-3 shadow-xl shadow-primary/20 px-10 bg-primary hover:bg-primary/90 transition-all active:scale-95">
            Save Changes
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
