"use client";
import { useState, useEffect, useMemo } from "react";
import { collection, addDoc, updateDoc, doc, onSnapshot, query, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Check, Plus, Trash2, Zap, Trophy, Medal, TrendingUp, X } from "lucide-react";
import Confetti from "react-confetti";

interface Habit {
  id: string;
  name: string;
  streak: number;
  bestStreak: number;
  completions: string[];
  color: string;
  createdAt: Date;
}

const HABIT_COLORS = [
  "from-emerald-400 to-teal-600",
  "from-cyan-400 to-blue-600",
  "from-violet-400 to-purple-600",
  "from-amber-400 to-orange-600",
  "from-rose-400 to-pink-600",
];

const QUOTES = [
  "Small daily improvements lead to massive results!",
  "You don't have to be extreme, just consistent.",
  "Your habits shape your future self.",
  "Be stronger than your excuses.",
  "Discipline = Freedom",
];

const LEVEL_NAMES = ["Starter", "Bronze", "Silver", "Gold", "Platinum", "Diamond", "Legend"];

function getLevel(streak: number): { name: string; tier: number; icon: string } {
  if (streak >= 365) return { name: "Legend", tier: 6, icon: "👑" };
  if (streak >= 180) return { name: "Diamond", tier: 5, icon: "💎" };
  if (streak >= 90) return { name: "Platinum", tier: 4, icon: "🏆" };
  if (streak >= 30) return { name: "Gold", tier: 3, icon: "🥇" };
  if (streak >= 14) return { name: "Silver", tier: 2, icon: "🥈" };
  if (streak >= 7) return { name: "Bronze", tier: 1, icon: "🥉" };
  return { name: "Starter", tier: 0, icon: "🌱" };
}

function Heatmap({ completions, habits }: { completions: string[]; habits: Habit[] }) {
  const days = useMemo(() => {
    const result: { date: string; count: number; max: number }[] = [];
    const today = new Date();
    for (let i = 83; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const count = completions.filter(d => d === dateStr).length;
      const totalHabits = habits.length || 1;
      result.push({ date: dateStr, count: Math.min(count, 1), max: totalHabits });
    }
    return result;
  }, [completions, habits]);

  return (
    <div className="flex gap-1 flex-wrap">
      {days.map((day, i) => (
        <motion.div
          key={day.date}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: i * 0.003 }}
          whileHover={{ scale: 1.3 }}
          className={`w-2.5 h-2.5 rounded-sm transition-all cursor-pointer ${
            day.count >= 1 
              ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]" 
              : "bg-white/5 hover:bg-white/10"
          }`}
          title={`${day.date}: ${day.count ? "✅" : "❌"}`}
        />
      ))}
    </div>
  );
}

