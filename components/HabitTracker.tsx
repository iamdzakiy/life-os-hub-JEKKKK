"use client";

import { useState, useEffect, useMemo } from "react";
import { collection, addDoc, updateDoc, doc, onSnapshot, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence, Variants } from "framer-motion";
import Confetti from "react-confetti";

interface Habit {
  id: string;
  name: string;
  frequency: "daily" | "weekly";
  streak: number;
  completions: string[];
  xp?: number;
}

// Plant growth stages based on streak length
function PlantStage({ streak }: { streak: number }) {
  const stages = [
    { max: 0, icon: "🌱", label: "Seed", color: "text-emerald-400" },
    { max: 3, icon: "🌿", label: "Sprout", color: "text-emerald-300" },
    { max: 7, icon: "🌳", label: "Sapling", color: "text-emerald-500" },
    { max: 14, icon: "🌺", label: "Bloom", color: "text-pink-400" },
    { max: 30, icon: "🎋", label: "Tree", color: "text-amber-400" },
    { max: 60, icon: "🎍", label: "Ancient", color: "text-purple-400" },
    { max: Infinity, icon: "🌟", label: "Legendary", color: "text-yellow-400" },
  ];

  const stage = stages.find((s) => streak <= s.max)!;

  return (
    <motion.div
      initial={{ scale: 0.8, rotate: -10 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="flex items-center gap-1.5"
    >
      <span className="text-lg">{stage.icon}</span>
      <span className={`text-xs font-medium ${stage.color}`}>{stage.label}</span>
    </motion.div>
  );
}

// Weekly progress view with mini-circles (last 30 days)
function WeeklyProgress({ completions }: { completions: string[] }) {
  const today = new Date();
  const days = useMemo(() => {
    const result: { date: string; completed: boolean; isToday: boolean }[] = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const completed = completions.includes(dateStr);
      const isToday = i === 0;
      result.push({ date: dateStr, completed, isToday });
    }
    return result;
  }, [completions]);

  // Group into weeks for visual grouping
  const weeks: { date: string; completed: boolean; isToday: boolean }[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  return (
    <div className="flex gap-1">
      {weeks.map((week, weekIndex) => (
        <div key={weekIndex} className="flex flex-col gap-1">
          {week.map((day, dayIndex) => (
            <motion.div
              key={`${weekIndex}-${dayIndex}`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: (weekIndex * 7 + dayIndex) * 0.01 }}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                day.completed
                  ? "bg-gradient-to-r from-emerald-400 to-teal-600 shadow-lg shadow-emerald-400/30"
                  : day.isToday
                  ? "bg-cyan-500/50 ring-1 ring-cyan-500"
                  : "bg-zinc-800"
              }`}
              title={day.date}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// Header with total XP bar and level badge
function HabitHeader({ totalXP, level }: { totalXP: number; level: number }) {
  const xpForNextLevel = level * 100;
  const currentLevelXP = (level - 1) * 100;
  const progressXP = totalXP - currentLevelXP;
  const progressPercent = Math.min(100, (progressXP / 100) * 100);

  return (
    <div className="glass-card rounded-xl p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-zinc-100" style={{ fontFamily: "Tahoma, Plus Jakarta Sans, sans-serif" }}>
          Habit Garden
        </h2>
        <Badge className="bg-gradient-to-r from-amber-400 to-yellow-600 text-zinc-900 font-bold px-3 py-1">
          Level {level}
        </Badge>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-zinc-400">Total XP: {totalXP}</span>
          <span className="text-zinc-400">{progressXP} / {xpForNextLevel} XP</span>
        </div>
        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-emerald-400 to-teal-600"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>
    </div>
  );
}

// Framer Motion variants for smooth reorder animations
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 300, damping: 25 },
  },
  exit: { opacity: 0, y: -20, scale: 0.95 },
};

export default function HabitTracker({ userId }: { userId: string }) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [newHabit, setNewHabit] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const selectedDate = useMemo(() => new Date().toISOString().split("T")[0], []);

  // Calculate total XP and level
  const { totalXP, level } = useMemo(() => {
    const xp = habits.reduce((sum, h) => sum + (h.xp || h.streak * 10), 0);
    const lvl = Math.floor(xp / 100) + 1;
    return { totalXP: xp, level: lvl };
  }, [habits]);

  useEffect(() => {
    const habitsRef = collection(db, "users", userId, "habits");
    const q = query(habitsRef);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const habitsData = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Habit));
      setHabits(habitsData);
    });
    return () => unsubscribe();
  }, [userId]);

  const addHabit = async () => {
    if (!newHabit.trim()) return;
    await addDoc(collection(db, "users", userId, "habits"), {
      name: newHabit,
      frequency: "daily",
      streak: 0,
      completions: [],
      xp: 0,
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

    const newStreak = calculateStreak(newCompletions);
    const xpEarned = wasCompleted ? 0 : newStreak * 10;
    const newXP = (habit.xp || 0) + xpEarned;

    await updateDoc(habitRef, {
      completions: newCompletions,
      streak: newStreak,
      xp: newXP,
    });

    // Trigger confetti on completion
    if (!wasCompleted) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
  };

  const calculateStreak = (completions: string[]): number => {
    if (completions.length === 0) return 0;

    const sortedDates = [...completions].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    let streak = 1;

    for (let i = 1; i < sortedDates.length; i++) {
      const prevDate = new Date(sortedDates[i - 1]);
      const curr = new Date(sortedDates[i]);
      const diffDays = (prevDate.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24);

      if (diffDays === 1) {
        streak++;
      } else if (diffDays > 1) {
        break;
      }
    }
    return streak;
  };

  // Auto-sort: completed habits to bottom
  const sortedHabits = useMemo(() => {
    return [...habits].sort((a, b) => {
      const aCompleted = a.completions.includes(selectedDate);
      const bCompleted = b.completions.includes(selectedDate);
      if (aCompleted && !bCompleted) return 1;
      if (!aCompleted && bCompleted) return -1;
      return 0;
    });
  }, [habits, selectedDate]);

  return (
    <div className="space-y-4">
      {/* Confetti effect */}
      {showConfetti && (
        <Confetti
          width={400}
          height={400}
          recycle={false}
          numberOfPieces={100}
          colors={["#10b981", "#0d9488", "#06b6d4", "#8b5cf6", "#f59e0b"]}
        />
      )}

      {/* Header with XP and Level */}
      <HabitHeader totalXP={totalXP} level={level} />

      {/* Add Habit Form */}
      <div className="flex gap-2">
        <Input
          value={newHabit}
          onChange={(e) => setNewHabit(e.target.value)}
          placeholder="Add new habit..."
          className="bg-white/5 backdrop-blur-md border border-white/10 text-zinc-100 placeholder:text-zinc-400 focus:border-cyan-500/50 font-sans"
          onKeyDown={(e) => e.key === "Enter" && addHabit()}
        />
        <Button
          onClick={addHabit}
          className="bg-gradient-to-r from-emerald-400 to-teal-600 text-white hover:opacity-90 font-sans"
        >
          Add
        </Button>
      </div>

      {/* Habits List */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-h-[560px] overflow-y-auto pr-2 space-y-3"
      >
        <AnimatePresence>
          {sortedHabits.map((habit) => {
            const isCompleted = habit.completions.includes(selectedDate);
            return (
              <motion.div
                key={habit.id}
                variants={itemVariants}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="glass-card rounded-lg p-3 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <motion.div
                      whileTap={{ scale: 0.9 }}
                      whileHover={{ scale: 1.05 }}
                    >
                      <input
                        type="checkbox"
                        checked={isCompleted}
                        onChange={() => toggleHabit(habit)}
                        className="h-5 w-5 rounded border-white/30 bg-white/5 checked:bg-emerald-500 transition-all cursor-pointer"
                      />
                    </motion.div>
                    <span
                      className={`font-medium text-zinc-100 transition-all ${
                        isCompleted ? "line-through opacity-60" : ""
                      }`}
                      style={{ fontFamily: "Tahoma, Plus Jakarta Sans, sans-serif" }}
                    >
                      {habit.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <PlantStage streak={habit.streak} />
                    <Badge className="bg-gradient-to-r from-emerald-400 to-teal-600 text-white capitalize border-0">
                      {habit.streak} days
                    </Badge>
                  </div>
                </div>

                {/* Weekly Progress View (last 30 days) */}
                <WeeklyProgress completions={habit.completions} />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {habits.length === 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-zinc-500 text-sm text-center py-8"
          style={{ fontFamily: "Tahoma, Plus Jakarta Sans, sans-serif" }}
        >
          No habits yet. Plant your first habit above! 🌱
        </motion.p>
      )}
    </div>
  );
}