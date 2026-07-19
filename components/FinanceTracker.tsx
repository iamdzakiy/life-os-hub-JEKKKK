"use client";

import { useState, useEffect } from "react";
import { collection, onSnapshot, addDoc, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion, AnimatePresence } from "framer-motion";
import { format, subDays } from "date-fns";
import {
  TrendingUp, TrendingDown, Wallet, PiggyBank,
  Download, Plus, X, Calendar, Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogClose
} from "@/components/ui/dialog";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  Tooltip, PieChart, Pie, Cell
} from "recharts";

// Types
interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number; // positive = income, negative = expense
  category: string;
  type: "income" | "expense";
  timestamp: Date;
}

interface SavingsTarget {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  icon?: string;
}

const COLORS = ["#00C9A7", "#9B5DE5", "#F15BB5", "#FEE440", "#00BBF9"];

export default function FinanceTracker({ userId }: { userId: string }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [savingsTargets, setSavingsTargets] = useState<SavingsTarget[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportRange, setReportRange] = useState({
    startDate: format(subDays(new Date(), 30), "yyyy-MM-dd"),
    endDate: format(new Date(), "yyyy-MM-dd"),
  });

  const [newTx, setNewTx] = useState({
    description: "",
    amount: "",
    type: "expense" as "income" | "expense",
    category: "",
    date: format(new Date(), "yyyy-MM-dd"),
  });

  // Fetch data
  useEffect(() => {
    const q = query(collection(db, "users", userId, "transactions"), orderBy("date", "desc"));
    const unsub1 = onSnapshot(q, (snapshot) => {
      setTransactions(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Transaction)));
    });
    const unsub2 = onSnapshot(collection(db, "users", userId, "savings_targets"), (snapshot) => {
      setSavingsTargets(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as SavingsTarget)));
    });
    return () => { unsub1(); unsub2(); };
  }, [userId]);

  // Calculations
  const totalIncome = transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === "expense").reduce((s, t) => s + Math.abs(t.amount), 0);
  const balance = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? (balance / totalIncome) * 100 : 0;

  // Chart data: last 30 days
  const chartData = [...Array(30)].map((_, i) => {
    const date = format(subDays(new Date(), 29 - i), "MMM dd");
    const dayTxs = transactions.filter(t => format(new Date(t.date), "MMM dd") === date);
    const income = dayTxs.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expense = dayTxs.filter(t => t.type === "expense").reduce((s, t) => s + Math.abs(t.amount), 0);
    return { date, income, expense };
  });

  const addTransaction = async () => {
    if (!newTx.description || !newTx.amount || !newTx.category) return;
    await addDoc(collection(db, "users", userId, "transactions"), {
      description: newTx.description,
      amount: newTx.type === "expense" ? -Math.abs(parseFloat(newTx.amount)) : Math.abs(parseFloat(newTx.amount)),
      type: newTx.type,
      category: newTx.category,
      date: newTx.date,
      timestamp: new Date(),
    });
    setNewTx({ description: "", amount: "", type: "expense", category: "", date: format(new Date(), "yyyy-MM-dd") });
    setIsAddModalOpen(false);
  };

  const generateReport = () => {
    const filtered = transactions.filter(t => {
      const d = new Date(t.date);
      return d >= new Date(reportRange.startDate) && d <= new Date(reportRange.endDate);
    });
    const inc = filtered.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const exp = filtered.filter(t => t.type === "expense").reduce((s, t) => s + Math.abs(t.amount), 0);
    alert(`📊 Report (${reportRange.startDate} → ${reportRange.endDate})\n\nIncome: Rp ${inc.toLocaleString()}\nExpense: Rp ${exp.toLocaleString()}\nNet: Rp ${(inc - exp).toLocaleString()}\nTransactions: ${filtered.length}`);
    setIsReportModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <GlassCard icon={<Wallet className="h-5 w-5 text-emerald-400" />} label="Balance" value={`Rp ${balance.toLocaleString()}`} trend={balance >= 0 ? "positive" : "negative"} />
        <GlassCard icon={<TrendingUp className="h-5 w-5 text-cyan-400" />} label="Income" value={`Rp ${totalIncome.toLocaleString()}`} />
        <GlassCard icon={<TrendingDown className="h-5 w-5 text-rose-400" />} label="Expenses" value={`Rp ${totalExpense.toLocaleString()}`} />
        <GlassCard icon={<PiggyBank className="h-5 w-5 text-purple-400" />} label="Savings Rate" value={`${savingsRate.toFixed(1)}%`} />
      </div>

      {/* Chart + Savings Rings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="glass-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-white text-sm font-medium">30-Day Cashflow</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00C9A7" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#00C9A7" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F15BB5" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#F15BB5" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#a1a1aa" fontSize={10} tickLine={false} />
                <YAxis stroke="#a1a1aa" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", backdropFilter: "blur(10px)" }} />
                <Area type="monotone" dataKey="income" stroke="#00C9A7" fill="url(#incomeGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="expense" stroke="#F15BB5" fill="url(#expenseGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-white text-sm font-medium">Savings Goals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {savingsTargets.length === 0 ? (
              <p className="text-white/40 text-sm text-center py-4">No savings goals set</p>
            ) : (
              savingsTargets.map((target, idx) => {
                const progress = Math.min(100, (target.currentAmount / target.targetAmount) * 100);
                return (
                  <div key={target.id} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-white/70">{target.title}</span>
                      <span className="text-white/50">{progress.toFixed(0)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: COLORS[idx % COLORS.length] }}
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-white/40">
                      <span>Rp {target.currentAmount.toLocaleString()}</span>
                      <span>Rp {target.targetAmount.toLocaleString()}</span>
                    </div>
                  </div>
                );
              })
            )}
            <Button variant="ghost" size="sm" className="w-full text-white/50 hover:text-white/80 text-xs border border-white/10">
              + Add Goal
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card className="glass-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white text-sm font-medium">Recent Transactions</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setIsReportModalOpen(true)} className="text-white/50 hover:text-white/80">
            <Download className="h-4 w-4 mr-1" /> Report
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
            {transactions.slice(0, 10).map((t) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 hover:border-white/15 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${t.type === "income" ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"}`}>
                    {t.type === "income" ? "+" : "–"}
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{t.description}</p>
                    <p className="text-white/30 text-xs">{t.category} • {format(new Date(t.date), "dd MMM yyyy")}</p>
                  </div>
                </div>
                <p className={`text-sm font-semibold ${t.type === "income" ? "text-emerald-400" : "text-rose-400"}`}>
                  {t.type === "income" ? "+" : "–"}Rp {Math.abs(t.amount).toLocaleString()}
                </p>
              </motion.div>
            ))}
            {transactions.length === 0 && (
              <p className="text-white/30 text-sm text-center py-8">No transactions yet. Tap + to add one.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* FAB */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsAddModalOpen(true)}
        className="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 shadow-lg shadow-purple-500/30 flex items-center justify-center z-20 border border-white/20"
      >
        <Plus className="h-6 w-6 text-white" />
      </motion.button>

      {/* Add Transaction Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="glass-card border-white/20 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white">Add Transaction</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Select value={newTx.type} onValueChange={(v: any) => setNewTx({ ...newTx, type: v })}>
              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="Description" value={newTx.description} onChange={(e) => setNewTx({ ...newTx, description: e.target.value })} className="bg-white/10 border-white/20 text-white placeholder:text-white/30" />
            <Input type="number" placeholder="Amount" value={newTx.amount} onChange={(e) => setNewTx({ ...newTx, amount: e.target.value })} className="bg-white/10 border-white/20 text-white placeholder:text-white/30" />
            <Input type="date" value={newTx.date} onChange={(e) => setNewTx({ ...newTx, date: e.target.value })} className="bg-white/10 border-white/20 text-white" />
          </div>
          <DialogFooter className="gap-2">
            <DialogClose>
              <Button variant="outline" className="bg-white/5 border-white/20 text-white">Cancel</Button>
            </DialogClose>
            <Button onClick={addTransaction} className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white">Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Report Modal */}
      <Dialog open={isReportModalOpen} onOpenChange={setIsReportModalOpen}>
        <DialogContent className="glass-card border-white/20 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white">Generate Report</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-white/50 text-xs">Start Date</label>
              <Input type="date" value={reportRange.startDate} onChange={(e) => setReportRange({ ...reportRange, startDate: e.target.value })} className="bg-white/10 border-white/20 text-white" />
            </div>
            <div>
              <label className="text-white/50 text-xs">End Date</label>
              <Input type="date" value={reportRange.endDate} onChange={(e) => setReportRange({ ...reportRange, endDate: e.target.value })} className="bg-white/10 border-white/20 text-white" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <DialogClose>
              <Button variant="outline" className="bg-white/5 border-white/20 text-white">Cancel</Button>
            </DialogClose>
            <Button onClick={generateReport} className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white">Generate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helper GlassCard component
function GlassCard({ icon, label, value, trend }: { icon: React.ReactNode; label: string; value: string; trend?: "positive" | "negative" }) {
  return (
    <Card className="glass-card">
      <CardContent className="p-4 flex items-center justify-between">
        <div>
          <p className="text-white/40 text-xs uppercase tracking-wider">{label}</p>
          <p className="text-white text-xl font-bold mt-1">{value}</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}