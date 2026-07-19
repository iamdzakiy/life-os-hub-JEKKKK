"use client";
import { useState, useEffect } from "react";
import { collection, onSnapshot, addDoc, query, orderBy, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion, AnimatePresence } from "framer-motion";
import { format, subDays } from "date-fns";
import { Wallet, Plus, ArrowUpRight, ArrowDownRight, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  type: "income" | "expense";
}

export default function FinanceTracker({ userId }: { userId: string }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTx, setNewTx] = useState({ description: "", amount: "", type: "expense" as "income" | "expense", category: "", date: format(new Date(), "yyyy-MM-dd") });

  useEffect(() => {
    const q = query(collection(db, "users", userId, "transactions"), orderBy("date", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      setTransactions(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Transaction)));
    });
    return () => unsub();
  }, [userId]);

  const totalIncome = transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === "expense").reduce((s, t) => s + Math.abs(t.amount), 0);
  const netWorth = totalIncome - totalExpense;

  const chartData = [...Array(30)].map((_, i) => {
    const date = format(subDays(new Date(), 29 - i), "MMM dd");
    const dayTxs = transactions.filter(t => format(new Date(t.date), "MMM dd") === date);
    const income = dayTxs.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expense = dayTxs.filter(t => t.type === "expense").reduce((s, t) => s + Math.abs(t.amount), 0);
    return { date, net: income - expense };
  });

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
    setIsAddModalOpen(false);
  };

  const deleteTransaction = async (id: string) => {
    await deleteDoc(doc(db, "users", userId, "transactions", id));
  };

  return (
    <div className="space-y-6">
      {/* Net Worth Hero */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-panel md:col-span-2 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -z-10" />
          <CardHeader>
            <CardTitle className="text-zinc-400 text-sm font-medium flex items-center gap-2">
              <Wallet className="h-4 w-4" /> Estimated Net Worth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold gradient-text mb-6">
              Rp {netWorth.toLocaleString()}
            </div>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#52525b" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#52525b" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `${val/1000}k`} />
                  <Tooltip 
                    contentStyle={{ background: "rgba(24, 24, 27, 0.8)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", backdropFilter: "blur(12px)", color: "#fff" }}
                    itemStyle={{ color: "#10b981" }}
                  />
                  <Area type="monotone" dataKey="net" stroke="#10b981" strokeWidth={3} fill="url(#netGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="glass-panel">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-xs uppercase tracking-wider">Total Income</p>
                <p className="text-emerald-400 text-2xl font-bold mt-1 flex items-center gap-2">
                  <ArrowUpRight className="h-5 w-5" /> Rp {totalIncome.toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-panel">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-xs uppercase tracking-wider">Total Expenses</p>
                <p className="text-rose-400 text-2xl font-bold mt-1 flex items-center gap-2">
                  <ArrowDownRight className="h-5 w-5" /> Rp {totalExpense.toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Transactions */}
      <Card className="glass-panel">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-zinc-100 text-sm font-medium">Recent Transactions</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setIsAddModalOpen(true)} className="glass-button text-zinc-300 hover:text-white">
            <Plus className="h-4 w-4 mr-1" /> Add Transaction
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
            <AnimatePresence>
              {transactions.slice(0, 15).map((t) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/15 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${t.type === "income" ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"}`}>
                      {t.type === "income" ? "+" : "–"}
                    </div>
                    <div>
                      <p className="text-zinc-100 text-sm font-medium">{t.description}</p>
                      <p className="text-zinc-500 text-xs">{t.category} • {format(new Date(t.date), "dd MMM yyyy")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className={`text-sm font-semibold ${t.type === "income" ? "text-emerald-400" : "text-rose-400"}`}>
                      {t.type === "income" ? "+" : "–"}Rp {Math.abs(t.amount).toLocaleString()}
                    </p>
                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 hover:bg-red-500/10" onClick={() => deleteTransaction(t.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {transactions.length === 0 && (
              <div className="text-center py-12 text-zinc-500">No transactions yet. Tap + to add one.</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add Transaction Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="glass-panel border-white/20 text-zinc-100 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">Add Transaction</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Select value={newTx.type} onValueChange={(v: any) => setNewTx({ ...newTx, type: v })}>
              <SelectTrigger className="glass-panel bg-transparent text-zinc-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="glass-panel border-white/20 bg-zinc-950/90">
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="Description (e.g., Salary, Groceries)" value={newTx.description} onChange={(e) => setNewTx({ ...newTx, description: e.target.value })} className="glass-panel bg-transparent text-zinc-100 placeholder:text-zinc-500" />
            <Input type="number" placeholder="Amount" value={newTx.amount} onChange={(e) => setNewTx({ ...newTx, amount: e.target.value })} className="glass-panel bg-transparent text-zinc-100 placeholder:text-zinc-500" />
            <Input placeholder="Category (e.g., Food, Transport)" value={newTx.category} onChange={(e) => setNewTx({ ...newTx, category: e.target.value })} className="glass-panel bg-transparent text-zinc-100 placeholder:text-zinc-500" />
            <Input type="date" value={newTx.date} onChange={(e) => setNewTx({ ...newTx, date: e.target.value })} className="glass-panel bg-transparent text-zinc-100" />
          </div>
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="outline" className="glass-button text-zinc-300">Cancel</Button>
            </DialogClose>
            <Button onClick={addTransaction} className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-0 shadow-lg shadow-emerald-500/20">Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}