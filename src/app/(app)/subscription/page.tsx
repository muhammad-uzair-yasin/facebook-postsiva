"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Crown, 
  CheckCircle2, 
  XCircle, 
  Calendar,
  Loader2,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useSubscription } from "@/lib/hooks/tier/useSubscription";
import { getUserUsage, type UsageResponse } from "@/lib/hooks/tier/api";

export default function SubscriptionPage() {
  const { subscription, loading, refreshSubscription } = useSubscription('facebook', { skipFetchOnMount: false });
  const [usage, setUsage] = useState<UsageResponse | null>(null);
  const [loadingUsage, setLoadingUsage] = useState(true);

  useEffect(() => {
    const loadUsage = async () => {
      try {
        setLoadingUsage(true);
        const response = await getUserUsage('facebook');
        if (response.success && response.usage) {
          setUsage(response.usage);
        }
      } catch (err) {
        console.error('Failed to load usage:', err);
      } finally {
        setLoadingUsage(false);
      }
    };

    loadUsage();
  }, []);

  if (loading || loadingUsage) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="text-slate-500 font-medium">Loading subscription details...</p>
        </div>
      </div>
    );
  }

  const isPaid = subscription?.is_paid || false;
  const tierName = subscription?.tier_name || 'free';
  const isExpired = subscription?.is_expired || false;
  const creditsExpireAt = subscription?.credits_expire_at;

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 grid-bg opacity-40 -z-10" />
      <div className="glow-effect top-1/4 -left-20 w-[500px] h-[500px] -z-10" />
      <div className="glow-effect bottom-1/4 -right-20 w-[500px] h-[500px] -z-10" />

      <div className="container mx-auto px-6 relative z-10 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-slate-100"
        >
          {/* Header */}
          <div className="p-8 md:p-10 text-center border-b border-slate-100 bg-gradient-to-r from-primary to-primary/80 text-white">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-md">
              <Crown className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-black mb-2 uppercase tracking-tight">Your Subscription</h1>
            <p className="text-white/80 font-medium">Current plan and usage details</p>
          </div>

          <div className="p-8 md:p-10 space-y-8">
            {/* Current Plan Card */}
            <div className={`rounded-3xl p-6 md:p-8 relative overflow-hidden ${
              isPaid 
                ? "bg-gradient-to-r from-primary to-primary/80 text-white" 
                : "bg-slate-100 text-slate-900"
            }`}>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${
                      isPaid ? "text-white/70" : "text-slate-500"
                    }`}>
                      Current Plan
                    </p>
                    <h2 className="text-3xl font-black capitalize">{tierName} Plan</h2>
                  </div>
                  {isPaid ? (
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                      <Crown className="w-8 h-8 text-white" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 bg-slate-200 rounded-2xl flex items-center justify-center">
                      <Sparkles className="w-8 h-8 text-slate-400" />
                    </div>
                  )}
                </div>
                
                {isPaid && (
                  <div className="mt-6 pt-6 border-t border-white/20">
                    {isExpired ? (
                      <div className="flex items-center gap-3 text-red-200">
                        <XCircle className="w-5 h-5" />
                        <span className="font-bold">Subscription Expired</span>
                      </div>
                    ) : creditsExpireAt ? (
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-white/70" />
                        <div>
                          <p className="text-xs font-bold text-white/70 uppercase tracking-widest">Expires On</p>
                          <p className="text-lg font-black">
                            {new Date(creditsExpireAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 text-green-200">
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="font-bold">Active Subscription</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 blur-[60px] rounded-full" />
            </div>

            {/* Usage Stats */}
            {usage && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Posts</p>
                      <p className="text-2xl font-black text-slate-900">
                        {usage.is_unlimited ? '∞' : usage.posts_remaining}
                        <span className="text-sm font-bold text-slate-500 ml-2">
                          / {usage.total_posts_used} used
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Scheduled Posts</p>
                      <p className="text-2xl font-black text-slate-900">
                        {usage.is_unlimited ? '∞' : usage.post_scheduling_remaining}
                        <span className="text-sm font-bold text-slate-500 ml-2">
                          / {usage.total_post_scheduling_used} used
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">AI Generation</p>
                      <p className="text-2xl font-black text-slate-900">
                        {usage.is_unlimited ? '∞' : usage.ai_generation_remaining}
                        <span className="text-sm font-bold text-slate-500 ml-2">
                          / {usage.total_ai_generation_used} used
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Image Generation</p>
                      <p className="text-2xl font-black text-slate-900">
                        {usage.is_unlimited ? '∞' : usage.image_generation_remaining}
                        <span className="text-sm font-bold text-slate-500 ml-2">
                          / {usage.total_image_generation_used} used
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              {!isPaid || isExpired ? (
                <Link href="/pricing" className="flex-1">
                  <Button className="w-full h-14 bg-primary hover:bg-primary/90 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-primary/20 transition-all active:scale-[0.98] gap-3">
                    {isExpired ? 'Renew Subscription' : 'Upgrade Plan'}
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
              ) : (
                <Link href="/pricing" className="flex-1">
                  <Button variant="outline" className="w-full h-14 rounded-2xl font-black text-sm uppercase tracking-widest">
                    Change Plan
                  </Button>
                </Link>
              )}
              <Button
                variant="outline"
                onClick={() => refreshSubscription()}
                className="flex-1 h-14 rounded-2xl font-black text-sm uppercase tracking-widest"
              >
                Refresh Status
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
