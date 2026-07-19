"use client";
import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import AuthGuard from "@/components/AuthGuard";
import MorningPopup from "@/components/MorningPopup";
import StickyNotes from "@/components/StickyNotes";
import TaskTracker from "@/components/TaskTracker";
import HabitTracker from "@/components/HabitTracker";
import FinanceTracker from "@/components/FinanceTracker";
import AgendaTracker from "@/components/AgendaTracker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutDashboard, CheckSquare, Wallet, Calendar, BarChart3 } from "lucide-react";
import { signOut } from "firebase/auth";

export default function DashboardPage() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) setUserId(user.uid);
    });
    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await signOut(auth);
  };

  if (!userId) return null;

  return (
    <AuthGuard>
      <div className="min-h-screen bg-zinc-950 text-zinc-100">
        <MorningPopup userId={userId} />
        
        <header className="p-6 md:p-10 flex items-center justify-between border-b border-zinc-800">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Life OS Hub</h1>
            <p className="text-zinc-400">Welcome back, Owner.</p>
          </div>
          <button 
            onClick={handleSignOut}
            className="text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            Sign Out
          </button>
        </header>

        <main className="p-6 md:p-10">
          <Tabs defaultValue="command" className="space-y-6">
            <TabsList className="bg-zinc-900 border border-zinc-800 p-1">
              <TabsTrigger value="command" className="data-[state=active]:bg-zinc-800">
                <LayoutDashboard className="mr-2 h-4 w-4" /> Command Center
              </TabsTrigger>
              <TabsTrigger value="tasks" className="data-[state=active]:bg-zinc-800">
                <CheckSquare className="mr-2 h-4 w-4" /> Task Tracker
              </TabsTrigger>
              <TabsTrigger value="habits" className="data-[state=active]:bg-zinc-800">
                <BarChart3 className="mr-2 h-4 w-4" /> Habit Tracker
              </TabsTrigger>
              <TabsTrigger value="finance" className="data-[state=active]:bg-zinc-800">
                <Wallet className="mr-2 h-4 w-4" /> Finance
              </TabsTrigger>
              <TabsTrigger value="agenda" className="data-[state=active]:bg-zinc-800">
                <Calendar className="mr-2 h-4 w-4" /> Agenda
              </TabsTrigger>
            </TabsList>

            <TabsContent value="command" className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <StickyNotes userId={userId} />
              <HabitTracker userId={userId} />
            </TabsContent>

            <TabsContent value="tasks">
              <TaskTracker userId={userId} />
            </TabsContent>

            <TabsContent value="habits">
              <HabitTracker userId={userId} />
            </TabsContent>

            <TabsContent value="finance">
              <FinanceTracker userId={userId} />
            </TabsContent>
            
            <TabsContent value="agenda">
              <AgendaTracker />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </AuthGuard>
  );
}