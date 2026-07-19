// components/dashboard/QuickAdd.tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Sparkles, Check, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { addDoc, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";

type QuickType = "task" | "note";

export default function QuickAdd({ userId }: { userId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<QuickType>("task");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setIsSubmitting(true);

    try {
      if (type === "task") {
        await addDoc(collection(db, "users", userId, "tasks"), {
          title,
          description,
          status: "todo",
          priority: "medium",
          dueDate: new Date().toISOString(),
          createdAt: new Date(),
        });
      } else {
        await addDoc(collection(db, "users", userId, "notes"), {
          content: title + (description ? `\n\n${description}` : ""),
          completed: false,
          createdAt: new Date(),
        });
      }
      setTitle("");
      setDescription("");
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to save:", error);
    }
    setIsSubmitting(false);
  };

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 z-50 h-14 w-14 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-2xl shadow-cyan-500/30 flex items-center justify-center"
      >
        <Plus className="h-6 w-6" />
      </motion.button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-md glass-panel rounded-2xl p-6 border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-cyan-400" />
                  Quick Capture
                </h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-zinc-500 hover:text-zinc-300"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Type Toggle */}
              <div className="flex gap-2 mb-4 bg-white/5 rounded-xl p-1">
                <button
                  onClick={() => setType("task")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
                    type === "task"
                      ? "bg-white/10 text-white"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <Check className="h-4 w-4" /> Task
                </button>
                <button
                  onClick={() => setType("note")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
                    type === "note"
                      ? "bg-white/10 text-white"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <FileText className="h-4 w-4" /> Note
                </button>
              </div>

              {/* Form */}
              <div className="space-y-3">
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={type === "task" ? "What needs to be done?" : "What's on your mind?"}
                  className="bg-white/5 border-white/10 text-zinc-100 placeholder:text-zinc-500 focus:border-cyan-500/50"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                />
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add details (optional)..."
                  className="bg-white/5 border-white/10 text-zinc-100 placeholder:text-zinc-500 focus:border-cyan-500/50 min-h-20 resize-none"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !title.trim()}
                    className="flex-1 bg-gradient-to-r from-cyan-500 to-indigo-600 text-white hover:opacity-90"
                  >
                    {isSubmitting ? "Saving..." : "Save"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsOpen(false)}
                    className="border-white/10 text-zinc-400 hover:text-zinc-100"
                  >
                    Cancel
                  </Button>
                </div>
              </div>

              {/* ADHD-friendly hint */}
              <p className="text-xs text-zinc-500 mt-3 text-center">
                ⚡ Press <kbd className="px-1.5 py-0.5 rounded bg-white/5 text-zinc-400">Enter</kbd> to save instantly
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}