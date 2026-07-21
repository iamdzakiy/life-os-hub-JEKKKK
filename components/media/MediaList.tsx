"use client";
import { useState, useEffect } from "react";
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion, AnimatePresence } from "framer-motion";
import { Book, Film, Headphones, Plus, Trash2, Star, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

interface MediaItem {
  id: string;
  title: string;
  creator: string;
  type: "book" | "movie" | "podcast" | "music";
  status: "want" | "in-progress" | "done";
  rating: number;
  notes: string;
  createdAt: Date;
}

const ALL_TYPES = [
  { value: "all", label: "All", icon: null, color: "" },
  { value: "book", label: "Book", icon: Book, color: "from-amber-400 to-orange-500" },
  { value: "movie", label: "Movie/Series", icon: Film, color: "from-rose-400 to-pink-500" },
  { value: "podcast", label: "Podcast", icon: Headphones, color: "from-purple-400 to-indigo-500" },
];

export default function MediaList({ userId }: { userId: string }) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [activeType, setActiveType] = useState<"book" | "movie" | "podcast" | "all">("all");
  const [showForm, setShowForm] = useState(false);
  const [newItem, setNewItem] = useState({ title: "", creator: "", type: "book" as "book" | "movie" | "podcast", status: "want" as "want" | "in-progress" | "done", notes: "" });

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, "users", userId, "media_list")), (snap) => {
      setItems(snap.docs.map(d => ({ id: d.id, ...d.data() } as MediaItem)));
    });
    return () => unsub();
  }, [userId]);

  const addItem = async () => {
    if (!newItem.title.trim()) return;
    await addDoc(collection(db, "users", userId, "media_list"), {
      title: newItem.title,
      creator: newItem.creator,
      type: newItem.type,
      status: "want",
      rating: 0,
      notes: newItem.notes,
      createdAt: new Date(),
    });
    setNewItem({ title: "", creator: "", type: "book", status: "want", notes: "" });
    setShowForm(false);
  };

  const updateStatus = async (item: MediaItem, status: "want" | "in-progress" | "done") => {
    await updateDoc(doc(db, "users", userId, "media_list", item.id), { status });
  };

  const updateRating = async (item: MediaItem, rating: number) => {
    await updateDoc(doc(db, "users", userId, "media_list", item.id), { rating });
  };

  const deleteItem = async (id: string) => {
    await deleteDoc(doc(db, "users", userId, "media_list", id));
  };

  const filteredItems = activeType === "all" ? items : items.filter(i => i.type === activeType);
  const totalActive = items.filter(i => i.status !== "done").length;

  const getTypeIcon = (type: string) => {
    const t = ALL_TYPES.find(mt => mt.value === type);
    return t?.icon || Book;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-zinc-500">{totalActive} in progress · {items.filter(i => i.status === "done").length} done</p>
        <Button variant="ghost" size="sm" onClick={() => setShowForm(true)} className="glass-button text-zinc-300 hover:text-white">
          <Plus className="h-4 w-4 mr-1" /> Add
        </Button>
      </div>

      {/* Type Filter */}
      <div className="flex gap-1 bg-white/5 rounded-xl p-1">
        {ALL_TYPES.map(t => (
          <button key={t.value} onClick={() => setActiveType(t.value as "book" | "movie" | "podcast" | "all")}
            className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all flex items-center justify-center gap-1.5 ${
              activeType === t.value ? "bg-white/10 text-white" : "text-zinc-400 hover:text-zinc-200"
            }`}>
            {t.icon && <t.icon className="h-3.5 w-3.5" />}
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="glass-panel rounded-xl p-4 space-y-3 overflow-hidden">
            <Input placeholder="Title" value={newItem.title} onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
              className="bg-white/5 border-white/10 text-zinc-100" autoFocus />
            <div className="flex gap-2">
              <Input placeholder="Author/Creator" value={newItem.creator} onChange={(e) => setNewItem({ ...newItem, creator: e.target.value })}
                className="flex-1 bg-white/5 border-white/10 text-zinc-100" />
              <Select value={newItem.type} onValueChange={(v) => v && setNewItem({ ...newItem, type: v as "book" | "movie" | "podcast" })}>
                <SelectTrigger className="w-36 bg-white/5 border-white/10 text-zinc-100"><SelectValue /></SelectTrigger>
                <SelectContent className="glass-panel border-white/20 bg-zinc-950/90">
                  {ALL_TYPES.filter(t => t.value !== "all").map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Textarea placeholder="Notes..." value={newItem.notes} onChange={(e) => setNewItem({ ...newItem, notes: e.target.value })}
              className="bg-white/5 border-white/10 text-zinc-100 min-h-[60px]" />
            <div className="flex gap-2">
              <Button onClick={addItem} className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 text-white">Add</Button>
              <Button variant="outline" onClick={() => setShowForm(false)} className="border-white/10 text-zinc-400">Cancel</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-2">
        <AnimatePresence>
          {filteredItems.map((item) => {
            const Icon = getTypeIcon(item.type);
            const typeMeta = ALL_TYPES.find(t => t.value === item.type);
            return (
              <motion.div key={item.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="glass-panel rounded-xl p-3 group">
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${typeMeta?.color || "from-cyan-400 to-blue-500"} flex items-center justify-center flex-shrink-0`}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium text-zinc-100 truncate">{item.title}</h3>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                        item.status === "done" ? "bg-emerald-500/20 text-emerald-400" :
                        item.status === "in-progress" ? "bg-cyan-500/20 text-cyan-400" :
                        "bg-zinc-500/20 text-zinc-400"
                      }`}>
                        {item.status === "in-progress" ? "Reading/Watching" : item.status}
                      </span>
                    </div>
                    {item.creator && <p className="text-xs text-zinc-500">{item.creator}</p>}
                    
                    {/* Status & Rating controls */}
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button key={star} onClick={() => updateRating(item, star === item.rating ? 0 : star)}
                            className={`${star <= item.rating ? "text-amber-400" : "text-zinc-600"} hover:text-amber-400 transition-all`}>
                            <Star className="h-3.5 w-3.5" fill={star <= item.rating ? "currentColor" : "none"} />
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-1 ml-auto">
                        {item.status !== "done" && (
                          <button onClick={() => updateStatus(item, "done")}
                            className="text-xs text-emerald-400 opacity-0 group-hover:opacity-100 hover:bg-emerald-500/10 px-2 py-0.5 rounded transition-all">
                            Done
                          </button>
                        )}
                        {item.status === "want" && (
                          <button onClick={() => updateStatus(item, "in-progress")}
                            className="text-xs text-cyan-400 opacity-0 group-hover:opacity-100 hover:bg-cyan-500/10 px-2 py-0.5 rounded transition-all">
                            Start
                          </button>
                        )}
                        <button onClick={() => deleteItem(item.id)}
                          className="text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
      {filteredItems.length === 0 && (
        <div className="text-center py-12 glass-panel rounded-xl">
          <Book className="h-8 w-8 mx-auto text-zinc-500 mb-2" />
          <p className="text-zinc-500">Nothing in your list yet.</p>
        </div>
      )}
    </div>
  );
}