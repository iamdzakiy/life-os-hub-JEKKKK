"use client";

import { useState, useEffect } from "react";
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { format } from "date-fns";
import { LayoutList, LayoutGrid } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Task {
  id: string;
  title: string;
  status: "todo" | "in-progress" | "review" | "done";
  priority: "low" | "medium" | "high";
  dueDate: string;
  description?: string;
  timeSpent?: number;
}

const STATUS_COLUMNS = [
  { id: "todo", label: "To Do", color: "from-zinc-600/20", icon: "📋" },
  { id: "in-progress", label: "In Progress", color: "from-blue-600/20", icon: "⚡" },
  { id: "review", label: "Review", color: "from-yellow-600/20", icon: "🔍" },
  { id: "done", label: "Done", color: "from-green-600/20", icon: "✅" },
] as const;

function ListView({ tasks, archiveTask, updateTaskPriority, moveTask }: {
  tasks: Task[],
  archiveTask: (task: Task) => void,
  updateTaskPriority: (task: Task, priority: Task["priority"]) => void,
  moveTask: (task: Task, status: Task["status"]) => void
}) {
  return (
    <div className="space-y-3">
      {tasks.filter(t => t.status !== "done").map((task) => (
        <motion.div
          key={task.id}
          layout
          initial={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100, transition: { duration: 0.3 } }}
          className="flex items-center justify-between p-3 bg-white/5 backdrop-blur-md rounded-lg border border-white/10 hover:border-white/20 transition-all"
        >
          <div className="flex items-center gap-3">
            <Checkbox 
              checked={task.status === "done"} 
              onCheckedChange={() => archiveTask(task)}
              className="border-white/30"
            />
            <div>
              <p className="font-medium text-zinc-100">{task.title}</p>
              <p className="text-xs text-zinc-400">{format(new Date(task.dueDate), "dd MMM yyyy")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={task.status} onValueChange={(v) => moveTask(task, v as Task["status"])}>
              <SelectTrigger className="w-32 h-7 bg-white/5 border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todo">To Do</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="review">Review</SelectItem>
                <SelectItem value="done">Done</SelectItem>
              </SelectContent>
            </Select>
            <Select value={task.priority} onValueChange={(v) => updateTaskPriority(task, v as Task["priority"])}>
              <SelectTrigger className="w-24 h-7 bg-white/5 border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
            <Badge 
              variant={task.priority === "high" ? "destructive" : "secondary"} 
              className="capitalize bg-white/10 border-white/10"
            >
              {task.priority}
            </Badge>
          </div>
        </motion.div>
      ))}
      {tasks.filter(t => t.status !== "done").length === 0 && (
        <p className="text-zinc-500 text-sm text-center py-4">No active tasks. Add one above!</p>
      )}
    </div>
  );
}

function KanbanView({ tasks, moveTask }: { 
  tasks: Task[], 
  moveTask: (task: Task, status: Task["status"]) => void 
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {STATUS_COLUMNS.map((col) => (
        <motion.div 
          key={col.id} 
          className={`space-y-3 p-4 rounded-xl bg-gradient-to-b ${col.color} to-transparent border border-white/5`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h3 className="font-semibold text-zinc-200 text-sm uppercase tracking-wider flex items-center gap-2">
            <span>{col.icon}</span> {col.label}
          </h3>
          <div className="space-y-2 min-h-32">
            <AnimatePresence>
              {tasks.filter(t => t.status === col.id).map((task) => (
                <motion.div 
                  key={task.id} 
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="p-3 bg-white/5 backdrop-blur-md rounded-lg border border-white/10 cursor-move hover:border-white/20"
                >
                  <p className="text-sm font-medium text-zinc-100 mb-2">{task.title}</p>
                  <Badge variant={task.priority === "high" ? "destructive" : "secondary"} className="text-xs capitalize bg-white/10 border-white/10">
                    {task.priority}
                  </Badge>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export default function TaskTracker({ userId }: { userId: string }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState("");
  const [view, setView] = useState<"list" | "kanban">("list");

  useEffect(() => {
    const q = query(collection(db, "users", userId, "tasks"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTasks(snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Task)));
    });
    return () => unsubscribe();
  }, [userId]);

  const addTask = async () => {
    if (!newTask.trim()) return;
    await addDoc(collection(db, "users", userId, "tasks"), {
      title: newTask,
      status: "todo",
      priority: "medium",
      dueDate: new Date().toISOString(),
      description: "",
      timeSpent: 0,
      createdAt: new Date(),
    });
    setNewTask("");
  };

  const updateTaskPriority = async (task: Task, priority: Task["priority"]) => {
    const taskRef = doc(db, "users", userId, "tasks", task.id);
    await updateDoc(taskRef, { priority });
  };

  const moveTask = async (task: Task, status: Task["status"]) => {
    const taskRef = doc(db, "users", userId, "tasks", task.id);
    if (status === "done") {
      // Archive to tasks_archive collection
      const taskData = { ...task, status, completedAt: new Date().toISOString() };
      await addDoc(collection(db, "users", userId, "tasks_archive"), taskData);
      // Delete from active tasks
      await deleteDoc(taskRef);
    } else {
      await updateDoc(taskRef, { status });
    }
  };

  const archiveTask = async (task: Task) => {
    await moveTask(task, "done");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex gap-2 flex-1">
          <Input
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="Add new task..."
            className="bg-white/5 backdrop-blur-md border border-white/10 text-zinc-100 placeholder:text-zinc-400 focus:border-cyan-500/50"
            onKeyDown={(e) => e.key === "Enter" && addTask()}
          />
          <Button onClick={addTask} className="bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white hover:opacity-90">
            Add
          </Button>
        </div>
        
        <div className="flex gap-1 ml-4">
          <Button
            variant={view === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("list")}
            className={view === "list" ? "bg-white/10" : "bg-transparent border-white/10"}
          >
            <LayoutList className="h-4 w-4" />
          </Button>
          <Button
            variant={view === "kanban" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("kanban")}
            className={view === "kanban" ? "bg-white/10" : "bg-transparent border-white/10"}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <AnimatePresence mode="wait">
        {view === "list" ? (
          <motion.div
            key="list"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <ListView tasks={tasks} archiveTask={archiveTask} updateTaskPriority={updateTaskPriority} moveTask={moveTask} />
          </motion.div>
        ) : (
          <motion.div
            key="kanban"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <KanbanView tasks={tasks} moveTask={moveTask} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}