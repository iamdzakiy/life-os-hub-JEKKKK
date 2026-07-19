"use client";

import { useState, useEffect } from "react";
import { collection, onSnapshot, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Heart, Plus, Download } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  timestamp: Date;
}

interface SavingsTarget {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  createdAt: Date;
}

interface ChartDataPoint {
  date: string;
  expense: number;
  income: number;
}

const EXPENSE_CATEGORIES = [
  "Food & Dining", "Transportation", "Shopping", "Entertainment", 
  "Bills & Utilities", "Health", "Education", "Investment", "Other"
];

const INCOME_CATEGORIES = [
  "Salary", "Freelance", "Investment", "Gift", "Other"
];

type TransactionForm = {
  description: string;
  amount: string;
  type: "income" | "expense";
  category: string;
  date: string;
};

type ReportRange = {
  startDate: string;
  endDate: string;
};

export default function FinanceTracker({ userId }: { userId: string }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [savingsTargets, setSavingsTargets] = useState<SavingsTarget[]>([]);
  const [isAddingModalOpen, setIsAddingModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [newTransaction, setNewTransaction] = useState<TransactionForm>({
    description: "",
    amount: "",
    type: "expense",
    category: "",
    date: format(new Date(), "yyyy-MM-dd"),
  });
  const [reportRange, setReportRange] = useState<ReportRange>({
    startDate: format(new Date(), "yyyy-MM-dd"),
    endDate: format(new Date(), "yyyy-MM-dd"),
  });

  useEffect(() => {
    const unsub1 = onSnapshot(collection(db, "users", userId, "transactions"), (snapshot) => {
      setTransactions(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Transaction)));
    });
    const unsub2 = onSnapshot(collection(db, "users", userId, "savings_targets"), (snapshot) => {
      setSavingsTargets(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as SavingsTarget)));
    });
    return () => { unsub1(); unsub2(); };
  }, [userId]);

  const addTransaction = async () => {
    if (!newTransaction.description || !newTransaction.amount || !newTransaction.category) return;
    
    await addDoc(collection(db, "users", userId, "transactions"), {
      description: newTransaction.description,
      amount: newTransaction.type === "expense" ? -Math.abs(parseFloat(newTransaction.amount)) : Math.abs(parseFloat(newTransaction.amount)),
      type: newTransaction.type,
      category: newTransaction.category,
      date: newTransaction.date,
      timestamp: new Date(),
    });
    
    setNewTransaction({
      description: "",
      amount: "",
      type: "expense",
      category: "",
      date: format(new Date(), "yyyy-MM-dd"),
    });
    setIsAddingModalOpen(false);
  };

  const calculateFinancialHealth = () => {
    const totalIncome = transactions.filter(t => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = Math.abs(transactions.filter(t => t.type === "expense").reduce((sum, t) => sum + t.amount, 0));
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;
    const healthScore = Math.max(0, Math.min(100, savingsRate * 20 + 20));
    return Math.round(healthScore);
  };

  const getHealthMessage = (score: number) => {
    if (score >= 80) return "Excellent! Your finances are in great shape 💚";
    if (score >= 60) return "Good! Keep building your savings momentum 💙";
    if (score >= 40) return "Fair. Consider reviewing your spending habits 💛";
    return "Needs attention. Start with small daily savings changes 🤍";
  };

  const generateReport = () => {
    const filtered = transactions.filter(t => {
      const tDate = new Date(t.date);
      const start = new Date(reportRange.startDate);
      const end = new Date(reportRange.endDate);
      return tDate >= start && tDate <= end;
    });
    
    const income = filtered.filter(t => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
    const expense = Math.abs(filtered.filter(t => t.type === "expense").reduce((sum, t) => sum + t.amount, 0));
    
    const reportData = {
      period: `${format(new Date(reportRange.startDate), "MMM dd")} - ${format(new Date(reportRange.endDate), "MMM dd")}`,
      totalIncome: income,
      totalExpense: expense,
      netSavings: income - expense,
      transactions: filtered,
    };
    
    console.log("Finance Report:", reportData);
    alert(`Report generated! Check console for details.\nIncome: Rp${income.toLocaleString()}\nExpense: Rp${expense.toLocaleString()}`);
    setIsReportModalOpen(false);
  };

  // Prepare chart data - monthly spending
  const chartData: ChartDataPoint[] = transactions
    .filter(t => t.type === "expense")
    .reduce((acc, t) => {
      const month = format(new Date(t.date), "MMM dd");
      const existing = acc.find(d => d.date === month);
      if (existing) {
        existing.expense += Math.abs(t.amount);
      } else {
        acc.push({ date: month, expense: Math.abs(t.amount), income: 0 });
      }
      return acc;
    }, [] as ChartDataPoint[])
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-30);

  const totalSavings = savingsTargets.reduce((sum, t) => sum + t.currentAmount, 0);
  const totalTarget = savingsTargets.reduce((sum, t) => sum + t.targetAmount, 0);
  const overallProgress = totalTarget > 0 ? (totalSavings / totalTarget) * 100 : 0;
  
  const financialHealth = calculateFinancialHealth();

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#1A2A6C] via-[#2A3A7C] to-[#4A90E2] pb-20">
      {/* Ambient Glow Background */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#00C9A7]/10 rounded-full filter blur-3xl opacity-30 animate-pulse" />
      <div className="absolute bottom-40 left-0 w-80 h-80 bg-[#9B5DE5]/10 rounded-full filter blur-3xl opacity-20" />
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative z-10 p-4 space-y-6"
      >
        {/* Main Savings Card */}
        <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
          <CardContent className="p-6 text-center">
            <p className="text-white/70 text-sm font-medium mb-2">Total Savings</p>
            <h2 className="text-4xl font-bold text-transparent bg-gradient-to-r from-[#00C9A7] to-[#9B5DE5] bg-clip-text mb-4">
              Rp {totalSavings.toLocaleString()}
            </h2>
            <p className="text-white/60 text-xs">
              from {savingsTargets.length} savings goal{savingsTargets.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        {/* Financial Health Score */}
        <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-white/70 text-sm font-medium">Financial Health</p>
                <p className="text-3xl font-bold text-white">{financialHealth}/100</p>
              </div>
              <Heart className={`h-10 w-10 ${financialHealth >= 60 ? 'text-[#00C9A7]' : financialHealth >= 40 ? 'text-[#F15BB5]' : 'text-white/50'}`} />
            </div>
            <p className="text-white/80 text-sm">{getHealthMessage(financialHealth)}</p>
          </CardContent>
        </Card>

        {/* Target Savings Progress Ring */}
        <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
          <CardContent className="p-6">
            <p className="text-white/70 text-sm font-medium mb-4">Savings Progress</p>
            <div className="relative w-32 h-32 mx-auto">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="8"
                />
                <motion.circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="url(#gradient)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  initial={{ strokeDasharray: 0 }}
                  animate={{ strokeDasharray: `${overallProgress * 2.5}, 250` }}
                  style={{ strokeDasharray: `${overallProgress * 2.5}, 250` }}
                  className="transition-all duration-1000"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#00C9A7" />
                    <stop offset="100%" stopColor="#9B5DE5" />
                  </linearGradient>
                </defs>
                <text x="50" y="50" textAnchor="middle" dominantBaseline="middle" className="text-xl font-bold fill-white">
                  {Math.round(overallProgress)}%
                </text>
              </svg>
            </div>
            <p className="text-center text-white/70 text-xs mt-2">
              Rp {totalSavings.toLocaleString()} / Rp {totalTarget.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        {/* Cashflow Chart */}
        <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
          <CardHeader>
            <CardTitle className="text-white text-sm">Monthly Spending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#F15BB5" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="#F15BB5" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#e4e4e7" fontSize={10} />
                  <YAxis stroke="#e4e4e7" fontSize={10} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(255,255,255,0.1)",
                      border: "1px solid rgba(255,255,255,0.2)",
                      backdropFilter: "blur(10px)",
                      color: "white"
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="expense"
                    stroke="#F15BB5"
                    fill="url(#expenseGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Expenses (Pengeluaran) */}
        <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
          <CardHeader>
            <CardTitle className="text-white text-sm flex items-center justify-between">
              Recent Expenses
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsReportModalOpen(true)}
                className="text-[#00C9A7] hover:bg-white/10"
              >
                <Download className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <div className="space-y-2 max-h-64 overflow-y-auto">
              <AnimatePresence>
                {transactions
                  .filter(t => t.type === "expense")
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .slice(0, 10)
                  .map((t) => (
                    <motion.div
                      key={t.id}
                      initial={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
                    >
                      <div className="flex-1">
                        <p className="text-white font-medium text-sm">{t.description}</p>
                        <p className="text-white/60 text-xs">{t.category} &bull; {format(new Date(t.date), "dd MMM")}</p>
                      </div>
                      <p className="text-[#F15BB5] font-semibold text-sm">
                        -Rp {Math.abs(t.amount).toLocaleString()}
                      </p>
                    </motion.div>
                  ))}
              </AnimatePresence>
              {transactions.filter(t => t.type === "expense").length === 0 && (
                <p className="text-center text-white/50 text-sm py-4">No expenses recorded yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Floating Action Button */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        whileHover={{ scale: 1.05 }}
        onClick={() => setIsAddingModalOpen(true)}
        className="fixed bottom-24 right-6 w-14 h-14 bg-gradient-to-r from-[#00C9A7] to-[#9B5DE5] rounded-full shadow-2xl flex items-center justify-center z-20"
      >
        <Plus className="h-7 w-7 text-white" />
      </motion.button>

      {/* Add Transaction Modal */}
      <AnimatePresence>
        {isAddingModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end justify-center z-30 p-4"
            onClick={() => setIsAddingModalOpen(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-t-3xl w-full max-w-md p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-white font-semibold text-lg mb-4">Add Transaction</h3>
              <div className="space-y-4">
                <Select
                  value={newTransaction.type}
                  onValueChange={(v: string | null) => setNewTransaction({ ...newTransaction, type: (v ?? "expense") as "income" | "expense" })}
                >
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Income (Pemasukan)</SelectItem>
                    <SelectItem value="expense">Expense (Pengeluaran)</SelectItem>
                  </SelectContent>
                </Select>
                
                <Input
                  placeholder="Description"
                  value={newTransaction.description}
                  onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                />
                
                <Input
                  type="number"
                  placeholder="Amount (Rp)"
                  value={newTransaction.amount}
                  onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                />
                
                <Select
                  value={newTransaction.category}
                  onValueChange={(v: string | null) => setNewTransaction({ ...newTransaction, category: v ?? "" })}
                >
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {(newTransaction.type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Input
                  type="date"
                  value={newTransaction.date}
                  onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value ?? "" })}
                  className="bg-white/10 border-white/20 text-white"
                />
                
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsAddingModalOpen(false)}
                    className="flex-1 bg-white/5 border-white/20 text-white"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={addTransaction}
                    className="flex-1 bg-gradient-to-r from-[#00C9A7] to-[#9B5DE5] text-white"
                  >
                    Add
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Report Generator Modal */}
      <AnimatePresence>
        {isReportModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-30 p-4"
            onClick={() => setIsReportModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl w-full max-w-sm p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-white font-semibold text-lg mb-4">Generate Report</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-white/70 text-xs mb-1 block">Start Date</label>
                  <Input
                    type="date"
                    value={reportRange.startDate}
                    onChange={(e) => setReportRange({ ...reportRange, startDate: e.target.value ?? "" })}
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>
                <div>
                  <label className="text-white/70 text-xs mb-1 block">End Date</label>
                  <Input
                    type="date"
                    value={reportRange.endDate}
                    onChange={(e) => setReportRange({ ...reportRange, endDate: e.target.value ?? "" })}
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsReportModalOpen(false)}
                    className="flex-1 bg-white/5 border-white/20 text-white"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={generateReport}
                    className="flex-1 bg-gradient-to-r from-[#00C9A7] to-[#9B5DE5] text-white"
                  >
                    Generate
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}