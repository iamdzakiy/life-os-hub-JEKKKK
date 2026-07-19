"use client";

import AuthGuard, { signOut } from "@/components/AuthGuard";
import MorningPopup from "@/components/MorningPopup";
import StickyNotes from "@/components/StickyNotes";
import TaskTracker from "@/components/TaskTracker";
import HabitTracker from "@/components/HabitTracker";
import FinanceTracker from "@/components/FinanceTracker";
import AgendaTracker from "@/components/AgendaTracker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutDashboard, CheckSquare, Wallet, Calendar, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";

export default function DashboardPage() {
  // For hardcoded auth, userId is always "Jek"
  const userId = "Jek";

  return (
    <AuthGuard>
      <div className="relative min-h-screen bg-zinc-950 text-zinc-100 overflow-hidden">
        {/* Ambient Glow Backdrops */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-cyan-500/20 rounded-full blur-3xl opacity-70 animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl opacity-60"></div>
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-indigo-500/15 rounded-full blur-3xl"></div>

        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative p-6 md:p-10 flex items-center justify-between border-b border-white/5 backdrop-blur-sm"
        >
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Life OS Hub
            </h1>
            <p className="text-zinc-400">Welcome back, {userId}.</p>
          </div>
          <button 
            onClick={signOut}
            className="text-zinc-400 hover:text-zinc-100 transition-colors px-4 py-2 rounded-lg hover:bg-white/5"
          >
            Sign Out
          </button>
        </motion.header>

        <main className="relative p-6 md:p-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Tabs defaultValue="command" className="space-y-6">
              <TabsList className="bg-white/5 backdrop-blur-md border border-white/10 p-1 rounded-xl">
                <TabsTrigger value="command" className="data-[state=active]:bg-white/10 data-[state=active]:backdrop-blur-md">
                  <LayoutDashboard className="mr-2 h-4 w-4" /> Command Center
                </TabsTrigger>
                <TabsTrigger value="tasks" className="data-[state=active]:bg-white/10 data-[state=active]:backdrop-blur-md">
                  <CheckSquare className="mr-2 h-4 w-4" /> Task Tracker
                </TabsTrigger>
                <TabsTrigger value="habits" className="data-[state=active]:bg-white/10 data-[state=active]:backdrop-blur-md">
                  <BarChart3 className="mr-2 h-4 w-4" /> Habit Tracker
                </TabsTrigger>
                <TabsTrigger value="finance" className="data-[state=active]:bg-white/10 data-[state=active]:backdrop-blur-md">
                  <Wallet className="mr-2 h-4 w-4" /> Finance
                </TabsTrigger>
                <TabsTrigger value="agenda" className="data-[state=active]:bg-white/10 data-[state=active]:backdrop-blur-md">
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
          </motion.div>
        </main>
      </div>
      
      <MorningPopup userId={userId} />
    </AuthGuard>
  );
}