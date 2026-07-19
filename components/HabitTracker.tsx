"use client";
import { useState, useEffect } from "react";
import { collection, addDoc, updateDoc, doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface Habit {
  id: string;
  name: string;
  frequency: "daily" | "weekly";
  streak: number;
  completions: string[];
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
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          value={newHabit}
          onChange={(e) => setNewHabit(e.target.value)}
          placeholder="Add new habit..."
          className="bg-zinc-800 border-zinc-700 text-zinc-100"
          onKeyDown={(e) => e.key === "Enter" && addHabit()}
        />
        <Button onClick={addHabit} className="bg-blue-600 hover:bg-blue-700">
          Add
        </Button>
      </div>
      
      <div className="max-h-[400px] overflow-y-auto pr-2 space-y-3">
        {habits.map((habit) => (
          <div key={habit.id} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={habit.completions.includes(selectedDate)}
                onChange={() => toggleHabit(habit)}
                className="h-5 w-5 rounded border-zinc-600 bg-zinc-800 checked:bg-blue-600"
              />
              <span className="font-medium text-zinc-100">{habit.name}</span>
            </div>
            <Badge variant="secondary" className="capitalize">
              {habit.streak} day streak
            </Badge>
          </div>
        ))}
      </div>
      
      {habits.length === 0 && (
        <p className="text-zinc-500 text-sm text-center py-4">No habits yet. Add your first habit above!</p>
      )}
    </div>
  );
}