"use client";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is already authenticated
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        router.push("/dashboard");
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login error:", error);
      alert("Login failed. Please try again.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4">
      <Card className="w-full max-w-md bg-zinc-900 border-zinc-800">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-zinc-100">Life OS Hub</CardTitle>
          <CardDescription className="text-zinc-400">
            Private dashboard - Sign in with your whitelisted Google account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleGoogleSignIn}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            size="lg"
          >
            <LogIn className="mr-2 h-5 w-5" />
            Sign in with Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}