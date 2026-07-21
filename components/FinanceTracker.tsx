"use client";
import React from "react";
import { useState, useEffect, useMemo, useCallback } from "react";
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion, AnimatePresence } from "framer-motion";
import { format, subDays, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { 
  Wallet, Plus, ArrowUpRight, ArrowDownRight, Trash2, Edit3, TrendingUp, 
  AlertTriangle, Shield, Sparkles, CreditCard, Handshake, Swords, 
  PiggyBank, BarChart3, Download, RefreshCw, ChevronDown, ChevronUp,
  ArrowUpDown, Search, Filter, CheckCircle, XCircle, Clock, DollarSign,
  Target, Zap, type LucideIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, BarChart, Bar, CartesianGrid, Legend } from "recharts";

// ============ TYPES ============
interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  type: "income" | "expense";
  createdAt?: Timestamp;
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
  createdAt?: Timestamp;
}

interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  icon: string;
  createdAt?: Timestamp;
}

interface CashflowSummary {
  totalIncome: number;
  totalExpense: number;
  netCashflow: number;
  savingsRate: number;
  burnRate: number;
  dailyBudget: number;
  monthlySurplus: number;
  runway: number;
  wealthScore: number;
}

type SortField = "date" | "amount" | "description" | "category";
type SortDir = "asc" | "desc";

// ============ CONSTANTS ============
const MONTHS = Array.from({ length: 12 }, (_, i) => {
  const d = new Date(2024, i, 1);
  return { value: format(d, "yyyy-MM"), label: format(d, "MMMM yyyy") };
});

const CATEGORIES = [
  "Food", "Transport", "Shopping", "Bills", "Entertainment", "Health", 
  "Education", "Salary", "Business", "Investment", "Rent", "Insurance",
  "Subscription", "Groceries", "Utilities", "Other"
];

const GOAL_ICONS = ["🏠", "🚗", "✈️", "💻", "📚", "🏋️", "💎", "🏦", "🎓", "🏡", "🌴", "🚀"];

const PIE_COLORS = ["#10b981", "#06b6d4", "#8b5cf6", "#f59e0b", "#ef4444", "#ec4899", "#14b8a6", "#f97316", "#84cc16", "#6366f1"];

const SORT_OPTIONS: { value: SortField; label: string }[] = [
  { value: "date", label: "Date" },
  { value: "amount", label: "Amount" },
  { value: "description", label: "Name" },
  { value: "category", label: "Category" },
];

// ============ HELPERS ============
function calculateCashflow(income: number, expense: number, debts: number, piutang: number, savings: number): CashflowSummary {
  const netCashflow = income - expense;
  const savingsRate = income > 0 ? ((income - expense) / income) * 100 : 0;
  const burnRate = expense;
  const dailyBudget = expense > 0 ? expense / 30 : 0;
  const monthlySurplus = netCashflow;
  const runway = expense > 0 ? (savings / expense) * 30 : 0;
  
  // Wealth score: 0-100 based on multiple factors
  let score = 50;
  if (savingsRate > 30) score += 20;
  else if (savingsRate > 20) score += 15;
  else if (savingsRate > 10) score += 10;
  if (debts === 0) score += 15;
  if (piutang > 0) score += 5;
  if (netCashflow > 0) score += 10;
  if (savings > income * 3) score += 10;
  else if (savings > income) score += 5;
  
  return {
    totalIncome: income,
    totalExpense: expense,
    netCashflow,
    savingsRate: Math.round(savingsRate * 10) / 10,
    burnRate,
    dailyBudget: Math.round(dailyBudget),
    monthlySurplus,
    runway: Math.round(runway),
    wealthScore: Math.min(100, Math.max(0, score)),
  };
}

function getWealthGrade(score: number): { label: string; color: string; icon: LucideIcon } {
  if (score >= 85) return { label: "Financial Freedom", color: "#10b981", icon: Sparkles };
  if (score >= 70) return { label: "Wealthy", color: "#06b6d4", icon: Shield };
  if (score >= 50) return { label: "Stable", color: "#f59e0b", icon: TrendingUp };
  if (score >= 30) return { label: "Needs Work", color: "#ef4444", icon: AlertTriangle };
  return { label: "Critical", color: "#dc2626", icon: Swords };
}

