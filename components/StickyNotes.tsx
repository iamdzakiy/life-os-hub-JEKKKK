"use client";
import { useState, useEffect } from "react";
import { collection, addDoc, updateDoc, doc, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";

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
    const noteRef = doc(db, "users", userId, "notes", note.id);
    if (note.completed) {
      await updateDoc(noteRef, { completed: false });
    } else {
      // When marking complete, archive after delay
      setTimeout(async () => {
        await updateDoc(noteRef, { completed: true, archivedAt: new Date() });
      }, 1000);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Quick note..."
          className="bg-zinc-800 border-zinc-700 text-zinc-100"
          onKeyDown={(e) => e.key === "Enter" && addNote()}
        />
        <Button onClick={addNote} size="sm" className="bg-blue-600 hover:bg-blue-700">
          Add
        </Button>
      </div>
      
      <div className="max-h-64 overflow-y-auto pr-2 space-y-2">
        {notes.map((note) => (
          <div key={note.id} className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50 transition-all hover:border-zinc-600">
            <Checkbox 
              checked={note.completed} 
              onCheckedChange={() => toggleNote(note)}
              className="border-zinc-500"
            />
            <span className="flex-1 text-zinc-100 text-sm">{note.content}</span>
            <span className="text-xs text-zinc-500">
              {format(new Date(note.createdAt), "HH:mm")}
            </span>
          </div>
        ))}
      </div>
      
      {notes.length === 0 && (
        <p className="text-zinc-500 text-sm text-center py-4">No notes yet. Add a quick thought above!</p>
      )}
    </div>
  );
}