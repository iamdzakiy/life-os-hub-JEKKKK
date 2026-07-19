"use client";
import { useState, useEffect } from "react";
import { collection, addDoc, updateDoc, doc, onSnapshot, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { format } from "date-fns";
import { LayoutList, LayoutGrid } from "lucide-react";

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
  { id: "todo", label: "To Do", color: "border-zinc-600" },
  { id: "in-progress", label: "In Progress", color: "border-blue-600" },
  { id: "review", label: "Review", color: "border-yellow-600" },
  { id: "done", label: "Done", color: "border-green-600" },
] as const;

function ListView({ tasks, archiveTask, updateTaskPriority }: {
  tasks: Task[],
  archiveTask: (task: Task) => void,
  updateTaskPriority: (task: Task, priority: Task["priority"]) => void
}) {
  return (
    <div className="space-y-4">
      {tasks.filter(t => t.status !== "done").map((task) => (
        <div key={task.id} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50 hover:border-zinc-600 transition-colors">
          <div className="flex items-center gap-3">
            <Checkbox 
              checked={task.status === "done"} 
              onCheckedChange={() => archiveTask(task)}
              className="border-zinc-500 data-[state=checked]:bg-blue-600"
            />
            <div>
              <p className="font-medium text-zinc-100">{task.title}</p>
              <p className="text-xs text-zinc-400">{format(new Date(task.dueDate), "dd MMM yyyy")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={task.priority} onValueChange={(v) => updateTaskPriority(task, v as Task["priority"])}>
              <SelectTrigger className="w-24 h-7 bg-zinc-800 border-zinc-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
            <Badge variant={task.priority === "high" ? "destructive" : "secondary"} className="capitalize">
              {task.priority}
            </Badge>
          </div>
        </div>
      ))}
      {tasks.filter(t => t.status !== "done").length === 0 && (
        <p className="text-zinc-500 text-sm text-center py-4">No active tasks. Add one above!</p>
      )}
    </div>
  );
}

function KanbanView({ tasks }: { tasks: Task[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {STATUS_COLUMNS.map((col) => (
        <div key={col.id} className={`space-y-3 p-3 rounded-lg border-t-4 ${col.color} bg-zinc-800/30`}>
          <h3 className="font-semibold text-zinc-200 text-sm uppercase tracking-wider">{col.label}</h3>
          <div className="space-y-2 min-h-32">
            {tasks.filter(t => t.status === col.id).map((task) => (
              <div key={task.id} className="p-3 bg-zinc-800 rounded-lg border border-zinc-700 cursor-move">
                <p className="text-sm font-medium text-zinc-100 mb-2">{task.title}</p>
                <Badge variant={task.priority === "high" ? "destructive" : "secondary"} className="text-xs capitalize">
                  {task.priority}
                </Badge>
              </div>
            ))}
          </div>
        </div>
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

  const archiveTask = async (task: Task) => {
    const taskRef = doc(db, "users", userId, "tasks", task.id);
    await updateDoc(taskRef, { status: "done", completedAt: new Date() });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Input
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="Add new task..."
            className="bg-zinc-800 border-zinc-700 text-zinc-100"
            onKeyDown={(e) => e.key === "Enter" && addTask()}
          />
          <Button onClick={addTask} className="bg-blue-600 hover:bg-blue-700">Add</Button>
        </div>
        
        <div className="flex gap-1">
          <Button
            variant={view === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("list")}
            className={view === "list" ? "bg-zinc-800" : "bg-transparent"}
          >
            <LayoutList className="h-4 w-4" />
          </Button>
          <Button
            variant={view === "kanban" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("kanban")}
            className={view === "kanban" ? "bg-zinc-800" : "bg-transparent"}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {view === "list" ? (
        <ListView tasks={tasks} archiveTask={archiveTask} updateTaskPriority={updateTaskPriority} />
      ) : (
        <KanbanView tasks={tasks} />
      )}
    </div>
  );
}