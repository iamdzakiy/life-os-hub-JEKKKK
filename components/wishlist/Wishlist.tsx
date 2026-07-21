"use client";
import { useState, useEffect } from "react";
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Plus, Trash2, Heart, Star, Target, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

interface Wish {
  id: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  category: string;
  targetDate: string;
  achieved: boolean;
  createdAt: Date;
}

const CATEGORIES = ["Travel", "Material", "Experience", "Career", "Health", "Learning", "Other"];
const PRIORITIES = [
  { value: "low", label: "Low", color: "text-zinc-400" },
  { value: "medium", label: "Medium", color: "text-amber-400" },
  { value: "high", label: "High", color: "text-rose-400" },
];

export default function Wishlist({ userId }: { userId: string }) {
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newWish, setNewWish] = useState({ title: "", description: "", priority: "medium" as "low" | "medium" | "high", category: "Travel", targetDate: "" });

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, "users", userId, "wishlist")), (snap) => {
      setWishes(snap.docs.map(d => ({ id: d.id, ...d.data() } as Wish)));
    });
    return () => unsub();
  }, [userId]);

  const addWish = async () => {
    if (!newWish.title.trim()) return;
    await addDoc(collection(db, "users", userId, "wishlist"), {
      title: newWish.title,
      description: newWish.description,
      priority: newWish.priority,
      category: newWish.category,
      targetDate: newWish.targetDate,
      achieved: false,
      createdAt: new Date(),
    });
    setNewWish({ title: "", description: "", priority: "medium", category: "Travel", targetDate: "" });
    setShowForm(false);
  };

  const toggleAchieved = async (wish: Wish) => {
    await updateDoc(doc(db, "users", userId, "wishlist", wish.id), { achieved: !wish.achieved });
  };

  const deleteWish = async (id: string) => {
    await deleteDoc(doc(db, "users", userId, "wishlist", id));
  };

  const achievedCount = wishes.filter(w => w.achieved).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-zinc-500">{achievedCount}/{wishes.length} dreams achieved</p>
          <div className="w-32 h-1.5 bg-white/5 rounded-full mt-1">
            <div className="h-1.5 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 transition-all"
              style={{ width: `${wishes.length > 0 ? (achievedCount / wishes.length) * 100 : 0}%` }} />
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setShowForm(true)} className="glass-button text-zinc-300 hover:text-white">
          <Plus className="h-4 w-4 mr-1" /> New Dream
        </Button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="glass-panel rounded-xl p-4 space-y-3 overflow-hidden">
            <Input placeholder="What's your dream?" value={newWish.title} onChange={(e) => setNewWish({ ...newWish, title: e.target.value })}
              className="bg-white/5 border-white/10 text-zinc-100" autoFocus />
            <Textarea placeholder="Describe it..." value={newWish.description} onChange={(e) => setNewWish({ ...newWish, description: e.target.value })}
              className="bg-white/5 border-white/10 text-zinc-100 min-h-[60px]" />
            <div className="flex gap-2">
              <Select value={newWish.priority} onValueChange={(v) => v && setNewWish({ ...newWish, priority: v as "low" | "medium" | "high" })}>
                <SelectTrigger className="flex-1 bg-white/5 border-white/10 text-zinc-100"><SelectValue /></SelectTrigger>
                <SelectContent className="glass-panel border-white/20 bg-zinc-950/90">
                  {PRIORITIES.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={newWish.category} onValueChange={(v) => v && setNewWish({ ...newWish, category: v })}>
                <SelectTrigger className="flex-1 bg-white/5 border-white/10 text-zinc-100"><SelectValue /></SelectTrigger>
                <SelectContent className="glass-panel border-white/20 bg-zinc-950/90">
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input type="date" value={newWish.targetDate} onChange={(e) => setNewWish({ ...newWish, targetDate: e.target.value })}
                className="flex-1 bg-white/5 border-white/10 text-zinc-100" />
            </div>
            <div className="flex gap-2">
              <Button onClick={addWish} className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white">Add Dream</Button>
              <Button variant="outline" onClick={() => setShowForm(false)} className="border-white/10 text-zinc-400">Cancel</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <AnimatePresence>
          {wishes.map((wish) => (
            <motion.div key={wish.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className={`glass-panel rounded-xl p-4 transition-all ${wish.achieved ? "opacity-60" : ""}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <button onClick={() => toggleAchieved(wish)}
                    className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${wish.achieved ? "bg-emerald-500 border-emerald-500" : "border-white/20 hover:border-white/40"}`}>
                    {wish.achieved && <CheckCircle className="h-4 w-4 text-white" />}
                  </button>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className={`font-medium ${wish.achieved ? "text-zinc-500 line-through" : "text-zinc-100"}`}>{wish.title}</h3>
                      {PRIORITIES.map(p => p.value === wish.priority && (
                        <span key={p.value} className={`text-xs ${p.color}`}>{p.label}</span>
                      ))}
                      <span className="text-xs px-1.5 py-0.5 rounded bg-white/5 text-zinc-500">{wish.category}</span>
                    </div>
                    {wish.description && <p className="text-xs text-zinc-500 mt-1">{wish.description}</p>}
                    {wish.targetDate && <p className="text-xs text-zinc-500 mt-1">Target: {wish.targetDate}</p>}
                  </div>
                </div>
                <button onClick={() => deleteWish(wish.id)} className="text-zinc-500 hover:text-red-400 ml-2">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      {wishes.length === 0 && (
        <div className="text-center py-12 glass-panel rounded-xl">
          <Sparkles className="h-8 w-8 mx-auto text-zinc-500 mb-2" />
          <p className="text-zinc-500">No dreams yet. What do you want to achieve?</p>
        </div>
      )}
    </div>
  );
}