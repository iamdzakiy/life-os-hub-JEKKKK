"use client";
import { useState, useMemo, Suspense } from "react";
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
import Wishlist from "@/components/wishlist/Wishlist";
import MediaList from "@/components/media/MediaList";
import DayPlanner from "@/components/DayPlanner";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, LayoutDashboard, CheckSquare, Sprout, Wallet, Sun, Heart, BookOpen, StickyNote } from "lucide-react";

const userId = "Jek";

function DashboardContent() {
  const searchParams = useSearchParams();
  
  const activeTab = useMemo(() => {
    return searchParams.get("tab") || "dashboard";
  }, [searchParams]);
  
  const [collapsed, setCollapsed] = useState(false);

  const tabStyles = (tab: string) => 
    `data-[state=active]:bg-white/10 data-[state=active]:text-white text-zinc-400 text-xs px-2.5 py-1.5`;

  return (
    <>
      <Sidebar collapsed={collapsed} onCollapse={setCollapsed} />

      <main className={`min-h-screen p-4 md:p-6 transition-all duration-300 ease-in-out ${
        collapsed ? "ml-16" : "ml-56"
      }`}>
        <div className="fixed inset-0 -z-10 gradient-mesh" />
        <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] animate-[floatOrb_15s_ease-in-out_infinite]" />
        <div className="fixed bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-[100px] animate-[floatOrb_20s_ease-in-out_infinite_reverse]" />

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight gradient-text">
                {activeTab === "dashboard" && "Command Center"}
                {activeTab === "today" && "Today's Plan"}
                {activeTab === "tasks" && "Task Tracker"}
                {activeTab === "habits" && "Habit Builder"}
                {activeTab === "finance" && "Wealth Dashboard"}
                {activeTab === "agenda" && "Agenda"}
                {activeTab === "dreams" && "Dreams & Wishlist"}
                {activeTab === "media" && "Media Tracker"}
                {activeTab === "notes" && "Quick Notes"}
              </h1>
              <p className="text-zinc-500 text-xs">
                {activeTab === "dashboard" && "Your daily overview at a glance"}
                {activeTab === "today" && "Plan your day and set your focus"}
                {activeTab === "tasks" && "Manage your tasks and projects"}
                {activeTab === "habits" && "Build consistency, one day at a time"}
                {activeTab === "finance" && "Track your wealth and financial goals"}
                {activeTab === "agenda" && "Events, calendar & schedule"}
                {activeTab === "dreams" && "Your dreams, goals & aspirations"}
                {activeTab === "media" && "Books, movies, podcasts to explore"}
                {activeTab === "notes" && "Quick thoughts and sticky notes"}
              </p>
            </div>
          </div>

          {/* Stats Grid - only on dashboard */}
          {activeTab === "dashboard" && <StatsGrid userId={userId} />}

          {/* Tab Content */}
          <Tabs value={activeTab} onValueChange={(value) => {
            const url = value === "dashboard" ? "/dashboard" : `/dashboard?tab=${value}`;
            window.history.pushState({}, "", url);
          }} className="space-y-4">
            <TabsList className="glass-panel p-1 rounded-xl w-full overflow-x-auto flex-nowrap gap-1">
              <TabsTrigger value="dashboard" className={tabStyles("dashboard")}>
                <LayoutDashboard className="mr-1.5 h-3.5 w-3.5" /> Overview
              </TabsTrigger>
              <TabsTrigger value="today" className={tabStyles("today")}>
                <Sun className="mr-1.5 h-3.5 w-3.5" /> Today
              </TabsTrigger>
              <TabsTrigger value="tasks" className={tabStyles("tasks")}>
                <CheckSquare className="mr-1.5 h-3.5 w-3.5" /> Tasks
              </TabsTrigger>
              <TabsTrigger value="habits" className={tabStyles("habits")}>
                <Sprout className="mr-1.5 h-3.5 w-3.5" /> Habits
              </TabsTrigger>
              <TabsTrigger value="finance" className={tabStyles("finance")}>
                <Wallet className="mr-1.5 h-3.5 w-3.5" /> Finance
              </TabsTrigger>
              <TabsTrigger value="agenda" className={tabStyles("agenda")}>
                <Calendar className="mr-1.5 h-3.5 w-3.5" /> Agenda
              </TabsTrigger>
              <TabsTrigger value="dreams" className={tabStyles("dreams")}>
                <Heart className="mr-1.5 h-3.5 w-3.5" /> Dreams
              </TabsTrigger>
              <TabsTrigger value="media" className={tabStyles("media")}>
                <BookOpen className="mr-1.5 h-3.5 w-3.5" /> Media
              </TabsTrigger>
              <TabsTrigger value="notes" className={tabStyles("notes")}>
                <StickyNote className="mr-1.5 h-3.5 w-3.5" /> Notes
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="glass-panel rounded-2xl p-4 border border-white/5">
                  <h2 className="text-xs font-medium text-zinc-400 mb-3 flex items-center gap-2">
                    <Sprout className="h-3.5 w-3.5 text-emerald-400" /> Today&#39;s Habits
                  </h2>
                  <HabitTracker userId={userId} />
                </div>
                <div className="glass-panel rounded-2xl p-4 border border-white/5">
                  <h2 className="text-xs font-medium text-zinc-400 mb-3 flex items-center gap-2">
                    <CheckSquare className="h-3.5 w-3.5 text-cyan-400" /> Quick Notes
                  </h2>
                  <StickyNotes userId={userId} />
                </div>
              </div>
              <div className="glass-panel rounded-2xl p-4 border border-white/5">
                <h2 className="text-xs font-medium text-zinc-400 mb-3 flex items-center gap-2">
                  <CheckSquare className="h-3.5 w-3.5 text-cyan-400" /> Today&#39;s Plan
                </h2>
                <DayPlanner userId={userId} />
              </div>
              <div className="glass-panel rounded-2xl p-4 border border-white/5">
                <h2 className="text-xs font-medium text-zinc-400 mb-3 flex items-center gap-2">
                  <CheckSquare className="h-3.5 w-3.5 text-cyan-400" /> Recent Tasks
                </h2>
                <TaskTracker userId={userId} />
              </div>
            </TabsContent>

            <TabsContent value="today">
              <div className="glass-panel rounded-2xl p-4 border border-white/5">
                <DayPlanner userId={userId} />
              </div>
            </TabsContent>

            <TabsContent value="tasks">
              <div className="glass-panel rounded-2xl p-4 border border-white/5">
                <TaskTracker userId={userId} />
              </div>
            </TabsContent>

            <TabsContent value="habits">
              <div className="glass-panel rounded-2xl p-4 border border-white/5">
                <HabitTracker userId={userId} />
              </div>
            </TabsContent>

            <TabsContent value="finance">
              <div className="glass-panel rounded-2xl p-4 border border-white/5">
                <FinanceTracker userId={userId} />
              </div>
            </TabsContent>

            <TabsContent value="agenda">
              <div className="glass-panel rounded-2xl p-4 border border-white/5">
                <AgendaTracker userId={userId} />
              </div>
            </TabsContent>

            <TabsContent value="dreams">
              <div className="glass-panel rounded-2xl p-4 border border-white/5">
                <Wishlist userId={userId} />
              </div>
            </TabsContent>

            <TabsContent value="media">
              <div className="glass-panel rounded-2xl p-4 border border-white/5">
                <MediaList userId={userId} />
              </div>
            </TabsContent>

            <TabsContent value="notes">
              <div className="glass-panel rounded-2xl p-4 border border-white/5">
                <StickyNotes userId={userId} />
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>

      <QuickAdd userId={userId} />
      <MorningPopup userId={userId} />
    </>
  );
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-zinc-950 text-zinc-100">
        <Suspense fallback={<div className="min-h-screen bg-zinc-950" />}>
          <DashboardContent />
        </Suspense>
      </div>
    </AuthGuard>
  );
}