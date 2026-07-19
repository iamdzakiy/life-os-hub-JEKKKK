"use client";
import { useState } from "react";
import Papa from "papaparse";
import { collection, doc, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadCloud } from "lucide-react";

export default function FinanceTracker({ userId }: { userId: string }) {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const batch = writeBatch(db);
        const transactionsRef = collection(db, "users", userId, "transactions");

        results.data.forEach((row: any) => {
          const docRef = doc(transactionsRef);
          const amount = parseFloat(row.Amount || row.Jumlah || row.nominal) || 0;
          batch.set(docRef, {
            date: row.Date || row.Tanggal || new Date().toISOString(),
            description: row.Description || row.Deskripsi || row.keterangan,
            amount: amount,
            type: amount > 0 ? "income" : "expense",
            category: row.Category || row.Kategori || "Uncategorized",
            timestamp: new Date(),
          });
        });

        await batch.commit();
        setIsUploading(false);
        alert(`Berhasil mengunggah ${results.data.length} transaksi!`);
      },
      error: (error) => {
        console.error("CSV Parse Error:", error);
        setIsUploading(false);
        alert("Gagal memproses file CSV.");
      }
    });
  };

  return (
    <Card className="bg-zinc-900 border-zinc-800 text-zinc-100">
      <CardHeader><CardTitle>Manajemen Keuangan & Import CSV</CardTitle></CardHeader>
      <CardContent>
        <div className="border-2 border-dashed border-zinc-700 rounded-lg p-8 text-center hover:bg-zinc-800/50 transition-colors">
          <UploadCloud className="mx-auto h-10 w-10 text-zinc-400 mb-4" />
          <p className="text-sm text-zinc-400 mb-4">Drag & drop file CSV transaksi bank, atau klik tombol di bawah</p>
          <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" id="csv-upload" disabled={isUploading} />
          <label htmlFor="csv-upload">
            <Button variant="outline" className="cursor-pointer border-zinc-700 hover:bg-zinc-800" disabled={isUploading}>
              {isUploading ? "Memproses Data..." : "Pilih File CSV"}
            </Button>
          </label>
        </div>
      </CardContent>
    </Card>
  );
}