export default function HabitTracker({ userId }: { userId: string }) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [newHabit, setNewHabit] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiKey, setConfettiKey] = useState(0);
  const selectedDate = useMemo(() => new Date().toISOString().split("T")[0], []);
  const [selectedView, setSelectedView] = useState<"today" | "history">("today");
  const quoteOfTheDay = useMemo(() => QUOTES[Math.floor(Math.random() * QUOTES.length)], []);

  useEffect(() => {
    const habitsRef = collection(db, "users", userId, "habits");
    const unsubscribe = onSnapshot(query(habitsRef), (snapshot) => {
      setHabits(snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Habit)));
    });
    return () => unsubscribe();
  }, [userId]);

  const stats = useMemo(() => {
    const total = habits.length;
    const done = habits.filter(h => h.completions.includes(selectedDate)).length;
    const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;
    const totalStreak = habits.reduce((s, h) => s + h.streak, 0);
    const bestStreak = Math.max(...habits.map(h => h.streak), 0);
    return { total, done, completionRate, totalStreak, bestStreak };
  }, [habits, selectedDate]);

  const addHabit = async () => {
    if (!newHabit.trim()) return;
    await addDoc(collection(db, "users", userId, "habits"), {
      name: newHabit,
      streak: 0,
      bestStreak: 0,
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
    if (newCompletions.length > 0 && !wasCompleted) {
      const sorted = [...newCompletions].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
      newStreak = 1;
      for (let i = 1; i < sorted.length; i++) {
        const diff = (new Date(sorted[i-1]).getTime() - new Date(sorted[i]).getTime()) / (1000 * 60 * 60 * 24);
        if (diff === 1) newStreak++;
        else break;
      }
    }

    const newBestStreak = Math.max(habit.bestStreak, newStreak);
    await updateDoc(habitRef, { completions: newCompletions, streak: newStreak, bestStreak: newBestStreak });

    if (!wasCompleted) {
      setConfettiKey(prev => prev + 1);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2000);
    }
  };

  const deleteHabit = async (id: string) => {
    await deleteDoc(doc(db, "users", userId, "habits", id));
  };

  const missedDays = useMemo(() => {
    const today = new Date();
    const days: { date: string; missed: number }[] = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const missed = habits.filter(h => !h.completions.includes(dateStr)).length;
      days.push({ date: dateStr, missed });
    }
    return days;
  }, [habits]);

  const todayTodo = habits.filter(h => !h.completions.includes(selectedDate));

  return (
    <div className="space-y-6">
      {showConfetti && (
        <Confetti
          key={confettiKey}
          width={typeof window !== "undefined" ? window.innerWidth : 800}
          height={typeof window !== "undefined" ? window.innerHeight : 600}
          recycle={false}
          numberOfPieces={150}
          colors={["#10b981", "#06b6d4", "#8b5cf6"]}
        />
      )}
      
      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "Done", value: `${stats.done}/${stats.total}`, color: "text-emerald-400", icon: Check },
          { label: "Rate", value: `${stats.completionRate}%`, color: "text-cyan-400", icon: TrendingUp },
          { label: "Streak", value: `${stats.bestStreak}d`, color: "text-amber-400", icon: Flame },
          { label: "Level", value: getLevel(stats.bestStreak).icon, color: "text-purple-400", icon: Trophy },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="glass-panel rounded-xl p-3 text-center">
            <p className="text-xs text-zinc-500">{s.label}</p>
            <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Quote */}
      <div className="text-center text-xs text-zinc-500 italic">
        &ldquo;{quoteOfTheDay}&rdquo;
      </div>

      {/* View Toggle */}
      <div className="flex gap-1 bg-white/5 rounded-xl p-1 w-fit">
        <button onClick={() => setSelectedView("today")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium ${selectedView === "today" ? "bg-white/10 text-white" : "text-zinc-400"}`}>
          Today
        </button>
        <button onClick={() => setSelectedView("history")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium ${selectedView === "history" ? "bg-white/10 text-white" : "text-zinc-400"}`}>
          History
        </button>
      </div>

      {/* Today's Todo - Habits not done yet */}
      {selectedView === "today" && todayTodo.length > 0 && (
        <div className="glass-panel rounded-xl p-4 border-l-2 border-amber-500/50">
          <p className="text-xs text-amber-400 font-medium mb-2 flex items-center gap-1">
            <Zap className="h-3 w-3" /> Still to do today:
          </p>
          <div className="space-y-1">
            {todayTodo.slice(0, 5).map(h => (
              <div key={h.id} className="flex items-center gap-2 text-sm text-zinc-400">
                <span className={`w-2 h-2 rounded-full bg-gradient-to-br ${h.color}`} />
                {h.name}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Habit */}
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

      {/* Habit List */}
      <div className="space-y-3">
        <AnimatePresence>
          {habits.map((habit) => {
            const isCompleted = habit.completions.includes(selectedDate);
            const level = getLevel(habit.streak);
            return (
              <motion.div
                key={habit.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass-panel rounded-xl p-4 space-y-3 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      animate={isCompleted ? { scale: [1, 1.2, 1] } : {}}
                      transition={isCompleted ? { duration: 0.3 } : {}}
                      onClick={() => toggleHabit(habit)}
                      className={`relative w-9 h-9 rounded-lg border-2 flex items-center justify-center transition-all ${
                        isCompleted 
                          ? `bg-gradient-to-br ${habit.color} border-transparent shadow-lg` 
                          : "border-white/20 hover:border-white/40 bg-white/5"
                      }`}
                    >
                      <AnimatePresence>
                        {isCompleted && (
                          <motion.div 
                            initial={{ scale: 0, rotate: -180 }} 
                            animate={{ scale: 1, rotate: 0 }} 
                            exit={{ scale: 0 }}
                            transition={{ type: "spring", stiffness: 500 }}
                          >
                            <Check className="h-5 w-5 text-white" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.button>
                    <div>
                      <h3 className={`font-semibold text-lg transition-all ${isCompleted ? "text-zinc-500 line-through" : "text-zinc-100"}`}>
                        {habit.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <Badge className={`bg-gradient-to-r ${habit.color} text-white border-0 text-xs`}>
                          <Flame className="h-3 w-3 mr-1" /> {habit.streak}d
                        </Badge>
                        <span className="text-xs text-zinc-500">{level.icon} {level.name}</span>
                        {habit.bestStreak > habit.streak && (
                          <span className="text-xs text-zinc-500">Best: {habit.bestStreak}d</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {habit.streak >= 7 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="text-xs px-2 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/20"
                      >
                        {habit.streak >= 30 ? "🔥 Unstoppable!" : habit.streak >= 14 ? "💪 Strong!" : "✨ Keep going!"}
                      </motion.span>
                    )}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => deleteHabit(habit.id)} 
                      className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all h-8 w-8"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {selectedView === "history" && (
                  <Heatmap completions={habit.completions} habits={habits} />
                )}
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

      {/* Missed Days Analysis */}
      {selectedView === "history" && habits.length > 0 && (
        <div className="glass-panel rounded-xl p-4">
          <h3 className="text-sm font-medium text-zinc-300 mb-3">Last 14 Days - Missed Days</h3>
          <div className="space-y-1.5">
            {missedDays.slice(0, 7).map(day => {
              const date = new Date(day.date);
              const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
              return (
                <div key={day.date} className="flex items-center gap-2 text-xs">
                  <span className="w-8 text-zinc-500">{dayName}</span>
                  <div className="flex-1 bg-white/5 rounded-full h-4 overflow-hidden">
                    <div className="h-full bg-rose-500/30 rounded-full transition-all" 
                      style={{ width: `${(day.missed / Math.max(...missedDays.map(d => d.missed), 1)) * 100}%` }} />
                  </div>
                  <span className="text-zinc-500 w-4 text-right">{day.missed}</span>
                  {day.missed === 0 && <X className="h-3 w-3 text-emerald-400" />}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}