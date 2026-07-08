"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Settings2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";

interface LeadRulesEditorProps {
  open: boolean;
  keywords: string;
  customRule: string;
  saving?: boolean;
  onKeywordsChange: (v: string) => void;
  onCustomRuleChange: (v: string) => void;
  onCancel: () => void;
  onSave: () => void;
}

export function LeadRulesEditor({
  open,
  keywords,
  customRule,
  saving,
  onKeywordsChange,
  onCustomRuleChange,
  onCancel,
  onSave,
}: LeadRulesEditorProps) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="lead-rules-title"
            className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
            initial={{ scale: 0.96, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 8 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Settings2 className="h-5 w-5" />
                </div>
                <div>
                  <h2 id="lead-rules-title" className="text-xl font-black text-slate-900">
                    Lead rules
                  </h2>
                  <p className="text-xs text-slate-500">
                    Keywords and custom rules for detecting leads on this post
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onCancel}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-700"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <label className="mb-1 block text-xs font-bold text-slate-500">
              Keywords (comma-separated)
            </label>
            <Textarea
              value={keywords}
              onChange={(e) => onKeywordsChange(e.target.value)}
              placeholder="pricing, demo, interested"
              className="mb-4 min-h-[72px] rounded-xl"
              disabled={saving}
            />
            <label className="mb-1 block text-xs font-bold text-slate-500">Custom rule</label>
            <Textarea
              value={customRule}
              onChange={(e) => onCustomRuleChange(e.target.value)}
              placeholder="Treat comments asking about courses as leads"
              className="mb-6 min-h-[96px] rounded-xl"
              disabled={saving}
            />

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={onCancel}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="flex-1 rounded-xl"
                onClick={onSave}
                disabled={saving}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save rules"}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
