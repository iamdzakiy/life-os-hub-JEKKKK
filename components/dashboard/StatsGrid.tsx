// components/dashboard/StatsGrid.tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, ArrowDown, TrendingUp, Clock, CheckCircle, Flame } from "lucide-react";
import { useState, useEffect } from "react";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  change?: number;
  trend?: "up" | "down";
  color: string;
  formatter?: (value: number) => string;
}

// Count animation hook
function useCountAnimation(endValue: number, duration: number = 1500) {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    let startTime: number;
    let animationFrame: number;
    
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * endValue));
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };
    
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [endValue, duration]);
  
  return count;
}

function StatCard({ icon, label, value, change, trend, color, formatter }: StatCardProps) {
  const animatedValue = useCountAnimation(value);
  
  return (
    <motion.div
      whileHover={{ y: -4, transition: { type: "spring", stiffness: 400 } }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="glass-panel rounded-2xl p-5 border border-white/5 hover:border-white/15 transition-all"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">
            {label}
          </p>
          <p className="text-2xl font-bold text-zinc-100 mt-1.5">
            {formatter ? formatter(animatedValue) : animatedValue}
          </p>
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
  const stats: StatCardProps[] = [
    { 
      icon: <CheckCircle className="h-5 w-5 text-white" />, 
      label: "Tasks Done", 
      value: 12, 
      change: 8, 
      trend: "up" as const, 
      color: "from-emerald-400 to-teal-600" 
    },
    { 
      icon: <Flame className="h-5 w-5 text-white" />, 
      label: "Habit Streak", 
      value: 7, 
      change: 3, 
      trend: "up" as const, 
      color: "from-amber-400 to-orange-600",
      formatter: (v) => `${v} days`
    },
    { 
      icon: <TrendingUp className="h-5 w-5 text-white" />, 
      label: "Net Worth", 
      value: 12400000, 
      change: 5, 
      trend: "up" as const, 
      color: "from-cyan-400 to-blue-600",
      formatter: (v) => `Rp ${v.toLocaleString()}`
    },
    { 
      icon: <Clock className="h-5 w-5 text-white" />, 
      label: "Focus Time", 
      value: 4.2, 
      change: -2, 
      trend: "down" as const, 
      color: "from-violet-400 to-purple-600",
      formatter: (v) => `${v.toFixed(1)}h`
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <StatCard key={i} {...stat} />
      ))}
    </div>
  );
}