// ============ GOOGLE SHEETS SYNC ============
async function syncToSheets(type: string, data: any) {
  try {
    await fetch("/api/google/sheets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "append",
        range: type === "transaction" ? "Transactions!A:F" : type === "debt" ? "Debts!A:G" : "Goals!A:F",
        data: Object.values(data),
      }),
    });
  } catch (e) {
    console.error("Sheets sync failed:", e);
  }
}

// ============ COMPONENT ============
export default function FinanceTracker({ userId }: { userId: string }) {
  // State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));
  const [activeView, setActiveView] = useState<"dashboard" | "transactions" | "debts" | "goals" | "cashflow">("dashboard");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "paid">("all");
  const [goalStatusFilter, setGoalStatusFilter] = useState<"all" | "achieved" | "in-progress">("all");
  const [syncing, setSyncing] = useState(false);

  // Modal states
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isEditTxModalOpen, setIsEditTxModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [newTx, setNewTx] = useState({ description: "", amount: "", type: "expense" as "income" | "expense", category: "", date: format(new Date(), "yyyy-MM-dd") });
  const [newDebt, setNewDebt] = useState({ name: "", amount: "", type: "debt" as "debt" | "piutang", dueDate: "", notes: "" });
  const [newGoal, setNewGoal] = useState({ name: "", targetAmount: "", deadline: "", icon: "🎯" });

  // ============ FIREBASE LISTENERS ============
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

  // ============ COMPUTED VALUES ============
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
  const totalDebt = useMemo(() => 
    debts.filter(d => d.type === "debt" && d.status === "active").reduce((s, d) => s + d.remainingAmount, 0), 
    [debts]
  );
  const totalPiutang = useMemo(() => 
    debts.filter(d => d.type === "piutang" && d.status === "active").reduce((s, d) => s + d.remainingAmount, 0), 
    [debts]
  );
  const totalSavings = useMemo(() => totalIncome - totalExpense, [totalIncome, totalExpense]);
  const netWorth = useMemo(() => totalIncome - totalExpense - totalDebt + totalPiutang, [totalIncome, totalExpense, totalDebt, totalPiutang]);
  const totalGoalProgress = useMemo(() => goals.reduce((s, g) => s + g.currentAmount, 0), [goals]);
  const totalGoalTargets = useMemo(() => goals.reduce((s, g) => s + g.targetAmount, 0), [goals]);

  const cashflow = useMemo(() => 
    calculateCashflow(totalIncome, totalExpense, totalDebt, totalPiutang, totalSavings),
    [totalIncome, totalExpense, totalDebt, totalPiutang, totalSavings]
  );

  const wealthGrade = useMemo(() => getWealthGrade(cashflow.wealthScore), [cashflow.wealthScore]);

  // ============ SORTED & FILTERED TRANSACTIONS ============
  const sortedTransactions = useMemo(() => {
    let filtered = [...monthlyTxs];
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(t => 
        t.description.toLowerCase().includes(q) || 
        t.category.toLowerCase().includes(q)
      );
    }
    if (categoryFilter !== "all") filtered = filtered.filter(t => t.category === categoryFilter);
    if (typeFilter !== "all") filtered = filtered.filter(t => t.type === typeFilter);
    
    filtered.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "date": cmp = a.date.localeCompare(b.date); break;
        case "amount": cmp = Math.abs(a.amount) - Math.abs(b.amount); break;
        case "description": cmp = a.description.localeCompare(b.description); break;
        case "category": cmp = a.category.localeCompare(b.category); break;
      }
      return sortDir === "desc" ? -cmp : cmp;
    });
    return filtered;
  }, [monthlyTxs, searchQuery, categoryFilter, typeFilter, sortField, sortDir]);

  const sortedDebts = useMemo(() => {
    let filtered = [...debts];
    if (statusFilter !== "all") filtered = filtered.filter(d => d.status === statusFilter);
    return filtered;
  }, [debts, statusFilter]);

  const sortedGoals = useMemo(() => {
    let filtered = [...goals];
    if (goalStatusFilter === "achieved") filtered = filtered.filter(g => g.currentAmount >= g.targetAmount);
    else if (goalStatusFilter === "in-progress") filtered = filtered.filter(g => g.currentAmount < g.targetAmount);
    return filtered;
  }, [goals, goalStatusFilter]);

  // ============ CHART DATA ============
  const chartData = useMemo(() => 
    [...Array(30)].map((_, i) => {
      const date = format(subDays(new Date(), 29 - i), "yyyy-MM-dd");
      const dayTxs = monthlyTxs.filter(t => t.date === date);
      const income = dayTxs.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
      const expense = dayTxs.filter(t => t.type === "expense").reduce((s, t) => s + Math.abs(t.amount), 0);
      return { date: format(new Date(date), "MMM dd"), income, expense, net: income - expense };
    }),
    [monthlyTxs]
  );

  const categoryData = useMemo(() => {
    const map = new Map<string, number>();
    monthlyTxs.filter(t => t.type === "expense").forEach(t => {
      map.set(t.category, (map.get(t.category) || 0) + Math.abs(t.amount));
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [monthlyTxs]);

  const incomeCategoryData = useMemo(() => {
    const map = new Map<string, number>();
    monthlyTxs.filter(t => t.type === "income").forEach(t => {
      map.set(t.category, (map.get(t.category) || 0) + t.amount);
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [monthlyTxs]);

  // ============ CRUD OPERATIONS ============
  const addTransaction = async () => {
    if (!newTx.description || !newTx.amount || !newTx.category) return;
    const txData = {
      description: newTx.description,
      amount: newTx.type === "expense" ? -Math.abs(parseFloat(newTx.amount)) : Math.abs(parseFloat(newTx.amount)),
      type: newTx.type,
      category: newTx.category,
      date: newTx.date,
      createdAt: Timestamp.now(),
    };
    const docRef = await addDoc(collection(db, "users", userId, "transactions"), txData);
    // Sync to Google Sheets
    syncToSheets("transaction", { id: docRef.id, ...txData });
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
    const debtData = {
      name: newDebt.name,
      amount,
      remainingAmount: amount,
      type: newDebt.type,
      dueDate: newDebt.dueDate,
      status: "active" as const,
      notes: newDebt.notes,
      createdAt: Timestamp.now(),
    };
    const docRef = await addDoc(collection(db, "users", userId, "debts"), debtData);
    syncToSheets("debt", { id: docRef.id, ...debtData });
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
    const goalData = {
      name: newGoal.name,
      targetAmount: Math.abs(parseFloat(newGoal.targetAmount)),
      currentAmount: 0,
      deadline: newGoal.deadline || "",
      icon: newGoal.icon,
      createdAt: Timestamp.now(),
    };
    const docRef = await addDoc(collection(db, "users", userId, "financial_goals"), goalData);
    syncToSheets("goal", { id: docRef.id, ...goalData });
    setNewGoal({ name: "", targetAmount: "", deadline: "", icon: "🎯" });
    setIsGoalModalOpen(false);
  };

  const updateGoalProgress = async (goal: Goal, amount: number) => {
    const newAmount = Math.min(goal.currentAmount + amount, goal.targetAmount);
    await updateDoc(doc(db, "users", userId, "financial_goals", goal.id), {
      currentAmount: newAmount,
    });
  };

  const deleteGoal = async (id: string) => {
    await deleteDoc(doc(db, "users", userId, "financial_goals", id));
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("desc"); }
  };

  // ============ RENDER ============
  return (
    <div className="space-y-6">
      {/* ===== HEADER ===== */}
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
        <div className="flex gap-1 bg-white/5 rounded-xl p-1 overflow-x-auto">
          {(["dashboard", "cashflow", "transactions", "debts", "goals"] as const).map(view => (
            <button key={view} onClick={() => setActiveView(view)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize whitespace-nowrap transition-all ${
                activeView === view ? "bg-white/10 text-white" : "text-zinc-400 hover:text-zinc-200"
              }`}>
              {view === "debts" ? "Debt/Piutang" : view}
            </button>
          ))}
        </div>
      </div>

      {/* ===== DASHBOARD VIEW ===== */}
      {activeView === "dashboard" && (
        <>
          {/* Wealth Score Hero */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="glass-panel rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-72 h-72 rounded-full blur-3xl -z-10" 
              style={{ backgroundColor: `${wealthGrade.color}15` }} />
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <wealthGrade.icon className="h-5 w-5" style={{ color: wealthGrade.color }} />
                  <span className="text-lg font-bold" style={{ color: wealthGrade.color }}>
                    {wealthGrade.label}
                  </span>
                  <span className="text-xs text-zinc-500 ml-2">Score: {cashflow.wealthScore}/100</span>
                </div>
                <div className="w-full max-w-xs bg-white/5 rounded-full h-2 mb-3">
                  <motion.div 
                    initial={{ width: 0 }} animate={{ width: `${cashflow.wealthScore}%` }}
                    className="h-2 rounded-full transition-all" 
                    style={{ backgroundColor: wealthGrade.color }} />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  <div>
                    <p className="text-zinc-500 text-xs">Net Worth</p>
                    <p className="text-xl font-bold gradient-text">Rp {netWorth.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500 text-xs">Cashflow</p>
                    <p className={`text-xl font-bold ${cashflow.netCashflow >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {cashflow.netCashflow >= 0 ? "+" : ""}Rp {cashflow.netCashflow.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-zinc-500 text-xs">Savings Rate</p>
                    <p className="text-xl font-bold text-cyan-400">{cashflow.savingsRate}%</p>
                  </div>
                  <div>
                    <p className="text-zinc-500 text-xs">Runway</p>
                    <p className="text-xl font-bold text-purple-400">{cashflow.runway} days</p>
                  </div>
                </div>
              </div>
              {/* Mini donut chart */}
              <div className="w-24 h-24 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={[
                      { name: "Income", value: Math.max(totalIncome, 1) },
                      { name: "Expense", value: Math.max(totalExpense, 1) },
                    ]} cx="50%" cy="50%" innerRadius={25} outerRadius={40} dataKey="value">
                      <Cell fill="#10b981" />
                      <Cell fill="#ef4444" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>

          {/* Summary Cards */}
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

          {/* 30-Day Chart */}
          <Card className="glass-panel">
            <CardHeader><CardTitle className="text-zinc-100 text-sm">30-Day Income vs Expense</CardTitle></CardHeader>
            <CardContent>
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `${Number(val)/1000}k`} />
                    <Tooltip contentStyle={{ background: "rgba(18,18,20,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "#fff" } as React.CSSProperties} />
                    <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} fill="url(#incomeGrad)" name="Income" />
                    <Area type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} fill="url(#expenseGrad)" name="Expense" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Expense & Income Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categoryData.length > 0 && (
              <Card className="glass-panel">
                <CardHeader><CardTitle className="text-zinc-100 text-sm">Expenses by Category</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {categoryData.slice(0, 8).map((cat, i) => (
                      <div key={cat.name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 flex-1">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                          <span className="text-zinc-300">{cat.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-20 bg-white/5 rounded-full h-1.5">
                            <div className="h-1.5 rounded-full" style={{ width: `${(cat.value / Math.max(...categoryData.map(c => c.value))) * 100}%`, backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                          </div>
                          <span className="text-zinc-400 w-20 text-right">Rp {cat.value.toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            {incomeCategoryData.length > 0 && (
              <Card className="glass-panel">
                <CardHeader><CardTitle className="text-zinc-100 text-sm">Income by Category</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {incomeCategoryData.slice(0, 8).map((cat, i) => (
                      <div key={cat.name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 flex-1">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[(i + 5) % PIE_COLORS.length] }} />
                          <span className="text-zinc-300">{cat.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-20 bg-white/5 rounded-full h-1.5">
                            <div className="h-1.5 rounded-full" style={{ width: `${(cat.value / Math.max(...incomeCategoryData.map(c => c.value))) * 100}%`, backgroundColor: PIE_COLORS[(i + 5) % PIE_COLORS.length] }} />
                          </div>
                          <span className="text-zinc-400 w-20 text-right">Rp {cat.value.toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}

      {/* ===== CASHFLOW VIEW ===== */}
      {activeView === "cashflow" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {/* Cashflow Hero */}
          <div className="glass-panel rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-cyan-500/10 to-emerald-500/10 rounded-full blur-3xl -z-10" />
            <h2 className="text-sm font-medium text-zinc-400 mb-4 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-cyan-400" /> Cashflow Analysis
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Monthly Income", value: `Rp ${totalIncome.toLocaleString()}`, color: "text-emerald-400", icon: ArrowUpRight },
                { label: "Monthly Expense", value: `Rp ${totalExpense.toLocaleString()}`, color: "text-rose-400", icon: ArrowDownRight },
                { label: "Net Cashflow", value: `${cashflow.netCashflow >= 0 ? "+" : ""}Rp ${cashflow.netCashflow.toLocaleString()}`, color: cashflow.netCashflow >= 0 ? "text-emerald-400" : "text-rose-400", icon: DollarSign },
                { label: "Savings Rate", value: `${cashflow.savingsRate}%`, color: "text-cyan-400", icon: TrendingUp },
              ].map((item, i) => (
                <motion.div key={item.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="p-3 rounded-xl bg-white/5 border border-white/5">
                  <div className="flex items-center gap-2 mb-1">
                    <item.icon className={`h-3.5 w-3.5 ${item.color}`} />
                    <p className="text-zinc-500 text-xs">{item.label}</p>
                  </div>
                  <p className={`text-lg font-bold ${item.color}`}>{item.value}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Detailed Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: "Daily Budget", value: `Rp ${cashflow.dailyBudget.toLocaleString()}`, desc: "Average daily spending", color: "text-amber-400", icon: Clock },
              { label: "Monthly Surplus", value: `Rp ${cashflow.monthlySurplus.toLocaleString()}`, desc: "Money left after expenses", color: cashflow.monthlySurplus >= 0 ? "text-emerald-400" : "text-rose-400", icon: PiggyBank },
              { label: "Financial Runway", value: `${cashflow.runway} days`, desc: "How long your savings last", color: "text-purple-400", icon: Shield },
            ].map((item, i) => (
              <motion.div key={item.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className="glass-panel rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <item.icon className={`h-4 w-4 ${item.color}`} />
                  <p className="text-zinc-400 text-xs">{item.label}</p>
                </div>
                <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
                <p className="text-zinc-500 text-xs mt-1">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Cashflow Bar Chart */}
          <Card className="glass-panel">
            <CardHeader><CardTitle className="text-zinc-100 text-sm">Daily Cashflow (Last 30 Days)</CardTitle></CardHeader>
            <CardContent>
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                    <XAxis dataKey="date" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `${Number(val)/1000}k`} />
                    <Tooltip contentStyle={{ background: "rgba(18,18,20,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" } as React.CSSProperties} />
                    <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} name="Income" />
                    <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} name="Expense" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Wealth Score Breakdown */}
          <Card className="glass-panel">
            <CardHeader><CardTitle className="text-zinc-100 text-sm">Wealth Score Breakdown</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { label: "Savings Rate", score: cashflow.savingsRate > 30 ? 20 : cashflow.savingsRate > 20 ? 15 : cashflow.savingsRate > 10 ? 10 : 0, max: 20, desc: "Aim for 30%+ savings rate" },
                  { label: "Debt Management", score: totalDebt === 0 ? 15 : 0, max: 15, desc: totalDebt === 0 ? "No debt - excellent!" : "Focus on paying off debt" },
                  { label: "Piutang Recovery", score: totalPiutang > 0 ? 5 : 0, max: 5, desc: totalPiutang > 0 ? "You have money owed to you" : "No piutang recorded" },
                  { label: "Cashflow Health", score: cashflow.netCashflow > 0 ? 10 : 0, max: 10, desc: cashflow.netCashflow > 0 ? "Positive cashflow" : "Expenses exceed income" },
                  { label: "Emergency Fund", score: totalSavings > totalIncome * 3 ? 10 : totalSavings > totalIncome ? 5 : 0, max: 10, desc: "3-6 months of expenses recommended" },
                ].map((item, i) => (
                  <div key={item.label}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-zinc-300">{item.label}</span>
                      <span className="text-zinc-500">{item.score}/{item.max}</span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-2">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${(item.score / item.max) * 100}%` }}
                        className="h-2 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500" />
                    </div>
                    <p className="text-xs text-zinc-500 mt-0.5">{item.desc}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ===== TRANSACTIONS VIEW ===== */}
      {activeView === "transactions" && (
        <Card className="glass-panel">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <CardTitle className="text-zinc-100 text-sm">Transactions ({selectedMonth})</CardTitle>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
                <Input placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-xs bg-white/5 border-white/10 text-zinc-100 w-full sm:w-32" />
              </div>
              <Select value={categoryFilter} onValueChange={v => v && setCategoryFilter(v)}>
                <SelectTrigger className="h-8 text-xs bg-white/5 border-white/10 text-zinc-100 w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass-panel border-white/20 bg-zinc-950/90">
                  <SelectItem value="all">All</SelectItem>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={v => v && setTypeFilter(v as any)}>
                <SelectTrigger className="h-8 text-xs bg-white/5 border-white/10 text-zinc-100 w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass-panel border-white/20 bg-zinc-950/90">
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="ghost" size="sm" onClick={() => setIsTxModalOpen(true)} className="glass-button text-zinc-300 hover:text-white h-8">
                <Plus className="h-3.5 w-3.5 mr-1" /> Add
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Sort Controls */}
            <div className="flex gap-2 mb-3 text-xs">
              <span className="text-zinc-500">Sort by:</span>
              {SORT_OPTIONS.map(opt => (
                <button key={opt.value} onClick={() => toggleSort(opt.value)}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-all ${
                    sortField === opt.value ? "bg-white/10 text-cyan-400" : "text-zinc-500 hover:text-zinc-300"
                  }`}>
                  {opt.label}
                  {sortField === opt.value && (sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                </button>
              ))}
            </div>

            {/* Transaction List */}
            <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
              <AnimatePresence>
                {sortedTransactions.map((t) => (
                  <motion.div key={t.id} layout initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5 hover:border-white/15 transition-all group">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                        t.type === "income" ? "bg-emerald-500/20" : "bg-rose-500/20"
                      }`}>
                        {t.type === "income" ? <ArrowUpRight className="h-4 w-4 text-emerald-400" /> : <ArrowDownRight className="h-4 w-4 text-rose-400" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-zinc-100 text-sm font-medium truncate">{t.description}</p>
                        <p className="text-zinc-500 text-xs">{t.category} · {format(new Date(t.date), "dd MMM")}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
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
              {sortedTransactions.length === 0 && (
                <div className="text-center py-8 text-zinc-500 text-sm">No transactions found</div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ===== DEBTS VIEW ===== */}
      {activeView === "debts" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <div className="glass-panel rounded-xl px-3 py-2">
                <p className="text-xs text-orange-400">Total Debt</p>
                <p className="text-lg font-bold text-orange-400">Rp {totalDebt.toLocaleString()}</p>
              </div>
              <div className="glass-panel rounded-xl px-3 py-2">
                <p className="text-xs text-blue-400">Total Piutang</p>
                <p className="text-lg font-bold text-blue-400">Rp {totalPiutang.toLocaleString()}</p>
              </div>
              <div className="glass-panel rounded-xl px-3 py-2">
                <p className="text-xs text-zinc-400">Net</p>
                <p className={`text-lg font-bold ${totalPiutang - totalDebt >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  Rp {(totalPiutang - totalDebt).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={v => v && setStatusFilter(v as any)}>
                <SelectTrigger className="h-8 text-xs bg-white/5 border-white/10 text-zinc-100 w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass-panel border-white/20 bg-zinc-950/90">
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="ghost" size="sm" onClick={() => setIsDebtModalOpen(true)} className="glass-button text-zinc-300 h-8">
                <Plus className="h-3.5 w-3.5 mr-1" /> Add
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <AnimatePresence>
              {sortedDebts.map((debt) => (
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
                        <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" /> Paid
                        </span>
                      )}
                      {debt.status === "active" && (
                        <Input type="number" placeholder="Pay" className="w-20 h-7 text-xs bg-white/5 border-white/10 text-zinc-100"
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
            {sortedDebts.length === 0 && (
              <div className="text-center py-8 text-zinc-500 glass-panel rounded-xl text-sm">No debts or piutang recorded.</div>
            )}
          </div>
        </div>
      )}

      {/* ===== GOALS VIEW ===== */}
      {activeView === "goals" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <div className="glass-panel rounded-xl px-3 py-2">
                <p className="text-xs text-zinc-400">Total Progress</p>
                <p className="text-lg font-bold text-cyan-400">Rp {totalGoalProgress.toLocaleString()}</p>
              </div>
              <div className="glass-panel rounded-xl px-3 py-2">
                <p className="text-xs text-zinc-400">Total Target</p>
                <p className="text-lg font-bold text-purple-400">Rp {totalGoalTargets.toLocaleString()}</p>
              </div>
              <div className="glass-panel rounded-xl px-3 py-2">
                <p className="text-xs text-zinc-400">Completion</p>
                <p className="text-lg font-bold text-emerald-400">
                  {totalGoalTargets > 0 ? Math.round((totalGoalProgress / totalGoalTargets) * 100) : 0}%
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={goalStatusFilter} onValueChange={v => v && setGoalStatusFilter(v as any)}>
                <SelectTrigger className="h-8 text-xs bg-white/5 border-white/10 text-zinc-100 w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass-panel border-white/20 bg-zinc-950/90">
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="achieved">Achieved</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="ghost" size="sm" onClick={() => setIsGoalModalOpen(true)} className="glass-button text-zinc-300 h-8">
                <Plus className="h-3.5 w-3.5 mr-1" /> Add Goal
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <AnimatePresence>
              {sortedGoals.map((goal) => {
                const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
                const achieved = goal.currentAmount >= goal.targetAmount;
                return (
                  <motion.div key={goal.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className={`glass-panel rounded-xl p-4 ${achieved ? "ring-1 ring-emerald-500/30" : ""}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{goal.icon}</span>
                        <div>
                          <p className="text-zinc-100 font-medium">{goal.name}</p>
                          <p className="text-xs text-zinc-500">Target: Rp {goal.targetAmount.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {achieved && <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Done</span>}
                        <button onClick={() => deleteGoal(goal.id)} className="text-zinc-500 hover:text-red-400">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-3 mb-2">
                      <div className={`h-3 rounded-full transition-all ${achieved ? "bg-gradient-to-r from-emerald-500 to-teal-500" : "bg-gradient-to-r from-cyan-500 to-indigo-600"}`}
                        style={{ width: `${Math.min(100, progress)}%` }} />
                    </div>
                    <div className="flex justify-between text-xs mb-3">
                      <span className="text-zinc-400">Rp {goal.currentAmount.toLocaleString()}</span>
                      <span className="text-zinc-500">{progress.toFixed(0)}%</span>
                    </div>
                    {!achieved && (
                      <div className="flex gap-2">
                        <Input type="number" placeholder="Add amount" className="h-8 text-xs bg-white/5 border-white/10 text-zinc-100"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              const val = parseFloat((e.target as HTMLInputElement).value);
                              if (val > 0) updateGoalProgress(goal, val);
                              (e.target as HTMLInputElement).value = "";
                            }
                          }} />
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
          {sortedGoals.length === 0 && (
            <div className="text-center py-8 text-zinc-500 glass-panel rounded-xl text-sm">No goals yet. What do you want to save for?</div>
          )}
        </div>
      )}

      {/* ===== MODALS ===== */}
      {/* Add Transaction Modal */}
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

      {/* Edit Transaction Modal */}
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

      {/* Add Debt Modal */}
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

      {/* Add Goal Modal */}
      <Dialog open={isGoalModalOpen} onOpenChange={setIsGoalModalOpen}>
        <DialogContent className="glass-panel border-white/20 text-zinc-100 max-w-sm">
          <DialogHeader><DialogTitle>Add Financial Goal</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="flex gap-1.5 flex-wrap">
              {GOAL_ICONS.map(icon => (
                <button key={icon} onClick={() => setNewGoal({ ...newGoal, icon })}
                  className={`text-lg w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                    newGoal.icon === icon ? "bg-white/10 ring-1 ring-white/20" : "bg-white/5 hover:bg-white/10"
                  }`}>
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