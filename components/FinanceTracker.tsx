"use client";
import React from "react";
import { useState, useEffect, useMemo } from "react";
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion, AnimatePresence } from "framer-motion";
import { format, subDays } from "date-fns";
import { Wallet, Plus, ArrowUpRight, ArrowDownRight, Trash2, Edit3, TrendingUp, AlertTriangle, Shield, Sparkles, CreditCard, Handshake, Swords, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from "recharts";

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  type: "income" | "expense";
}

interface Debt {
  id: string;
  name: string;
  amount: number;
  remainingAmount: number;
  type: "debt" | "piutang";
  dueDate: string;
  status: "active" | "paid";
  notes?: string;
}

interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  icon: string;
}

const MONTHS = Array.from({ length: 12 }, (_, i) => {
  const d = new Date(2024, i, 1);
  return { value: format(d, "yyyy-MM"), label: format(d, "MMMM yyyy") };
});

const CATEGORIES = [
  "Food", "Transport", "Shopping", "Bills", "Entertainment", "Health", "Education", "Salary", "Business", "Investment", "Other"
];

const GOAL_ICONS = ["🏠", "🚗", "✈️", "💻", "📚", "🏋️", "💎", "🏦", "🎓", "🏡"];

const PIE_COLORS = ["#10b981", "#06b6d4", "#8b5cf6", "#f59e0b", "#ef4444", "#ec4899", "#14b8a6", "#f97316"];

function calculateWealthHealth(income: number, expense: number, debts: number, savings: number): { status: string; color: string; icon: LucideIcon; msg: string } {
  const ratio = income > 0 ? expense / income : 1;
  const netWorth = income - expense - debts + savings;
  
  if (netWorth > 0 && ratio < 0.5) return { status: "Excellent", color: "#10b981", icon: Sparkles, msg: "Your financial health is outstanding! Keep it up!" };
  if (netWorth > 0 && ratio < 0.7) return { status: "Healthy", color: "#06b6d4", icon: Shield, msg: "Good financial shape. Focus on growing investments." };
  if (netWorth > 0) return { status: "Moderate", color: "#f59e0b", icon: TrendingUp, msg: "Doing okay. Try to reduce unnecessary expenses." };
  if (debts > 0) return { status: "Needs Attention", color: "#ef4444", icon: AlertTriangle, msg: "Focus on paying off debts before spending." };
  return { status: "Critical", color: "#dc2626", icon: Swords, msg: "Take immediate action to improve finances." };
}

