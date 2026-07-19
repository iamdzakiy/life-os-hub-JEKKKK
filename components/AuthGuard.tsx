"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

const SESSION_KEY = "life-os-auth";

export function signOut() {
  sessionStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem("life-os-user");
  window.location.href = "/login";
}

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      const session = sessionStorage.getItem(SESSION_KEY);
      
      if (session === "authenticated") {
        setAuthorized(true);
      } else {
        router.push("/login");
      }
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex h-screen w-full items-center justify-center bg-zinc-950 text-zinc-100"
      >
        <Loader2 className="h-8 w-8 animate-spin" />
      </motion.div>
    );
  }

  if (!authorized) return null;
  
  return <>{children}</>;
}