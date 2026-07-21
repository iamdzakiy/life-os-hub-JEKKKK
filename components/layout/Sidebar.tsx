"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  CheckSquare,
  Sprout,
  Wallet,
  Calendar,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Heart,
  BookOpen,
  Sun,
  StickyNote,
} from "lucide-react";
import { signOut } from "@/components/AuthGuard";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Sun, label: "Today", href: "/dashboard?tab=today" },
  { icon: CheckSquare, label: "Tasks", href: "/dashboard?tab=tasks" },
  { icon: Sprout, label: "Habits", href: "/dashboard?tab=habits" },
  { icon: Wallet, label: "Finance", href: "/dashboard?tab=finance" },
  { icon: Calendar, label: "Agenda", href: "/dashboard?tab=agenda" },
  { icon: Heart, label: "Dreams", href: "/dashboard?tab=dreams" },
  { icon: BookOpen, label: "Media", href: "/dashboard?tab=media" },
  { icon: StickyNote, label: "Notes", href: "/dashboard?tab=notes" },
];

interface SidebarProps {
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
}

export default function Sidebar({ collapsed, onCollapse }: SidebarProps) {
  const pathname = usePathname();

  const getActiveTab = () => {
    if (pathname === "/dashboard") {
      const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
      return searchParams.get("tab") || "dashboard";
    }
    return "dashboard";
  };

  const activeTab = getActiveTab();

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className={cn(
        "fixed left-0 top-0 z-50 h-full bg-zinc-950/80 backdrop-blur-xl border-r border-white/5 transition-all duration-300 ease-in-out overflow-hidden",
        collapsed ? "w-16" : "w-56"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-3 border-b border-white/5">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="h-8 w-8 min-w-8 rounded-xl bg-gradient-to-br from-cyan-400 to-indigo-600 flex items-center justify-center">
            <LayoutDashboard className="h-4 w-4 text-white" />
          </div>
          {!collapsed && (
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-bold text-sm gradient-text whitespace-nowrap">
              Life OS Hub
            </motion.span>
          )}
        </div>
        <button
          onClick={() => onCollapse(!collapsed)}
          className="text-zinc-500 hover:text-zinc-300 p-1 rounded-md hover:bg-white/5 transition-all flex-shrink-0"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="mt-4 px-2 space-y-1">
        {navItems.map((item) => {
          const tabValue = item.href.split("tab=")[1] || "dashboard";
          const isActive = activeTab === tabValue || (activeTab === "dashboard" && tabValue === "dashboard");
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-xl transition-all relative group",
                isActive
                  ? "bg-white/10 text-white shadow-lg shadow-white/5"
                  : "text-zinc-400 hover:text-zinc-100 hover:bg-white/5"
              )}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              {!collapsed && (
                <span className="text-xs font-medium whitespace-nowrap">{item.label}</span>
              )}
              {isActive && !collapsed && (
                <motion.div layoutId="activeTab" className="ml-auto h-1.5 w-1.5 rounded-full bg-cyan-400" />
              )}
              {isActive && collapsed && (
                <motion.div layoutId="activeTabIndicator" className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 rounded-r-full bg-cyan-400" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-white/5">
        <button
          onClick={signOut}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-zinc-400 hover:text-zinc-100 hover:bg-white/5 transition-all"
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {!collapsed && <span className="text-xs">Sign Out</span>}
        </button>
      </div>
    </motion.aside>
  );
}