export default function FinanceTracker({ userId }: { userId: string }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isEditTxModalOpen, setIsEditTxModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [activeView, setActiveView] = useState<"overview" | "transactions" | "debts" | "goals">("overview");
  const [newTx, setNewTx] = useState({ description: "", amount: "", type: "expense" as "income" | "expense", category: "", date: format(new Date(), "yyyy-MM-dd") });
  const [newDebt, setNewDebt] = useState({ name: "", amount: "", type: "debt" as "debt" | "piutang", dueDate: "", notes: "" });
  const [newGoal, setNewGoal] = useState({ name: "", targetAmount: "", deadline: "", icon: "🎯" });

  useEffect(() => {
    const unsub1 = onSnapshot(query(collection(db, "users", userId, "transactions"), orderBy("date", "desc")), (snap) => {
      setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction)));
    });
    const unsub2 = onSnapshot(query(collection(db, "users", userId, "debts")), (snap) => {
      setDebts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Debt)));
    });
    const unsub3 = onSnapshot(query(collection(db, "users", userId, "financial_goals")), (snap) => {
      setGoals(snap.docs.map(d => ({ id: d.id, ...d.data() } as Goal)));
    });
    return () => { unsub1(); unsub2(); unsub3(); };
  }, [userId]);

  const monthlyTxs = useMemo(() => 
    transactions.filter(t => t.date.startsWith(selectedMonth)),
    [transactions, selectedMonth]
  );

  const totalIncome = useMemo(() => 
    monthlyTxs.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0),
    [monthlyTxs]
  );
  const totalExpense = useMemo(() => 
    monthlyTxs.filter(t => t.type === "expense").reduce((s, t) => s + Math.abs(t.amount), 0),
    [monthlyTxs]
  );
  const totalDebt = useMemo(() => debts.filter(d => d.type === "debt" && d.status === "active").reduce((s, d) => s + d.remainingAmount, 0), [debts]);
  const totalPiutang = useMemo(() => debts.filter(d => d.type === "piutang" && d.status === "active").reduce((s, d) => s + d.remainingAmount, 0), [debts]);

  const wealthHealth = useMemo(() => calculateWealthHealth(totalIncome, totalExpense, totalDebt, totalIncome - totalExpense), [totalIncome, totalExpense, totalDebt]);

  const chartData = useMemo(() => 
    [...Array(30)].map((_, i) => {
      const date = format(subDays(new Date(), 29 - i), "yyyy-MM-dd");
      const dayTxs = monthlyTxs.filter(t => t.date === date);
      const income = dayTxs.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
      const expense = dayTxs.filter(t => t.type === "expense").reduce((s, t) => s + Math.abs(t.amount), 0);
      return { date: format(new Date(date), "MMM dd"), net: income - expense };
    }),
    [monthlyTxs]
  );

  const categoryData = useMemo(() => {
    const map = new Map<string, number>();
    monthlyTxs.filter(t => t.type === "expense").forEach(t => {
      map.set(t.category, (map.get(t.category) || 0) + Math.abs(t.amount));
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [monthlyTxs]);

  const addTransaction = async () => {
    if (!newTx.description || !newTx.amount || !newTx.category) return;
    await addDoc(collection(db, "users", userId, "transactions"), {
      description: newTx.description,
      amount: newTx.type === "expense" ? -Math.abs(parseFloat(newTx.amount)) : Math.abs(parseFloat(newTx.amount)),
      type: newTx.type,
      category: newTx.category,
      date: newTx.date,
    });
    setNewTx({ description: "", amount: "", type: "expense", category: "", date: format(new Date(), "yyyy-MM-dd") });
    setIsTxModalOpen(false);
  };

  const updateTransaction = async () => {
    if (!editingTx) return;
    await updateDoc(doc(db, "users", userId, "transactions", editingTx.id), {
      description: editingTx.description,
      amount: editingTx.type === "expense" ? -Math.abs(Number(editingTx.amount)) : Math.abs(Number(editingTx.amount)),
      type: editingTx.type,
      category: editingTx.category,
      date: editingTx.date,
    });
    setEditingTx(null);
    setIsEditTxModalOpen(false);
  };

  const deleteTransaction = async (id: string) => {
    await deleteDoc(doc(db, "users", userId, "transactions", id));
  };

  const addDebt = async () => {
    if (!newDebt.name || !newDebt.amount || !newDebt.dueDate) return;
    const amount = Math.abs(parseFloat(newDebt.amount));
    await addDoc(collection(db, "users", userId, "debts"), {
      name: newDebt.name,
      amount,
      remainingAmount: amount,
      type: newDebt.type,
      dueDate: newDebt.dueDate,
      status: "active",
      notes: newDebt.notes,
      createdAt: new Date(),
    });
    setNewDebt({ name: "", amount: "", type: "debt", dueDate: "", notes: "" });
    setIsDebtModalOpen(false);
  };

  const payDebt = async (debt: Debt, amount: number) => {
    const remaining = Math.max(0, debt.remainingAmount - amount);
    await updateDoc(doc(db, "users", userId, "debts", debt.id), {
      remainingAmount: remaining,
      status: remaining === 0 ? "paid" : "active",
    });
  };

  const deleteDebt = async (id: string) => {
    await deleteDoc(doc(db, "users", userId, "debts", id));
  };

  const addGoal = async () => {
    if (!newGoal.name || !newGoal.targetAmount) return;
    await addDoc(collection(db, "users", userId, "financial_goals"), {
      name: newGoal.name,
      targetAmount: Math.abs(parseFloat(newGoal.targetAmount)),
      currentAmount: 0,
      deadline: newGoal.deadline || "",
      icon: newGoal.icon,
      createdAt: new Date(),
    });
    setNewGoal({ name: "", targetAmount: "", deadline: "", icon: "🎯" });
    setIsGoalModalOpen(false);
  };

  const updateGoalProgress = async (goal: Goal, amount: number) => {
    await updateDoc(doc(db, "users", userId, "financial_goals", goal.id), {
      currentAmount: Math.min(goal.currentAmount + amount, goal.targetAmount),
    });
  };

  const deleteGoal = async (id: string) => {
    await deleteDoc(doc(db, "users", userId, "financial_goals", id));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <Select value={selectedMonth} onValueChange={(v) => v && setSelectedMonth(v)}>
          <SelectTrigger className="w-44 glass-panel bg-transparent text-zinc-100 border-white/10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="glass-panel border-white/20 bg-zinc-950/90 max-h-60">
            {MONTHS.map(m => (
              <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-1 bg-white/5 rounded-xl p-1">
          {(["overview", "transactions", "debts", "goals"] as const).map(view => (
            <button key={view} onClick={() => setActiveView(view)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${activeView === view ? "bg-white/10 text-white" : "text-zinc-400 hover:text-zinc-200"}`}>
              {view === "debts" ? "Debt/Piutang" : view}
            </button>
          ))}
        </div>
      </div>

      {activeView === "overview" && (
        <>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="glass-panel rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -z-10" style={{ backgroundColor: `${wealthHealth.color}15` }} />
            <div className="flex items-start justify-between">
              <div>
                <p className="text-zinc-400 text-xs uppercase tracking-wider mb-1">Wealth Health</p>
                <div className="flex items-center gap-2 mb-1">
                  <wealthHealth.icon className="h-5 w-5" style={{ color: wealthHealth.color } as React.CSSProperties} />
                  <span className="text-lg font-bold" style={{ color: wealthHealth.color }}>{wealthHealth.status}</span>
                </div>
                <p className="text-zinc-500 text-sm">{wealthHealth.msg}</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold gradient-text">
                  Rp {(totalIncome - totalExpense).toLocaleString()}
                </p>
                <p className="text-zinc-500 text-xs">Net Worth this month</p>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Income", value: totalIncome, color: "text-emerald-400", icon: ArrowUpRight, bg: "bg-emerald-500/10" },
              { label: "Expenses", value: totalExpense, color: "text-rose-400", icon: ArrowDownRight, bg: "bg-rose-500/10" },
              { label: "Debt", value: totalDebt, color: "text-orange-400", icon: CreditCard, bg: "bg-orange-500/10" },
              { label: "Piutang", value: totalPiutang, color: "text-blue-400", icon: Handshake, bg: "bg-blue-500/10" },
            ].map((item, i) => (
              <motion.div key={item.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className="glass-panel rounded-xl p-4">
                <div className={`w-8 h-8 rounded-lg ${item.bg} flex items-center justify-center mb-2`}>
                  <item.icon className={`h-4 w-4 ${item.color}`} />
                </div>
                <p className="text-zinc-400 text-xs">{item.label}</p>
                <p className={`text-lg font-bold ${item.color}`}>Rp {item.value.toLocaleString()}</p>
              </motion.div>
            ))}
          </div>

          <Card className="glass-panel">
            <CardHeader><CardTitle className="text-zinc-100 text-sm">30-Day Net Worth Trend</CardTitle></CardHeader>
            <CardContent>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `${Number(val)/1000}k`} />
                    <Tooltip contentStyle={{ background: "rgba(18,18,20,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "#fff" } as React.CSSProperties} />
                    <Area type="monotone" dataKey="net" stroke="#10b981" strokeWidth={2} fill="url(#netGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {categoryData.length > 0 && (
            <Card className="glass-panel">
              <CardHeader><CardTitle className="text-zinc-100 text-sm">Expense Breakdown</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={categoryData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value">
                          {categoryData.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ background: "rgba(18,18,20,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" } as React.CSSProperties} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2">
                    {categoryData.map((cat, i) => (
                      <div key={cat.name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                          <span className="text-zinc-300">{cat.name}</span>
                        </div>
                        <span className="text-zinc-400">Rp {cat.value.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {activeView === "transactions" && (
        <Card className="glass-panel">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-zinc-100 text-sm">Transactions ({selectedMonth})</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setIsTxModalOpen(true)} className="glass-button text-zinc-300 hover:text-white">
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
              <AnimatePresence>
                {monthlyTxs.slice(0, 30).map((t) => (
                  <motion.div key={t.id} layout initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/15 transition-all group">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${t.type === "income" ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"}`}>
                        {t.type === "income" ? "+" : "–"}
                      </div>
                      <div>
                        <p className="text-zinc-100 text-sm font-medium">{t.description}</p>
                        <p className="text-zinc-500 text-xs">{t.category} · {format(new Date(t.date), "dd MMM yyyy")}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-semibold ${t.type === "income" ? "text-emerald-400" : "text-rose-400"}`}>
                        {t.type === "income" ? "+" : "–"}Rp {Math.abs(t.amount).toLocaleString()}
                      </p>
                      <button onClick={() => { setEditingTx({ ...t, amount: Math.abs(t.amount) }); setIsEditTxModalOpen(true); }}
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-all">
                        <Edit3 className="h-3.5 w-3.5 mx-auto" />
                      </button>
                      <button onClick={() => deleteTransaction(t.id)}
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all">
                        <Trash2 className="h-3.5 w-3.5 mx-auto" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {monthlyTxs.length === 0 && (
                <div className="text-center py-12 text-zinc-500">No transactions this month. Tap + to add one.</div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {activeView === "debts" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-3">
              <div className="glass-panel rounded-xl px-4 py-2">
                <p className="text-xs text-orange-400">Total Debt</p>
                <p className="text-lg font-bold text-orange-400">Rp {totalDebt.toLocaleString()}</p>
              </div>
              <div className="glass-panel rounded-xl px-4 py-2">
                <p className="text-xs text-blue-400">Total Piutang</p>
                <p className="text-lg font-bold text-blue-400">Rp {totalPiutang.toLocaleString()}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setIsDebtModalOpen(true)} className="glass-button text-zinc-300">
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </div>
          <div className="space-y-2">
            <AnimatePresence>
              {debts.map((debt) => (
                <motion.div key={debt.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="glass-panel rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${debt.type === "debt" ? "bg-orange-500/20" : "bg-blue-500/20"}`}>
                        {debt.type === "debt" ? <CreditCard className="h-5 w-5 text-orange-400" /> : <Handshake className="h-5 w-5 text-blue-400" />}
                      </div>
                      <div>
                        <p className="text-zinc-100 font-medium">{debt.name}</p>
                        <p className="text-xs text-zinc-500">{debt.type === "debt" ? "Debt" : "Piutang"} · Due {format(new Date(debt.dueDate), "dd MMM yyyy")}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {debt.status === "active" ? (
                        <span className="text-xs px-2 py-1 rounded-full bg-amber-500/20 text-amber-400">Active</span>
                      ) : (
                        <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400">Paid</span>
                      )}
                      {debt.status === "active" && (
                        <Input type="number" placeholder="Pay amount" className="w-24 h-7 text-xs bg-white/5 border-white/10 text-zinc-100"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              const val = parseFloat((e.target as HTMLInputElement).value);
                              if (val > 0) payDebt(debt, val);
                              (e.target as HTMLInputElement).value = "";
                            }
                          }} />
                      )}
                      <button onClick={() => deleteDebt(debt.id)} className="text-zinc-500 hover:text-red-400">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-2">
                    <div className={`h-2 rounded-full transition-all ${debt.type === "debt" ? "bg-gradient-to-r from-orange-500 to-red-500" : "bg-gradient-to-r from-blue-500 to-cyan-500"}`}
                      style={{ width: `${Math.min(100, (1 - debt.remainingAmount / debt.amount) * 100)}%` }} />
                  </div>
                  <div className="flex justify-between text-xs text-zinc-500 mt-1">
                    <span>Rp {debt.remainingAmount.toLocaleString()} remaining</span>
                    <span>Rp {debt.amount.toLocaleString()} total</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {debts.length === 0 && (
              <div className="text-center py-12 text-zinc-500 glass-panel rounded-xl">No debts or piutang recorded.</div>
            )}
          </div>
        </div>
      )}

      {activeView === "goals" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-zinc-300 text-sm">Track your financial goals</p>
            <Button variant="ghost" size="sm" onClick={() => setIsGoalModalOpen(true)} className="glass-button text-zinc-300">
              <Plus className="h-4 w-4 mr-1" /> Add Goal
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence>
              {goals.map((goal) => {
                const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
                return (
                  <motion.div key={goal.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className="glass-panel rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{goal.icon}</span>
                        <div>
                          <p className="text-zinc-100 font-medium">{goal.name}</p>
                          <p className="text-xs text-zinc-500">Target: Rp {goal.targetAmount.toLocaleString()}</p>
                        </div>
                      </div>
                      <button onClick={() => deleteGoal(goal.id)} className="text-zinc-500 hover:text-red-400">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-3 mb-2">
                      <div className="h-3 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-600 transition-all"
                        style={{ width: `${Math.min(100, progress)}%` }} />
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-400">Rp {goal.currentAmount.toLocaleString()}</span>
                      <span className="text-zinc-500">{progress.toFixed(0)}%</span>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Input type="number" placeholder="Add amount" className="h-8 text-xs bg-white/5 border-white/10 text-zinc-100"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            const val = parseFloat((e.target as HTMLInputElement).value);
                            if (val > 0) updateGoalProgress(goal, val);
                            (e.target as HTMLInputElement).value = "";
                          }
                        }} />
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
          {goals.length === 0 && (
            <div className="text-center py-12 text-zinc-500 glass-panel rounded-xl">No goals yet. What do you want to save for?</div>
          )}
        </div>
      )}

      <Dialog open={isTxModalOpen} onOpenChange={setIsTxModalOpen}>
        <DialogContent className="glass-panel border-white/20 text-zinc-100 max-w-sm">
          <DialogHeader><DialogTitle>Add Transaction</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <Select value={newTx.type} onValueChange={(v) => v && setNewTx({ ...newTx, type: v as "income" | "expense" })}>
              <SelectTrigger className="bg-white/5 border-white/10 text-zinc-100"><SelectValue /></SelectTrigger>
              <SelectContent className="glass-panel border-white/20 bg-zinc-950/90">
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="Description" value={newTx.description} onChange={(e) => setNewTx({ ...newTx, description: e.target.value })} className="bg-white/5 border-white/10 text-zinc-100" />
            <Input type="number" placeholder="Amount" value={newTx.amount} onChange={(e) => setNewTx({ ...newTx, amount: e.target.value })} className="bg-white/5 border-white/10 text-zinc-100" />
            <Select value={newTx.category} onValueChange={(v) => v && setNewTx({ ...newTx, category: v })}>
              <SelectTrigger className="bg-white/5 border-white/10 text-zinc-100"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent className="glass-panel border-white/20 bg-zinc-950/90">
                {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input type="date" value={newTx.date} onChange={(e) => setNewTx({ ...newTx, date: e.target.value })} className="bg-white/5 border-white/10 text-zinc-100" />
          </div>
          <DialogFooter>
            <DialogClose><Button variant="outline" className="glass-button">Cancel</Button></DialogClose>
            <Button onClick={addTransaction} className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white">Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditTxModalOpen} onOpenChange={setIsEditTxModalOpen}>
        <DialogContent className="glass-panel border-white/20 text-zinc-100 max-w-sm">
          <DialogHeader><DialogTitle>Edit Transaction</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            {editingTx && (
              <>
                <Select value={editingTx.type} onValueChange={(v) => v && setEditingTx({ ...editingTx, type: v as "income" | "expense" })}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-zinc-100"><SelectValue /></SelectTrigger>
                  <SelectContent className="glass-panel border-white/20 bg-zinc-950/90">
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
                <Input placeholder="Description" value={editingTx.description} onChange={(e) => setEditingTx({ ...editingTx, description: e.target.value })} className="bg-white/5 border-white/10 text-zinc-100" />
                <Input type="number" placeholder="Amount" value={editingTx.amount} onChange={(e) => setEditingTx({ ...editingTx, amount: parseFloat(e.target.value) })} className="bg-white/5 border-white/10 text-zinc-100" />
                <Select value={editingTx.category} onValueChange={(v) => v && setEditingTx({ ...editingTx, category: v })}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-zinc-100"><SelectValue /></SelectTrigger>
                  <SelectContent className="glass-panel border-white/20 bg-zinc-950/90">
                    {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input type="date" value={editingTx.date} onChange={(e) => setEditingTx({ ...editingTx, date: e.target.value })} className="bg-white/5 border-white/10 text-zinc-100" />
              </>
            )}
          </div>
          <DialogFooter>
            <DialogClose><Button variant="outline" className="glass-button">Cancel</Button></DialogClose>
            <Button onClick={updateTransaction} className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white">Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDebtModalOpen} onOpenChange={setIsDebtModalOpen}>
        <DialogContent className="glass-panel border-white/20 text-zinc-100 max-w-sm">
          <DialogHeader><DialogTitle>Add Debt / Piutang</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <Select value={newDebt.type} onValueChange={(v) => v && setNewDebt({ ...newDebt, type: v as "debt" | "piutang" })}>
              <SelectTrigger className="bg-white/5 border-white/10 text-zinc-100"><SelectValue /></SelectTrigger>
              <SelectContent className="glass-panel border-white/20 bg-zinc-950/90">
                <SelectItem value="debt">Debt (I owe)</SelectItem>
                <SelectItem value="piutang">Piutang (Owed to me)</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="Name (e.g., Bank, John)" value={newDebt.name} onChange={(e) => setNewDebt({ ...newDebt, name: e.target.value })} className="bg-white/5 border-white/10 text-zinc-100" />
            <Input type="number" placeholder="Amount" value={newDebt.amount} onChange={(e) => setNewDebt({ ...newDebt, amount: e.target.value })} className="bg-white/5 border-white/10 text-zinc-100" />
            <Input type="date" value={newDebt.dueDate} onChange={(e) => setNewDebt({ ...newDebt, dueDate: e.target.value })} className="bg-white/5 border-white/10 text-zinc-100" />
            <Input placeholder="Notes (optional)" value={newDebt.notes} onChange={(e) => setNewDebt({ ...newDebt, notes: e.target.value })} className="bg-white/5 border-white/10 text-zinc-100" />
          </div>
          <DialogFooter>
            <DialogClose><Button variant="outline" className="glass-button">Cancel</Button></DialogClose>
            <Button onClick={addDebt} className="bg-gradient-to-r from-orange-500 to-red-600 text-white">Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isGoalModalOpen} onOpenChange={setIsGoalModalOpen}>
        <DialogContent className="glass-panel border-white/20 text-zinc-100 max-w-sm">
          <DialogHeader><DialogTitle>Add Financial Goal</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="flex gap-2">
              {GOAL_ICONS.slice(0, 5).map(icon => (
                <button key={icon} onClick={() => setNewGoal({ ...newGoal, icon })}
                  className={`text-xl w-8 h-8 rounded-lg flex items-center justify-center transition-all ${newGoal.icon === icon ? "bg-white/10 ring-1 ring-white/20" : "bg-white/5"}`}>
                  {icon}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              {GOAL_ICONS.slice(5).map(icon => (
                <button key={icon} onClick={() => setNewGoal({ ...newGoal, icon })}
                  className={`text-xl w-8 h-8 rounded-lg flex items-center justify-center transition-all ${newGoal.icon === icon ? "bg-white/10 ring-1 ring-white/20" : "bg-white/5"}`}>
                  {icon}
                </button>
              ))}
            </div>
            <Input placeholder="Goal name" value={newGoal.name} onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })} className="bg-white/5 border-white/10 text-zinc-100" />
            <Input type="number" placeholder="Target amount (Rp)" value={newGoal.targetAmount} onChange={(e) => setNewGoal({ ...newGoal, targetAmount: e.target.value })} className="bg-white/5 border-white/10 text-zinc-100" />
            <Input type="date" value={newGoal.deadline} onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })} className="bg-white/5 border-white/10 text-zinc-100" />
          </div>
          <DialogFooter>
            <DialogClose><Button variant="outline" className="glass-button">Cancel</Button></DialogClose>
            <Button onClick={addGoal} className="bg-gradient-to-r from-cyan-500 to-indigo-600 text-white">Add Goal</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}