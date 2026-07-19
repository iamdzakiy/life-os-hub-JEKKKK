"use client";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Smile, Meh, Frown, Sparkles } from "lucide-react";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion, AnimatePresence } from "framer-motion";

const AFFIRMATIONS = [
  "Focus on progress, not perfection.",
  "Wealth begins with calm planning.",
  "Today is a new opportunity to grow.",
  "Your consistency today shapes tomorrow.",
  "One step forward is still progress.",
  "Rise and shine, your future self will thank you.",
  "Every small win adds up to big victories.",
];

export default function MorningPopup({ userId }: { userId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mood, setMood] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [affirmation, setAffirmation] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const today = new Date().toISOString().split("T")[0];
      
      // Check if morning routine has been done today
      const docRef = doc(db, "users", userId, "affirmations_moods", today);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        setAffirmation(AFFIRMATIONS[Math.floor(Math.random() * AFFIRMATIONS.length)]);
        setIsOpen(true);
      }
    };

    if (userId) {
      fetchData();
    }
  }, [userId]);

  const handleSave = async () => {
    const today = new Date().toISOString().split("T")[0];
    await setDoc(doc(db, "users", userId, "affirmations_moods", today), {
      date: today,
      mood,
      note,
      affirmation,
      timestamp: new Date(),
    });
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="bg-white/5 backdrop-blur-md border border-white/10 text-zinc-100 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-center flex items-center justify-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-400" />
            Good Morning! 🌅
          </DialogTitle>
        </DialogHeader>
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-6 py-4"
          >
            {/* Affirmation */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-center p-4 bg-white/5 rounded-lg border border-white/10"
            >
              <p className="text-zinc-200 italic">&ldquo;{affirmation}&rdquo;</p>
            </motion.div>
            
            {/* Mood Tracker */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-2"
            >
              <label className="text-sm font-medium text-zinc-300">How are you feeling?</label>
              <div className="flex justify-center gap-4">
                <Button 
                  variant={mood === "good" ? "default" : "outline"} 
                  onClick={() => setMood("good")} 
                  className="bg-white/5 border-white/10 hover:bg-white/10"
                >
                  <Smile className="h-5 w-5" />
                </Button>
                <Button 
                  variant={mood === "neutral" ? "default" : "outline"} 
                  onClick={() => setMood("neutral")} 
                  className="bg-white/5 border-white/10 hover:bg-white/10"
                >
                  <Meh className="h-5 w-5" />
                </Button>
                <Button 
                  variant={mood === "bad" ? "default" : "outline"} 
                  onClick={() => setMood("bad")} 
                  className="bg-white/5 border-white/10 hover:bg-white/10"
                >
                  <Frown className="h-5 w-5" />
                </Button>
              </div>
            </motion.div>

            {/* Focus Note */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-2"
            >
              <label className="text-sm font-medium text-zinc-300">Main focus today:</label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Write your focus for today..."
                className="bg-white/5 border-white/10 text-zinc-100 placeholder:text-zinc-400 focus-visible:ring-cyan-500/30 min-h-20"
              />
            </motion.div>

            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-2"
            >
              <p className="text-xs text-zinc-400">Complete your morning routine to start the day with intention.</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Button 
                onClick={handleSave} 
                className="w-full bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white hover:opacity-90 transition-opacity"
              >
                Start Today
              </Button>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}