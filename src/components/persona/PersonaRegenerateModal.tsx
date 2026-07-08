"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Loader2, RefreshCw, X } from "lucide-react";
import { useState, type ElementType } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { PersonaData } from "@/lib/hooks/facebook/persona/types";

interface AgentOption {
  id: string;
  label: string;
  icon: ElementType;
}

export interface PersonaRegenerateModalProps {
  open: boolean;
  onClose: () => void;
  loading?: boolean;
  persona: PersonaData | null;
  agentOptions: AgentOption[];
  postsLimit: number;
  onPostsLimitChange: (n: number) => void;
  onConfirm: (agents: string[], requirements: string | null) => void | Promise<void>;
}

export function PersonaRegenerateModal({
  open,
  onClose,
  loading,
  agentOptions,
  postsLimit,
  onPostsLimitChange,
  onConfirm,
}: PersonaRegenerateModalProps) {
  const [agents, setAgents] = useState<string[]>([]);
  const [requirements, setRequirements] = useState("");

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-900">Regenerate with AI</h2>
              <button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mb-4 text-sm text-slate-500">
              Pick sections to regenerate, or leave empty to refresh all. Add optional instructions.
            </p>
            <div className="mb-4 grid grid-cols-2 gap-2">
              {agentOptions.map((a) => (
                <label
                  key={a.id}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-xl border-2 p-3 text-sm font-bold",
                    agents.includes(a.id) ? "border-primary bg-primary/5" : "border-slate-200",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={agents.includes(a.id)}
                    onChange={(e) =>
                      setAgents((prev) =>
                        e.target.checked ? [...prev, a.id] : prev.filter((id) => id !== a.id),
                      )
                    }
                  />
                  <a.icon className="h-4 w-4 text-primary" />
                  {a.label}
                </label>
              ))}
            </div>
            <Textarea
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              placeholder="Optional: e.g. make tone more casual, focus on beginners…"
              className="mb-4 min-h-[80px]"
            />
            <div className="mb-4 flex items-center gap-2">
              <label className="text-sm font-bold text-slate-700">Posts to analyze</label>
              <input
                type="number"
                min={1}
                max={50}
                value={postsLimit}
                onChange={(e) => onPostsLimitChange(Number(e.target.value))}
                className="w-20 rounded-lg border border-slate-200 px-2 py-1 text-sm font-bold"
              />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1 rounded-xl" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="button"
                className="flex-1 rounded-xl"
                disabled={loading}
                onClick={() => void onConfirm(agents, requirements.trim() || null)}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                Regenerate
              </Button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
