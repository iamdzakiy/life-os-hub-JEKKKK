"use client";
import { useState, useEffect, useMemo } from "react";
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { Sun, Plus, CheckCircle, Trash2, Clock, Target, Sparkles, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface PlanItem {
  id: string;
  title: string;
  time: string;
  priority: "high" | "medium" | "low";
  completed: boolean;
  date: string;
  order: number;
}

interface DailyFocus {
  id: string;
  date: string;
  focus: string;
  affirmation: string;
}

export default function DayPlanner({ userId }: { userId: string }) {
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [focus, setFocus] = useState<DailyFocus | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [newItem, setNewItem] = useState({ title: "", time: "", priority: "medium" as "high" | "medium" | "low" });
  const [focusInput, setFocusInput] = useState("");
  const today = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);

  useEffect(() => {
    const unsubPlans = onSnapshot(query(collection(db, "users", userId, "daily_plans")), (snap) => {
      setPlans(snap.docs.map(d => ({ id: d.id, ...d.data() } as PlanItem)).filter(p => p.date === today).sort((a, b) => a.order - b.order));
    });
    const unsubFocus = onSnapshot(query(collection(db, "users", userId, "daily_focus")), (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as DailyFocus));
      setFocus(docs.find(f => f.date === today) || null);
    });
    return () => { unsubPlans(); unsubFocus(); };
  }, [userId, today]);

  const addPlanItem = async () => {
    if (!newItem.title.trim()) return;
    await addDoc(collection(db, "users", userId, "daily_plans"), {
      title: newItem.title,
      time: newItem.time,
      priority: newItem.priority,
      completed: false,
      date: today,
      order: plans.length,
    });
    setNewItem({ title: "", time: "", priority: "medium" });
    setShowForm(false);
  };

  const toggleComplete = async (item: PlanItem) => {
    await updateDoc(doc(db, "users", userId, "daily_plans", item.id), { completed: !item.completed });
  };

  const deletePlan = async (id: string) => {
    await deleteDoc(doc(db, "users", userId, "daily_plans", id));
  };

  const saveFocus = async () => {
    if (!focusInput.trim()) return;
    if (focus) {
      await updateDoc(doc(db, "users", userId, "daily_focus", focus.id), { focus: focusInput });
    } else {
      await addDoc(collection(db, "users", userId, "daily_focus"), {
        date: today,
        focus: focusInput,
        affirmation: "",
      });
    }
  };

  const completedCount = plans.filter(p => p.completed).length;
  const progress = plans.length > 0 ? Math.round((completedCount / plans.length) * 100) : 0;

  const priorityColors = { high: "border-l-rose-500", medium: "border-l-amber-500", low: "border-l-cyan-500" };

  return (
    <div className="space-y-4">
      {/* Daily Focus */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="glass-panel rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <Target className="h-4 w-4 text-cyan-400" />
          <h2 className="text-sm font-medium text-zinc-100">Today's Main Focus</h2>
        </div>
        <div className="flex gap-2">
          <Input value={focusInput || focus?.focus || ""} onChange={(e) => setFocusInput(e.target.value)}
            placeholder="What's the most important thing today?"
            className="bg-white/5 border-white/10 text-zinc-100 text-sm" />
          <Button onClick={saveFocus} size="sm" className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white flex-shrink-0">
            Save
          </Button>
        </div>
      </motion.div>

      {/* Progress */}
      <div className="glass-panel rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-zinc-500">Today's Progress</span>
          <span className="text-xs text-zinc-400">{completedCount}/{plans.length} done</span>
        </div>
        <div className="w-full bg-white/5 rounded-full h-2">
          <motion.div className="h-2 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500"
            initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.5 }} />
        </div>
      </div>

      {/* Add Button */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-zinc-300 flex items-center gap-2">
          <Clock className="h-4 w-4" /> Timeline
        </h3>
        <Button variant="ghost" size="sm" onClick={() => setShowForm(true)} className="glass-button text-zinc-300">
          <Plus className="h-4 w-4 mr-1" /> Add
        </Button>
      </div>

      {/* Plan Items */}
      <div className="space-y-2">
        <AnimatePresence>
          {plans.map((item) => (
            <motion.div key={item.id} layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              className={`glass-panel rounded-xl p-3 flex items-center gap-3 border-l-4 ${priorityColors[item.priority]} ${item.completed ? "opacity-50" : ""}`}>
              <button onClick={() => toggleComplete(item)}
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  item.completed ? "bg-emerald-500 border-emerald-500" : "border-white/20 hover:border-white/40"
                }`}>
                {item.completed && <CheckCircle className="h-3.5 w-3.5 text-white" />}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${item.completed ? "text-zinc-500 line-through" : "text-zinc-100"}`}>{item.title}</p>
                {item.time && <p className="text-xs text-zinc-500">{item.time}</p>}
              </div>
              <button onClick={() => deletePlan(item.id)} className="text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100">
                <Trash2 className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
        {plans.length === 0 && (
          <div className="text-center py-8 glass-panel rounded-xl">
            <Sun className="h-6 w-6 mx-auto text-zinc-500 mb-1" />
            <p className="text-zinc-500 text-sm">Plan your day ahead. What do you want to accomplish?</p>
          </div>
        )}
      </div>

      {/* Add Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="glass-panel rounded-xl p-4 space-y-3 overflow-hidden">
            <Input placeholder="What do you need to do?" value={newItem.title} onChange={e => setNewItem({ ...newItem, title: e.target.value })}
              className="bg-white/5 border-white/10 text-zinc-100" autoFocus />
            <div className="flex gap-2">
              <Input type="time" value={newItem.time} onChange={e => setNewItem({ ...newItem, time: e.target.value })}
                className="flex-1 bg-white/5 border-white/10 text-zinc-100" />
              <select value={newItem.priority} onChange={e => setNewItem({ ...newItem, priority: e.target.value as "high" | "medium" | "low" })}
                className="flex-1 bg-white/5 border-white/10 text-zinc-100 rounded-lg px-2 text-sm">
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button onClick={addPlanItem} className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 text-white">Add</Button>
              <Button variant="outline" onClick={() => setShowForm(false)} className="border-white/10 text-zinc-400">Cancel</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}