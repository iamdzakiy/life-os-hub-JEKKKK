"use client";

import { useState, useEffect } from "react";
import { collection, addDoc, updateDoc, doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

interface Habit {
  id: string;
  name: string;
  frequency: "daily" | "weekly";
  streak: number;
  completions: string[];
}

// Generate GitHub-style heat map data
function HabitHeatMap({ completions }: { completions: string[] }) {
  const today = new Date();
  const days = [];
  
  // Generate last 365 days
  for (let i = 0; i < 365; i++) {
    const date = new Date();
    date.setDate(today.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    const completed = completions.includes(dateStr);
    days.unshift({ date: dateStr, completed });
  }

  // Group by weeks
  const weeks: { date: string; completed: boolean }[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const getOpacity = (completed: boolean) => completed ? "bg-emerald-500" : "bg-zinc-800";

  return (
    <div className="flex gap-1 overflow-x-auto py-2">
      {weeks.map((week, weekIndex) => (
        <div key={weekIndex} className="flex flex-col gap-1">
          {week.map((day, dayIndex) => (
            <motion.div
              key={`${weekIndex}-${dayIndex}`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: (weekIndex * 7 + dayIndex) * 0.001 }}
              className={`w-3 h-3 rounded-sm ${getOpacity(day.completed)}`}
              title={day.date}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export default function HabitTracker({ userId }: { userId: string }) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [newHabit, setNewHabit] = useState("");
  const selectedDate = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "users", userId, "habits"), (snapshot) => {
      setHabits(snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Habit)));
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
      createdAt: new Date(),
    });
    setNewHabit("");
  };

  const toggleHabit = async (habit: Habit) => {
    const habitRef = doc(db, "users", userId, "habits", habit.id);
    const newCompletions = habit.completions.includes(selectedDate)
      ? habit.completions.filter((d) => d !== selectedDate)
      : [...habit.completions, selectedDate];
    
    const newStreak = calculateStreak(newCompletions);
    await updateDoc(habitRef, { completions: newCompletions, streak: newStreak });
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex gap-2">
        <Input
          value={newHabit}
          onChange={(e) => setNewHabit(e.target.value)}
          placeholder="Add new habit..."
          className="bg-white/5 backdrop-blur-md border border-white/10 text-zinc-100 placeholder:text-zinc-400 focus:border-cyan-500/50"
          onKeyDown={(e) => e.key === "Enter" && addHabit()}
        />
        <Button onClick={addHabit} className="bg-gradient-to-r from-emerald-400 to-teal-600 text-white hover:opacity-90">
          Add
        </Button>
      </div>
      
      <div className="max-h-[460px] overflow-y-auto pr-2 space-y-3">
        {habits.map((habit) => (
          <motion.div
            key={habit.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="p-3 bg-white/5 backdrop-blur-md rounded-lg border border-white/10 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={habit.completions.includes(selectedDate)}
                  onChange={() => toggleHabit(habit)}
                  className="h-5 w-5 rounded border-white/30 bg-white/5 checked:bg-emerald-500"
                />
                <span className="font-medium text-zinc-100">{habit.name}</span>
              </div>
              <Badge className="bg-gradient-to-r from-emerald-400 to-teal-600 text-white capitalize border-0">
                {habit.streak} day streak
              </Badge>
            </div>
            <HabitHeatMap completions={habit.completions} />
          </motion.div>
        ))}
      </div>
      
      {habits.length === 0 && (
        <p className="text-zinc-500 text-sm text-center py-4">No habits yet. Add your first habit above!</p>
      )}
    </motion.div>
  );
}