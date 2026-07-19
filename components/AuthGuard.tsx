"use client";
import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Get owner email from environment - check both localStorage and env
        const ownerEmail = process.env.NEXT_PUBLIC_OWNER_EMAIL;
        if (!ownerEmail) {
          console.error("Owner email not configured");
          signOut(auth);
          router.push("/login");
          return;
        }
        
        if (user.email?.toLowerCase() === ownerEmail.toLowerCase()) {
          setAuthorized(true);
        } else {
          signOut(auth);
          alert("ACCESS DENIED: This is a private dashboard.");
          router.push("/login");
        }
      } else {
        router.push("/login");
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zinc-950 text-zinc-100">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!authorized) return null;
  return <>{children}</>;
}