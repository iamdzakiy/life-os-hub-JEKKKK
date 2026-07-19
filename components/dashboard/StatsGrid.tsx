// components/dashboard/StatsGrid.tsx
"use client";

import { motion } from "framer-motion";
import { ArrowUp, ArrowDown, TrendingUp, Clock, CheckCircle, Flame } from "lucide-react";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  change?: number;
  trend?: "up" | "down";
  color: string;
}

function StatCard({ icon, label, value, change, trend, color }: StatCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="glass-panel rounded-2xl p-5 border border-white/5 hover:border-white/15 transition-all"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">
            {label}
          </p>
          <p className="text-2xl font-bold text-zinc-100 mt-1.5">{value}</p>
        </div>
        <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center`}>
          {icon}
        </div>
      </div>
      {change !== undefined && (
        <div className="flex items-center gap-1.5 mt-3">
          {trend === "up" ? (
            <ArrowUp className="h-3.5 w-3.5 text-emerald-400" />
          ) : (
            <ArrowDown className="h-3.5 w-3.5 text-rose-400" />
          )}
          <span className={`text-xs font-medium ${trend === "up" ? "text-emerald-400" : "text-rose-400"}`}>
            {change}%
          </span>
          <span className="text-xs text-zinc-500">vs last week</span>
        </div>
      )}
    </motion.div>
  );
}

export default function StatsGrid({ userId }: { userId: string }) {
  // These would come from real data — using mock for demo
  const stats = [
    { icon: <CheckCircle className="h-5 w-5 text-white" />, label: "Tasks Done", value: "12", change: 8, trend: "up" as const, color: "from-emerald-400 to-teal-600" },
    { icon: <Flame className="h-5 w-5 text-white" />, label: "Habit Streak", value: "7 days", change: 3, trend: "up" as const, color: "from-orange-400 to-amber-600" },
    { icon: <TrendingUp className="h-5 w-5 text-white" />, label: "Net Worth", value: "Rp 12.4M", change: 5, trend: "up" as const, color: "from-cyan-400 to-blue-600" },
    { icon: <Clock className="h-5 w-5 text-white" />, label: "Focus Time", value: "4.2h", change: -2, trend: "down" as const, color: "from-violet-400 to-purple-600" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <StatCard key={i} {...stat} />
      ))}
    </div>
  );
}