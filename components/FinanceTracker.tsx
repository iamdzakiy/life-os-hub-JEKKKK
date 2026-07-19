"use client";
import { useState, useEffect } from "react";
import Papa from "papaparse";
import { collection, doc, writeBatch, onSnapshot, addDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { UploadCloud, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  timestamp: Date;
}

interface NetWorthEntry {
  id: string;
  date: string;
  assets: number;
  liabilities: number;
}

export default function FinanceTracker({ userId }: { userId: string }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [netWorth, setNetWorth] = useState<NetWorthEntry[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [newAsset, setNewAsset] = useState(0);
  const [newLiability, setNewLiability] = useState(0);

  useEffect(() => {
    const unsub1 = onSnapshot(collection(db, "users", userId, "transactions"), (snapshot) => {
      setTransactions(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Transaction)));
    });
    const unsub2 = onSnapshot(collection(db, "users", userId, "net_worth"), (snapshot) => {
      setNetWorth(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as NetWorthEntry)));
    });
    return () => { unsub1(); unsub2(); };
  }, [userId]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results: Papa.ParseResult<Record<string, string>>) => {
        const batch = writeBatch(db);
        const transactionsRef = collection(db, "users", userId, "transactions");

        const mappedData = results.data.map((row: Record<string, string>) => ({
          date: row.Date || row.Tanggal || row.date || new Date().toISOString(),
          description: row.Description || row.Deskripsi || row.description || "",
          amount: parseFloat(row.Amount || row.Jumlah || row.amount || "0") || 0,
          type: (parseFloat(row.Amount || row.Jumlah || row.amount || "0") || 0) > 0 ? "income" : "expense",
          category: row.Category || row.Kategori || row.category || "Uncategorized",
          timestamp: new Date(),
        }));

        mappedData.forEach((data: Record<string, unknown>) => {
          const docRef = doc(transactionsRef);
          batch.set(docRef, data);
        });

        await batch.commit();
        setIsUploading(false);
        alert(`Successfully uploaded ${mappedData.length} transactions!`);
      },
      error: (error: Error) => {
        console.error("CSV Parse Error:", error);
        setIsUploading(false);
        alert("Failed to process CSV file.");
      }
    });
  };

  const saveNetWorth = async () => {
    if (newAsset <= 0 && newLiability < 0) return;
    const today = new Date().toISOString().split("T")[0];
    const netWorthRef = collection(db, "users", userId, "net_worth");
    
    // Check if entry exists for today
    const existing = netWorth.find(e => e.date === today);
    if (existing) {
      await updateDoc(doc(db, "users", userId, "net_worth", existing.id), {
        assets: newAsset,
        liabilities: newLiability,
      });
    } else {
      await addDoc(netWorthRef, {
        date: today,
        assets: newAsset,
        liabilities: newLiability,
      });
    }
  };

  const totalIncome = transactions.filter(t => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === "expense").reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const netWorthChart = netWorth.slice(-12).map(e => ({
    date: e.date,
    netWorth: e.assets - (e.liabilities > 0 ? e.liabilities : 0),
  }));

  return (
    <div className="space-y-6">
      {/* CSV Upload Section */}
      <Card className="bg-zinc-900 border-zinc-800 text-zinc-100">
        <CardHeader>
          <CardTitle>CSV Transaction Import</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-zinc-700 rounded-lg p-8 text-center hover:bg-zinc-800/50 transition-colors">
            <UploadCloud className="mx-auto h-10 w-10 text-zinc-400 mb-4" />
            <p className="text-sm text-zinc-400 mb-4">
              Drag & drop CSV file or click button below
            </p>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
              id="csv-upload"
              disabled={isUploading}
            />
            <label htmlFor="csv-upload">
              <Button variant="outline" className="cursor-pointer border-zinc-700 hover:bg-zinc-800" disabled={isUploading}>
                {isUploading ? "Processing..." : "Choose CSV File"}
              </Button>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-400">Total Income</p>
                <p className="text-xl font-bold text-green-500">Rp {totalIncome.toLocaleString()}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-400">Total Expenses</p>
                <p className="text-xl font-bold text-red-500">Rp {totalExpense.toLocaleString()}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-400">Net Balance</p>
                <p className="text-xl font-bold text-blue-500">Rp {(totalIncome - totalExpense).toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Net Worth Tracker */}
      <Card className="bg-zinc-900 border-zinc-800 text-zinc-100">
        <CardHeader>
          <CardTitle>Net Worth Tracker</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-zinc-400">Assets (Rp)</label>
              <Input
                type="number"
                value={newAsset || ""}
                onChange={(e) => setNewAsset(parseFloat(e.target.value) || 0)}
                placeholder="Enter asset value"
                className="bg-zinc-800 border-zinc-700 text-zinc-100 mt-1"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400">Liabilities (Rp)</label>
              <Input
                type="number"
                value={newLiability || ""}
                onChange={(e) => setNewLiability(parseFloat(e.target.value) || 0)}
                placeholder="Enter liability value"
                className="bg-zinc-800 border-zinc-700 text-zinc-100 mt-1"
              />
            </div>
          </div>
          <Button onClick={saveNetWorth} className="w-full bg-blue-600 hover:bg-blue-700">
            Save Net Worth
          </Button>
        </CardContent>
      </Card>

      {/* Net Worth Chart */}
      {netWorthChart.length > 0 && (
        <Card className="bg-zinc-900 border-zinc-800 text-zinc-100">
          <CardHeader>
            <CardTitle>Net Worth Trend (Last 12 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={netWorthChart}>
                  <XAxis dataKey="date" stroke="#71717a" fontSize={10} />
                  <YAxis stroke="#71717a" fontSize={10} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#27272a", border: "1px solid #3f3f46" }}
                    labelStyle={{ color: "#e4e4e7" }}
                  />
                  <Bar dataKey="netWorth" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}