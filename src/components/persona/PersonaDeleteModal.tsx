"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface PersonaDeleteModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

export function PersonaDeleteModal({
  open,
  onClose,
  onConfirm,
  loading,
}: PersonaDeleteModalProps) {
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
            className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl"
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-black text-slate-900">Delete persona?</h2>
            <p className="mt-3 text-sm text-slate-600">
              This removes the persona for this page. AI content tools will need a new persona before
              they work again.
            </p>
            <div className="mt-6 flex gap-3">
              <Button type="button" variant="outline" className="flex-1 rounded-xl" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="button"
                className="flex-1 rounded-xl bg-red-500 hover:bg-red-600"
                disabled={loading}
                onClick={onConfirm}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                Delete
              </Button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
