"use client";
import AuthGuard, { signOut } from "@/components/AuthGuard";
import MorningPopup from "@/components/MorningPopup";
import StickyNotes from "@/components/StickyNotes";
import TaskTracker from "@/components/TaskTracker";
import HabitTracker from "@/components/HabitTracker";
import FinanceTracker from "@/components/FinanceTracker";
import AgendaTracker from "@/components/AgendaTracker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutDashboard, CheckSquare, Wallet, Calendar, Sprout, LogOut } from "lucide-react";
import { motion } from "framer-motion";

export default function DashboardPage() {
  const userId = "Jek";

  return (
    <AuthGuard>
      <div className="relative min-h-screen bg-zinc-950 text-zinc-100 overflow-hidden font-sans">
        {/* Ambient Glow Backdrops */}
        <div className="fixed inset-0 -z-10 gradient-mesh" />
        <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] animate-[floatOrb_15s_ease-in-out_infinite]" />
        <div className="fixed bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-[100px] animate-[floatOrb_20s_ease-in-out_infinite_reverse]" />
        
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="sticky top-0 z-50 p-4 md:p-6 flex items-center justify-between border-b border-white/5 bg-zinc-950/50 backdrop-blur-xl"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <LayoutDashboard className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight gradient-text">Life OS Hub</h1>
              <p className="text-zinc-500 text-xs">Welcome back, {userId}</p>
            </div>
          </div>
          <button 
            onClick={signOut}
            className="flex items-center gap-2 text-zinc-400 hover:text-zinc-100 transition-colors px-4 py-2 rounded-lg glass-button"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </motion.header>

        <main className="relative p-4 md:p-8 max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Tabs defaultValue="dashboard" className="space-y-6">
              <TabsList className="glass-panel p-1 rounded-xl w-full md:w-auto grid grid-cols-3 md:grid-cols-5 gap-1">
                <TabsTrigger value="dashboard" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-zinc-400">
                  <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                </TabsTrigger>
                <TabsTrigger value="tasks" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-zinc-400">
                  <CheckSquare className="mr-2 h-4 w-4" /> Tasks
                </TabsTrigger>
                <TabsTrigger value="habits" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-zinc-400">
                  <Sprout className="mr-2 h-4 w-4" /> Habits
                </TabsTrigger>
                <TabsTrigger value="finance" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-zinc-400">
                  <Wallet className="mr-2 h-4 w-4" /> Finance
                </TabsTrigger>
                <TabsTrigger value="agenda" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-zinc-400">
                  <Calendar className="mr-2 h-4 w-4" /> Agenda
                </TabsTrigger>
              </TabsList>

              <TabsContent value="dashboard" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="glass-panel rounded-xl p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Sprout className="h-5 w-5 text-emerald-400" /> Quick Habits
                    </h2>
                    <HabitTracker userId={userId} />
                  </div>
                  <div className="glass-panel rounded-xl p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <CheckSquare className="h-5 w-5 text-cyan-400" /> Quick Notes & Tasks
                    </h2>
                    <StickyNotes userId={userId} />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="tasks">
                <div className="glass-panel rounded-xl p-6">
                  <TaskTracker userId={userId} />
                </div>
              </TabsContent>

              <TabsContent value="habits">
                <div className="glass-panel rounded-xl p-6">
                  <HabitTracker userId={userId} />
                </div>
              </TabsContent>

              <TabsContent value="finance">
                <div className="glass-panel rounded-xl p-6">
                  <FinanceTracker userId={userId} />
                </div>
              </TabsContent>

              <TabsContent value="agenda">
                <div className="glass-panel rounded-xl p-6">
                  <AgendaTracker />
                </div>
              </TabsContent>
            </Tabs>
          </motion.div>
        </main>
        <MorningPopup userId={userId} />
      </div>
    </AuthGuard>
  );
}