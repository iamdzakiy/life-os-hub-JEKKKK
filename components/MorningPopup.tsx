"use client";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Smile, Meh, Frown, CheckCircle2 } from "lucide-react";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const AFFIRMATIONS = [
  "Focus on progress, not perfection.",
  "Wealth begins with calm planning.",
  "Today is a new opportunity to grow.",
  "Your consistency today shapes tomorrow.",
  "One step forward is still progress.",
];

export default function MorningPopup({ userId }: { userId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mood, setMood] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [affirmation, setAffirmation] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const today = new Date().toISOString().split("T")[0];
      
      // Check if morning routine has been done today
      const docRef = doc(db, "users", userId, "affirmations_moods", today);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        setAffirmation(AFFIRMATIONS[Math.floor(Math.random() * AFFIRMATIONS.length)]);
        setIsOpen(true);
      }
    };

    if (userId) {
      fetchData();
    }
  }, [userId]);

  const handleSave = async () => {
    const today = new Date().toISOString().split("T")[0];
    await setDoc(doc(db, "users", userId, "affirmations_moods", today), {
      date: today,
      mood,
      note,
      affirmation,
      timestamp: new Date(),
    });
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="bg-zinc-900 text-zinc-100 border-zinc-800 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-center">Good Morning! 🌅</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {/* Affirmation */}
          <div className="text-center p-4 bg-zinc-800 rounded-lg border border-zinc-700">
            <p className="text-zinc-300 italic">&#34;{affirmation}&#34;</p>
          </div>
          
          {/* Mood Tracker */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400">How are you feeling?</label>
            <div className="flex justify-center gap-4">
              <Button 
                variant={mood === "good" ? "default" : "outline"} 
                onClick={() => setMood("good")} 
                className="bg-zinc-800 hover:bg-zinc-700 border-zinc-700"
              >
                <Smile className="h-5 w-5" />
              </Button>
              <Button 
                variant={mood === "neutral" ? "default" : "outline"} 
                onClick={() => setMood("neutral")} 
                className="bg-zinc-800 hover:bg-zinc-700 border-zinc-700"
              >
                <Meh className="h-5 w-5" />
              </Button>
              <Button 
                variant={mood === "bad" ? "default" : "outline"} 
                onClick={() => setMood("bad")} 
                className="bg-zinc-800 hover:bg-zinc-700 border-zinc-700"
              >
                <Frown className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Focus Note */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400">Main focus today:</label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Write your focus for today..."
              className="bg-zinc-800 border-zinc-700 text-zinc-100 focus-visible:ring-blue-600 min-h-20"
            />
          </div>

          {/* Quick Stats */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400">Today&#39;s Overview:</label>
            <div className="flex gap-2 flex-wrap">
              <Badge variant="secondary" className="bg-zinc-800">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                5 habits due
              </Badge>
              <Badge variant="destructive" className="bg-red-900/50">3 high priority tasks</Badge>
              <Badge variant="secondary" className="bg-zinc-800">2 events today</Badge>
            </div>
          </div>

          <Button onClick={handleSave} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
            Start Today
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}