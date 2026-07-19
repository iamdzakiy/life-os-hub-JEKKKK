"use client";
import { useState, useEffect } from "react";
import { collection, addDoc, updateDoc, doc, onSnapshot, query, where, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface Task { id: string; title: string; status: string; priority: string; dueDate: string; }

export default function TaskTracker({ userId }: { userId: string }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState("");

  useEffect(() => {
    const q = query(collection(db, "users", userId, "tasks"), where("status", "!=", "done"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTasks(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Task)));
    });
    return () => unsubscribe();
  }, [userId]);

  const addTask = async () => {
    if (!newTask.trim()) return;
    await addDoc(collection(db, "users", userId, "tasks"), {
      title: newTask, status: "todo", priority: "medium", dueDate: new Date().toISOString(), createdAt: new Date(),
    });
    setNewTask("");
  };

  const completeTask = async (task: Task) => {
    const batch = writeBatch(db);
    const taskRef = doc(db, "users", userId, "tasks", task.id);
    const archiveRef = doc(collection(db, "users", userId, "tasks_archive"));
    
    // 1. Tandai sebagai done di koleksi aktif (atau hapus, tergantung preferensi UI)
    batch.update(taskRef, { status: "done" });
    // 2. Salin ke arsip dengan timestamp penyelesaian
    batch.set(archiveRef, { ...task, status: "done", completedAt: new Date() });
    
    await batch.commit();
    // CATATAN: Di sini Anda bisa memicu Cloud Function untuk sinkronisasi ke Google Sheets
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input value={newTask} onChange={(e) => setNewTask(e.target.value)} placeholder="Tambah tugas baru..." className="bg-zinc-800 border-zinc-700 text-zinc-100" onKeyDown={(e) => e.key === "Enter" && addTask()} />
        <Button onClick={addTask} className="bg-blue-600 hover:bg-blue-700">Tambah</Button>
      </div>
      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
        {tasks.map((task) => (
          <div key={task.id} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50 hover:border-zinc-600 transition-colors">
            <div className="flex items-center gap-3">
              <Checkbox onCheckedChange={() => completeTask(task)} className="border-zinc-500 data-[state=checked]:bg-blue-600" />
              <div>
                <p className="font-medium text-zinc-100">{task.title}</p>
                <p className="text-xs text-zinc-400">{format(new Date(task.dueDate), "dd MMM yyyy, HH:mm")}</p>
              </div>
            </div>
            <Badge variant={task.priority === "high" ? "destructive" : "secondary"} className="capitalize">{task.priority}</Badge>
          </div>
        ))}
      </div>
    </div>
  );
}