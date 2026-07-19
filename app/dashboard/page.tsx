"use client";
import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import AuthGuard from "@/components/AuthGuard";
import MorningPopup from "@/components/MorningPopup";
import TaskTracker from "@/components/TaskTracker";
import FinanceTracker from "@/components/FinanceTracker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutDashboard, CheckSquare, Wallet, Calendar } from "lucide-react";

export default function DashboardPage() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) setUserId(user.uid);
    });
    return () => unsubscribe();
  }, []);

  if (!userId) return null;

  return (
    <AuthGuard>
      <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 md:p-10">
        <MorningPopup userId={userId} />
        
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Life OS Hub</h1>
            <p className="text-zinc-400">Selamat datang kembali, Owner.</p>
          </div>
        </header>

        <Tabs defaultValue="command" className="space-y-6">
          <TabsList className="bg-zinc-900 border border-zinc-800 p-1">
            <TabsTrigger value="command" className="data-[state=active]:bg-zinc-800"><LayoutDashboard className="mr-2 h-4 w-4" /> Command Center</TabsTrigger>
            <TabsTrigger value="tasks" className="data-[state=active]:bg-zinc-800"><CheckSquare className="mr-2 h-4 w-4" /> Task Tracker</TabsTrigger>
            <TabsTrigger value="finance" className="data-[state=active]:bg-zinc-800"><Wallet className="mr-2 h-4 w-4" /> Keuangan</TabsTrigger>
            <TabsTrigger value="agenda" className="data-[state=active]:bg-zinc-800"><Calendar className="mr-2 h-4 w-4" /> Agenda</TabsTrigger>
          </TabsList>

          <TabsContent value="command" className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4">Short Important Notes</h2>
              {/* Implementasi widget catatan cepat mirip TaskTracker tapi lebih sederhana */}
              <p className="text-zinc-500 text-sm">Widget catatan cepat akan muncul di sini.</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4">Ringkasan Habit Hari Ini</h2>
              <p className="text-zinc-500 text-sm">Integrasi Habit Tracker Grid akan muncul di sini.</p>
            </div>
          </TabsContent>

          <TabsContent value="tasks">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <TaskTracker userId={userId} />
            </div>
          </TabsContent>

          <TabsContent value="finance">
            <FinanceTracker userId={userId} />
          </TabsContent>
          
          <TabsContent value="agenda">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4">Google Calendar Sync</h2>
              <p className="text-zinc-400">Komponen Kalender Interaktif (menggunakan library seperti `react-big-calendar` atau `@fullcalendar/react`) yang terhubung ke API Route `/api/google/calendar`.</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AuthGuard>
  );
}