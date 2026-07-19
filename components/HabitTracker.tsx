"use client";
import { useState, useEffect, useMemo } from "react";
import { collection, addDoc, updateDoc, doc, onSnapshot, query, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Check, Plus, Trash2 } from "lucide-react";
import Confetti from "react-confetti";

interface Habit {
  id: string;
  name: string;
  streak: number;
  completions: string[];
  color: string;
}

const HABIT_COLORS = [
  "from-emerald-400 to-teal-600",
  "from-cyan-400 to-blue-600",
  "from-violet-400 to-purple-600",
  "from-amber-400 to-orange-600",
  "from-rose-400 to-pink-600",
];

function Heatmap({ completions }: { completions: string[] }) {
  const days = useMemo(() => {
    const result = [];
    const today = new Date();
    for (let i = 83; i >= 0; i--) { // ~12 weeks
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const count = completions.filter(d => d === dateStr).length;
      result.push({ date: dateStr, count: Math.min(count, 1) });
    }
    return result;
  }, [completions]);

  return (
    <div className="flex gap-1 flex-wrap">
      {days.map((day, i) => (
        <motion.div
          key={day.date}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: i * 0.005 }}
          className={`w-3 h-3 rounded-sm transition-colors ${
            day.count === 1 
              ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" 
              : "bg-white/5"
          }`}
          title={day.date}
        />
      ))}
    </div>
  );
}

export default function HabitTracker({ userId }: { userId: string }) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [newHabit, setNewHabit] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const selectedDate = useMemo(() => new Date().toISOString().split("T")[0], []);

  useEffect(() => {
    const habitsRef = collection(db, "users", userId, "habits");
    const unsubscribe = onSnapshot(query(habitsRef), (snapshot) => {
      setHabits(snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Habit)));
    });
    return () => unsubscribe();
  }, [userId]);

  const addHabit = async () => {
    if (!newHabit.trim()) return;
    await addDoc(collection(db, "users", userId, "habits"), {
      name: newHabit,
      streak: 0,
      completions: [],
      color: HABIT_COLORS[habits.length % HABIT_COLORS.length],
      createdAt: new Date(),
    });
    setNewHabit("");
  };

  const toggleHabit = async (habit: Habit) => {
    const habitRef = doc(db, "users", userId, "habits", habit.id);
    const wasCompleted = habit.completions.includes(selectedDate);
    const newCompletions = wasCompleted
      ? habit.completions.filter((d) => d !== selectedDate)
      : [...habit.completions, selectedDate];
    
    let newStreak = 0;
    if (newCompletions.length > 0) {
      const sorted = [...newCompletions].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
      newStreak = 1;
      for (let i = 1; i < sorted.length; i++) {
        const diff = (new Date(sorted[i-1]).getTime() - new Date(sorted[i]).getTime()) / (1000 * 60 * 60 * 24);
        if (diff === 1) newStreak++;
        else break;
      }
    }

    await updateDoc(habitRef, { completions: newCompletions, streak: newStreak });

    if (!wasCompleted) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2000);
    }
  };

  const deleteHabit = async (id: string) => {
    await deleteDoc(doc(db, "users", userId, "habits", id));
  };

  return (
    <div className="space-y-6">
      {showConfetti && (
        <Confetti width={window.innerWidth} height={window.innerHeight} recycle={false} numberOfPieces={150} colors={["#10b981", "#06b6d4", "#8b5cf6"]} />
      )}
      
      <div className="flex gap-2">
        <Input
          value={newHabit}
          onChange={(e) => setNewHabit(e.target.value)}
          placeholder="What habit do you want to build?"
          className="glass-panel bg-transparent text-zinc-100 placeholder:text-zinc-500 focus:border-emerald-500/50 h-11"
          onKeyDown={(e) => e.key === "Enter" && addHabit()}
        />
        <Button onClick={addHabit} className="h-11 px-6 bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:opacity-90 border-0 shadow-lg shadow-emerald-500/20">
          <Plus className="h-5 w-5 mr-1" /> Add
        </Button>
      </div>

      <div className="space-y-4">
        <AnimatePresence>
          {habits.map((habit) => {
            const isCompleted = habit.completions.includes(selectedDate);
            return (
              <motion.div
                key={habit.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass-panel rounded-xl p-4 space-y-4 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => toggleHabit(habit)}
                      className={`relative w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-all ${
                        isCompleted 
                          ? `bg-gradient-to-br ${habit.color} border-transparent shadow-lg` 
                          : "border-white/20 hover:border-white/40 bg-white/5"
                      }`}
                    >
                      <AnimatePresence>
                        {isCompleted && (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                            <Check className="h-5 w-5 text-white" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.button>
                    <div>
                      <h3 className={`font-semibold text-lg transition-all ${isCompleted ? "text-zinc-500 line-through" : "text-zinc-100"}`}>
                        {habit.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={`bg-gradient-to-r ${habit.color} text-white border-0 text-xs`}>
                          <Flame className="h-3 w-3 mr-1" /> {habit.streak} day streak
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => deleteHabit(habit.id)} className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <Heatmap completions={habit.completions} />
              </motion.div>
            );
          })}
        </AnimatePresence>
        {habits.length === 0 && (
          <div className="text-center py-12 glass-panel rounded-xl">
            <p className="text-zinc-500">No habits yet. Start building your first one above! 🌱</p>
          </div>
        )}
      </div>
    </div>
  );
}