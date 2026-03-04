"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Brain, 
  Sparkles, 
  Image, 
  Edit3,
  FileText,
  Calendar,
  Loader2,
  RefreshCw,
  TrendingUp,
  BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getUserUsage, type UsageResponse } from "@/lib/hooks/tier/api";
import { useSubscription } from "@/lib/hooks/tier/useSubscription";

interface UsageCardProps {
  icon: React.ElementType;
  title: string;
  remaining: number;
  used: number;
  isUnlimited: boolean;
  colorClass?: string;
}

// Professional, neutral color scheme
const colorClasses = {
  primary: {
    bg: "bg-slate-100",
    text: "text-slate-700",
    gradient: "bg-slate-600"
  },
  purple: {
    bg: "bg-slate-100",
    text: "text-slate-700",
    gradient: "bg-slate-600"
  },
  blue: {
    bg: "bg-slate-100",
    text: "text-slate-700",
    gradient: "bg-slate-600"
  },
  green: {
    bg: "bg-slate-100",
    text: "text-slate-700",
    gradient: "bg-slate-600"
  },
  orange: {
    bg: "bg-slate-100",
    text: "text-slate-700",
    gradient: "bg-slate-600"
  },
  indigo: {
    bg: "bg-slate-100",
    text: "text-slate-700",
    gradient: "bg-slate-600"
  }
};

const UsageCard = ({ icon: Icon, title, remaining, used, isUnlimited, colorClass = "primary" }: UsageCardProps) => {
  const total = used + remaining;
  const percentage = isUnlimited ? 100 : total > 0 ? Math.min((used / total) * 100, 100) : 0;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300"
    >
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
          <Icon className="w-6 h-6 text-slate-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{title}</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">
              {isUnlimited ? '∞' : remaining}
            </span>
            <span className="text-sm font-medium text-slate-500">remaining</span>
          </div>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Used</span>
          <span className="text-lg font-bold text-slate-900">{used}</span>
        </div>
        {!isUnlimited && (
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="h-full bg-slate-600 rounded-full"
            />
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default function AIUsagePage() {
  const { subscription } = useSubscription('facebook', { skipFetchOnMount: false });
  const [usage, setUsage] = useState<UsageResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadUsage = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      const response = await getUserUsage('facebook');
      if (response.success && response.usage) {
        setUsage(response.usage);
      } else {
        setError("Failed to load usage data");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load usage data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadUsage();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="text-slate-500 font-medium">Loading usage statistics...</p>
        </div>
      </div>
    );
  }

  if (error && !usage) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center space-y-4 max-w-md">
          <p className="text-red-500 font-bold">{error}</p>
          <Button onClick={() => loadUsage()} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const tierName = subscription?.tier_name || usage?.current_tier_name || 'free';
  const isUnlimited = usage?.is_unlimited || false;

  // AI-focused usage categories
  const aiUsageCategories = [
    {
      icon: Brain,
      title: "AI Content Generation",
      remaining: usage?.ai_generation_remaining || 0,
      used: usage?.total_ai_generation_used || 0,
      isUnlimited,
      colorClass: "primary"
    },
    {
      icon: Image,
      title: "Image Generation",
      remaining: usage?.image_generation_remaining || 0,
      used: usage?.total_image_generation_used || 0,
      isUnlimited,
      colorClass: "purple"
    },
    {
      icon: Edit3,
      title: "Image Editing",
      remaining: usage?.image_editing_remaining || 0,
      used: usage?.total_image_editing_used || 0,
      isUnlimited,
      colorClass: "blue"
    },
  ];

  // Other usage categories
  const otherUsageCategories = [
    {
      icon: FileText,
      title: "Posts",
      remaining: usage?.posts_remaining || 0,
      used: usage?.total_posts_used || 0,
      isUnlimited,
      colorClass: "green"
    },
    {
      icon: Calendar,
      title: "Scheduled Posts",
      remaining: usage?.post_scheduling_remaining || 0,
      used: usage?.total_post_scheduling_used || 0,
      isUnlimited,
      colorClass: "orange"
    },
    {
      icon: Edit3,
      title: "Post Editing",
      remaining: usage?.edit_posts_remaining || 0,
      used: usage?.total_edit_posts_used || 0,
      isUnlimited,
      colorClass: "indigo"
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 grid-bg opacity-40 -z-10" />
      <div className="glow-effect top-1/4 -left-20 w-[500px] h-[500px] -z-10" />
      <div className="glow-effect bottom-1/4 -right-20 w-[500px] h-[500px] -z-10" />

      <div className="container mx-auto px-6 relative z-10 max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-slate-100 text-slate-600 text-xs font-bold mb-4 tracking-widest uppercase border border-slate-200">
                <BarChart3 className="w-4 h-4" />
                <span>USAGE STATISTICS</span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-3 uppercase tracking-tight">
                AI & Content <span className="text-slate-700">Usage</span>
              </h1>
              <p className="text-base sm:text-lg text-slate-500 font-medium">
                Track your usage across all features and AI-powered tools
              </p>
            </div>
            <Button
              onClick={() => loadUsage(true)}
              disabled={refreshing}
              variant="outline"
              className="h-12 px-6 rounded-xl font-bold text-sm uppercase tracking-widest gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Current Plan Badge */}
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-lg bg-white border border-slate-200 shadow-sm">
            <Sparkles className="w-5 h-5 text-slate-600" />
            <span className="text-sm font-semibold text-slate-700">
              Current Plan: <span className="text-slate-900 font-bold capitalize">{tierName}</span>
            </span>
          </div>
        </motion.div>

        {/* AI Usage Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-6">
            <Brain className="w-6 h-6 text-slate-600" />
            <h2 className="text-2xl font-bold text-slate-900 uppercase tracking-tight">AI Features</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {aiUsageCategories.map((category, index) => (
              <UsageCard key={index} {...category} />
            ))}
          </div>
        </motion.div>

        {/* Other Usage Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-12 mb-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="w-6 h-6 text-slate-600" />
            <h2 className="text-2xl font-bold text-slate-900 uppercase tracking-tight">Content Features</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {otherUsageCategories.map((category, index) => (
              <UsageCard key={index} {...category} />
            ))}
          </div>
        </motion.div>

        {/* Summary Card */}
        {usage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl p-8 border border-slate-200 shadow-sm"
          >
            <h3 className="text-xl font-bold text-slate-900 mb-6 uppercase tracking-tight">Usage Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Total AI Actions</p>
                <p className="text-3xl font-bold text-slate-900">
                  {(usage.total_ai_generation_used || 0) + (usage.total_image_generation_used || 0) + (usage.total_image_editing_used || 0)}
                </p>
              </div>
              <div className="text-center p-6 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Total Content Actions</p>
                <p className="text-3xl font-bold text-slate-900">
                  {(usage.total_posts_used || 0) + (usage.total_post_scheduling_used || 0) + (usage.total_edit_posts_used || 0)}
                </p>
              </div>
              <div className="text-center p-6 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Total Actions</p>
                <p className="text-3xl font-bold text-slate-900">
                  {(usage.total_ai_generation_used || 0) + 
                   (usage.total_image_generation_used || 0) + 
                   (usage.total_image_editing_used || 0) +
                   (usage.total_posts_used || 0) + 
                   (usage.total_post_scheduling_used || 0) + 
                   (usage.total_edit_posts_used || 0)}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
