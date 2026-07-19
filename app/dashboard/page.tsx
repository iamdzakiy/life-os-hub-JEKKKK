// app/dashboard/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import Sidebar from "@/components/layout/Sidebar";
import QuickAdd from "@/components/dashboard/QuickAdd";
import StatsGrid from "@/components/dashboard/StatsGrid";
import HabitTracker from "@/components/HabitTracker";
import TaskTracker from "@/components/TaskTracker";
import FinanceTracker from "@/components/FinanceTracker";
import AgendaTracker from "@/components/AgendaTracker";
import StickyNotes from "@/components/StickyNotes";
import MorningPopup from "@/components/MorningPopup";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, LayoutDashboard, CheckSquare, Sprout, Wallet } from "lucide-react";

const userId = "Jek";

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(
    searchParams.get("tab") || "dashboard"
  );

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-zinc-950 text-zinc-100">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <main className="ml-64 min-h-screen p-6 md:p-8">
          {/* Ambient Glow */}
          <div className="fixed inset-0 -z-10 gradient-mesh" />
          <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] animate-[floatOrb_15s_ease-in-out_infinite]" />
          <div className="fixed bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-[100px] animate-[floatOrb_20s_ease-in-out_infinite_reverse]" />

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight gradient-text">
                  {activeTab === "dashboard" && "Command Center"}
                  {activeTab === "tasks" && "Task Tracker"}
                  {activeTab === "habits" && "Habit Builder"}
                  {activeTab === "finance" && "Wealth Dashboard"}
                  {activeTab === "agenda" && "Agenda"}
                </h1>
                <p className="text-zinc-500 text-sm">
                  {activeTab === "dashboard" && "Your daily overview at a glance"}
                  {activeTab === "tasks" && `${12} tasks remaining · ${3} overdue`}
                  {activeTab === "habits" && "7-day streak · 80% completion rate"}
                  {activeTab === "finance" && "Net worth: Rp 12.4M · +5% this month"}
                  {activeTab === "agenda" && "3 events today · 2 upcoming"}
                </p>
              </div>
            </div>

            {/* Stats Grid - only on dashboard */}
            {activeTab === "dashboard" && <StatsGrid userId={userId} />}

            {/* Tab Content */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="glass-panel p-1 rounded-xl w-full md:w-auto grid grid-cols-5 gap-1">
                <TabsTrigger value="dashboard" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-zinc-400">
                  <LayoutDashboard className="mr-2 h-4 w-4" /> Overview
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
                  <div className="glass-panel rounded-2xl p-6 border border-white/5">
                    <h2 className="text-sm font-medium text-zinc-400 mb-4 flex items-center gap-2">
                      <Sprout className="h-4 w-4 text-emerald-400" /> Today's Habits
                    </h2>
                    <HabitTracker userId={userId} />
                  </div>
                  <div className="glass-panel rounded-2xl p-6 border border-white/5">
                    <h2 className="text-sm font-medium text-zinc-400 mb-4 flex items-center gap-2">
                      <CheckSquare className="h-4 w-4 text-cyan-400" /> Quick Notes
                    </h2>
                    <StickyNotes userId={userId} />
                  </div>
                </div>
                <div className="glass-panel rounded-2xl p-6 border border-white/5">
                  <h2 className="text-sm font-medium text-zinc-400 mb-4 flex items-center gap-2">
                    <CheckSquare className="h-4 w-4 text-cyan-400" /> Recent Tasks
                  </h2>
                  <TaskTracker userId={userId} />
                </div>
              </TabsContent>

              <TabsContent value="tasks">
                <div className="glass-panel rounded-2xl p-6 border border-white/5">
                  <TaskTracker userId={userId} />
                </div>
              </TabsContent>

              <TabsContent value="habits">
                <div className="glass-panel rounded-2xl p-6 border border-white/5">
                  <HabitTracker userId={userId} />
                </div>
              </TabsContent>

              <TabsContent value="finance">
                <div className="glass-panel rounded-2xl p-6 border border-white/5">
                  <FinanceTracker userId={userId} />
                </div>
              </TabsContent>

              <TabsContent value="agenda">
                <div className="glass-panel rounded-2xl p-6 border border-white/5">
                  <AgendaTracker />
                </div>
              </TabsContent>
            </Tabs>
          </motion.div>
        </main>

        {/* Quick Add FAB */}
        <QuickAdd userId={userId} />
        <MorningPopup userId={userId} />
      </div>
    </AuthGuard>
  );
}