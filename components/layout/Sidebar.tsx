// components/layout/Sidebar.tsx
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
  Plus,
  Search,
  Bell,
  User,
} from "lucide-react";
import { signOut } from "@/components/AuthGuard";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: CheckSquare, label: "Tasks", href: "/dashboard?tab=tasks" },
  { icon: Sprout, label: "Habits", href: "/dashboard?tab=habits" },
  { icon: Wallet, label: "Finance", href: "/dashboard?tab=finance" },
  { icon: Calendar, label: "Agenda", href: "/dashboard?tab=agenda" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className={`fixed left-0 top-0 z-50 h-full bg-zinc-950/80 backdrop-blur-xl border-r border-white/5 transition-all duration-300 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-cyan-400 to-indigo-600 flex items-center justify-center">
            <LayoutDashboard className="h-4 w-4 text-white" />
          </div>
          {!collapsed && (
            <span className="font-bold text-sm gradient-text">Life OS</span>
          )}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-zinc-500 hover:text-zinc-300"
        >
          {collapsed ? "→" : "←"}
        </button>
      </div>

      {/* Navigation */}
      <nav className="mt-6 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || 
            (pathname === "/dashboard" && item.href.includes("tab=") && 
             new URLSearchParams(window.location.search).get("tab") === item.href.split("=")[1]);
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                isActive
                  ? "bg-white/10 text-white shadow-lg shadow-white/5"
                  : "text-zinc-400 hover:text-zinc-100 hover:bg-white/5"
              }`}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && (
                <span className="text-sm font-medium">{item.label}</span>
              )}
              {isActive && !collapsed && (
                <motion.div
                  layoutId="activeTab"
                  className="ml-auto h-1.5 w-1.5 rounded-full bg-cyan-400"
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/5">
        <button
          onClick={signOut}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-zinc-400 hover:text-zinc-100 hover:bg-white/5 transition-all"
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && <span className="text-sm">Sign Out</span>}
        </button>
      </div>
    </motion.aside>
  );
}