"use client";
import { useState, useEffect } from "react";
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

interface Note {
  id: string;
  content: string;
  completed: boolean;
  createdAt: Date;
}

export default function StickyNotes({ userId }: { userId: string }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState("");

  useEffect(() => {
    const q = query(collection(db, "users", userId, "notes"), where("completed", "==", false));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setNotes(snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Note)));
    });
    return () => unsubscribe();
  }, [userId]);

  const addNote = async () => {
    if (!newNote.trim()) return;
    await addDoc(collection(db, "users", userId, "notes"), {
      content: newNote,
      completed: false,
      createdAt: new Date(),
    });
    setNewNote("");
  };

  const toggleNote = async (note: Note) => {
    // When marking complete, delete the note (archive it)
    await deleteDoc(doc(db, "users", userId, "notes", note.id));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex gap-2">
        <Input
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Quick note..."
          className="bg-white/5 backdrop-blur-md border border-white/10 text-zinc-100 placeholder:text-zinc-400 focus:border-cyan-500/50"
          onKeyDown={(e) => e.key === "Enter" && addNote()}
        />
        <Button onClick={addNote} size="sm" className="bg-gradient-to-r from-emerald-400 to-teal-600 text-white hover:opacity-90">
          Add
        </Button>
      </div>
      
      <div className="max-h-64 overflow-y-auto pr-2 space-y-2">
        <AnimatePresence>
          {notes.map((note) => (
            <motion.div
              key={note.id}
              initial={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100, transition: { duration: 0.3 } }}
              layout
              className="flex items-center gap-3 p-3 bg-white/5 backdrop-blur-md rounded-lg border border-white/10 transition-all hover:border-white/20"
            >
              <Checkbox 
                checked={note.completed} 
                onCheckedChange={() => toggleNote(note)}
                className="border-white/30"
              />
              <span className="flex-1 text-zinc-100 text-sm">{note.content}</span>
              <span className="text-xs text-zinc-400">
                {format(new Date(note.createdAt), "HH:mm")}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      
      {notes.length === 0 && (
        <p className="text-zinc-500 text-sm text-center py-4">No notes yet. Add a quick thought above!</p>
      )}
    </motion.div>
  );
}