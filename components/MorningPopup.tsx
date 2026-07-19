"use client";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Smile, Meh, Frown } from "lucide-react";

const AFFIRMATIONS = [
  "Fokus pada progres, bukan kesempurnaan.",
  "Kekayaan dimulai dari pikiran yang tenang dan terencana.",
  "Hari ini adalah kesempatan baru untuk bertumbuh.",
];

export default function MorningPopup({ userId }: { userId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mood, setMood] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [affirmation, setAffirmation] = useState("");

  useEffect(() => {
    const checkRoutine = async () => {
      const today = new Date().toISOString().split("T")[0];
      const docRef = doc(db, "users", userId, "affirmations_moods", today);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        setAffirmation(AFFIRMATIONS[Math.floor(Math.random() * AFFIRMATIONS.length)]);
        setIsOpen(true);
      }
    };
    checkRoutine();
  }, [userId]);

  const handleSave = async () => {
    const today = new Date().toISOString().split("T")[0];
    await setDoc(doc(db, "users", userId, "affirmations_moods", today), {
      date: today, mood, note, affirmation, timestamp: new Date(),
    });
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="bg-zinc-900 text-zinc-100 border-zinc-800 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-center">Selamat Pagi! 🌅</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="text-center p-4 bg-zinc-800 rounded-lg border border-zinc-700">
            <p className="text-zinc-300 italic">"{affirmation}"</p>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400">Bagaimana perasaanmu?</label>
            <div className="flex justify-center gap-4">
              <Button variant={mood === "good" ? "default" : "outline"} onClick={() => setMood("good")} className="bg-zinc-800 hover:bg-zinc-700 border-zinc-700"><Smile className="h-5 w-5" /></Button>
              <Button variant={mood === "neutral" ? "default" : "outline"} onClick={() => setMood("neutral")} className="bg-zinc-800 hover:bg-zinc-700 border-zinc-700"><Meh className="h-5 w-5" /></Button>
              <Button variant={mood === "bad" ? "default" : "outline"} onClick={() => setMood("bad")} className="bg-zinc-800 hover:bg-zinc-700 border-zinc-700"><Frown className="h-5 w-5" /></Button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400">Fokus utama hari ini:</label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Tulis di sini..." className="bg-zinc-800 border-zinc-700 text-zinc-100 focus-visible:ring-blue-600" />
          </div>

          <Button onClick={handleSave} className="w-full bg-blue-600 hover:bg-blue-700 text-white">Mulai Hari Ini</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}