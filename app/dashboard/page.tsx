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
        <div className="fixed inset-0 -z-10 gradient-mesh" />
<div className="fixed top-1/4 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-[floatOrb_8s_ease-in-out_infinite]" />
<div className="fixed bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-[floatOrb_12s_ease-in-out_infinite_reverse]" />
<div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-3xl animate-pulse" />
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
            <Tabs defaultValue="dashboard" className="space-y-6">
              <TabsList className="glass-card p-1 rounded-xl">
                <TabsTrigger value="dashboard" className="data-[state=active]:bg-white/10">
                  <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                </TabsTrigger>
                <TabsTrigger value="tasks" className="data-[state=active]:bg-white/10">
                  <CheckSquare className="mr-2 h-4 w-4" /> Tasks
                </TabsTrigger>
                <TabsTrigger value="habits" className="data-[state=active]:bg-white/10">
                  <BarChart3 className="mr-2 h-4 w-4" /> Habits
                </TabsTrigger>
                <TabsTrigger value="finance" className="data-[state=active]:bg-white/10">
                  <Wallet className="mr-2 h-4 w-4" /> Finance
                </TabsTrigger>
                <TabsTrigger value="agenda" className="data-[state=active]:bg-white/10">
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