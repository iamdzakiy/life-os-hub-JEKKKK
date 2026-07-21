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
import { LayoutList, LayoutGrid, Tag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Task {
  id: string;
  title: string;
  status: "todo" | "in-progress" | "review" | "done";
  priority: "low" | "medium" | "high";
  dueDate: string;
  description?: string;
  timeSpent?: number;
  scope?: string;
}

const STATUS_COLUMNS = [
  { id: "todo", label: "To Do", color: "from-zinc-600/20 via-zinc-700/30 to-transparent", icon: "📋" },
  { id: "in-progress", label: "In Progress", color: "from-blue-600/20 via-cyan-600/20 to-transparent", icon: "⚡" },
  { id: "review", label: "Review", color: "from-yellow-600/20 via-amber-600/20 to-transparent", icon: "🔍" },
  { id: "done", label: "Done", color: "from-green-600/20 via-emerald-600/20 to-transparent", icon: "✅" },
] as const;

const TASK_SCOPES = [
  { value: "gsic", label: "GSIC" },
  { value: "imd", label: "IMD" },
  { value: "academic", label: "Academic" },
  { value: "personal", label: "Personal" },
  { value: "work", label: "Work" },
  { value: "health", label: "Health" },
];

const SCOPE_COLORS: Record<string, string> = {
  gsic: "from-cyan-400 to-blue-500",
  imd: "from-purple-400 to-indigo-500",
  academic: "from-emerald-400 to-teal-500",
  personal: "from-amber-400 to-orange-500",
  work: "from-rose-400 to-pink-500",
  health: "from-green-400 to-emerald-500",
};

function ListView({ tasks, archiveTask, updateTaskPriority, updateTaskScope, moveTask }: {
  tasks: Task[],
  archiveTask: (task: Task) => void,
  updateTaskPriority: (task: Task, priority: Task["priority"]) => void,
  updateTaskScope: (task: Task, scope: string) => void,
  moveTask: (task: Task, status: Task["status"]) => void
}) {
  return (
    <div className="space-y-3">
      <AnimatePresence>
        {tasks.filter(t => t.status !== "done").map((task) => (
          <motion.div
            key={task.id}
            layout
            initial={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100, transition: { duration: 0.3, ease: "easeOut" } }}
            className="flex items-center justify-between p-3 bg-white/5 backdrop-blur-md rounded-lg border border-white/10 hover:border-white/20 transition-all"
          >
            <div className="flex items-center gap-3">
              <Checkbox 
                checked={task.status === "done"} 
                onCheckedChange={() => archiveTask(task)}
                className="border-white/30 data-checked:bg-emerald-500"
              />
              <div>
                <p className="font-medium text-zinc-100">{task.title}</p>
                <p className="text-xs text-zinc-400">{format(new Date(task.dueDate), "dd MMM yyyy")}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Select value={task.status} onValueChange={(v) => moveTask(task, v as Task["status"])}>
                <SelectTrigger className="w-32 h-7 bg-white/5 border-white/10 text-zinc-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass-panel border-white/20 bg-zinc-950/90">
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
              <Select value={task.priority} onValueChange={(v) => updateTaskPriority(task, v as Task["priority"])}>
                <SelectTrigger className="w-24 h-7 bg-white/5 border-white/10 text-zinc-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass-panel border-white/20 bg-zinc-950/90">
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
              <Select value={task.scope ?? ""} onValueChange={(v) => updateTaskScope(task, v || "")}>
                <SelectTrigger className="w-24 h-7 bg-white/5 border-white/10 text-zinc-100">
                  <SelectValue placeholder="Scope" />
                </SelectTrigger>
                <SelectContent className="glass-panel border-white/20 bg-zinc-950/90">
                  {TASK_SCOPES.map(scope => (
                    <SelectItem key={scope.value} value={scope.value}>{scope.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Badge 
                variant={task.priority === "high" ? "destructive" : "secondary"} 
                className="capitalize bg-white/10 border-white/10 text-zinc-300"
              >
                {task.priority}
              </Badge>
              {task.scope && (
                <Badge className={`bg-gradient-to-r ${SCOPE_COLORS[task.scope] || "from-cyan-400 to-blue-500"} text-white border-0 text-xs`}>
                  <Tag className="h-3 w-3 mr-1" />
                  {TASK_SCOPES.find(s => s.value === task.scope)?.label || task.scope}
                </Badge>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
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
  const [showToast, setShowToast] = useState(false);
  
  const handleMove = (task: Task, status: Task["status"]) => {
    moveTask(task, status);
    if (status === "done") {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

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
                  whileHover={{ scale: 1.02 }}
                  className="p-3 bg-white/5 backdrop-blur-md rounded-lg border border-white/10 cursor-move hover:border-white/20 transition-all"
                >
                  <p className="text-sm font-medium text-zinc-100 mb-2">{task.title}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Badge variant={task.priority === "high" ? "destructive" : "secondary"} className="text-xs capitalize bg-white/10 border-white/10 text-zinc-300">
                        {task.priority}
                      </Badge>
                      {task.scope && (
                        <Badge className={`bg-gradient-to-r ${SCOPE_COLORS[task.scope] || "from-cyan-400 to-blue-500"} text-white border-0 text-xs`}>
                          <Tag className="h-3 w-3 mr-1" />
                          {TASK_SCOPES.find(s => s.value === task.scope)?.label || task.scope}
                        </Badge>
                      )}
                    </div>
                    <Select value={task.status} onValueChange={(v) => handleMove(task, v as Task["status"])}>
                      <SelectTrigger className="w-20 h-6 bg-white/5 border-white/10 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="glass-panel border-white/20 bg-zinc-950/90">
                        <SelectItem value="todo">To Do</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="review">Review</SelectItem>
                        <SelectItem value="done">Done</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      ))}
      
      {/* Task completed toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-emerald-500/90 backdrop-blur-md text-white text-sm font-medium shadow-lg"
          >
            Task completed! 🎉
          </motion.div>
        )}
      </AnimatePresence>
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
      scope: "",
      createdAt: new Date(),
    });
    setNewTask("");
  };

  const updateTaskPriority = async (task: Task, priority: Task["priority"]) => {
    const taskRef = doc(db, "users", userId, "tasks", task.id);
    await updateDoc(taskRef, { priority });
  };

  const updateTaskScope = async (task: Task, scope: string) => {
    const taskRef = doc(db, "users", userId, "tasks", task.id);
    await updateDoc(taskRef, { scope });
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
            <ListView tasks={tasks} archiveTask={archiveTask} updateTaskPriority={updateTaskPriority} updateTaskScope={updateTaskScope} moveTask={moveTask} />
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