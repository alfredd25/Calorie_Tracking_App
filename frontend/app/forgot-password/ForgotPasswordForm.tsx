"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { forgotPassword } from "@/services/api";

function getErrorMessage(err: unknown, fallback: string) {
  if (typeof err === "object" && err !== null && "detail" in err) {
    const detail = (err as { detail?: unknown }).detail;
    if (typeof detail === "string") return detail;
  }
  return fallback;
}

export default function ForgotPasswordForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState("");

  useEffect(() => {
    if (searchParams.get("error") === "invalid_token") {
      setBanner("This reset link has expired or is invalid. Please request a new one.");
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const data = await forgotPassword(email);
      setMessage(data.message || "If that email exists, a reset link has been sent.");
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Unable to request password reset"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="text-2xl font-semibold tracking-tight">NutriTrack</span>
          <p className="mt-1.5 text-sm text-muted">Reset your password</p>
        </div>

        <div className="bg-white border border-border rounded-xl p-8 shadow-sm">
          {banner && (
            <div role="alert" className="mb-5 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
              {banner}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-medium text-muted uppercase tracking-wider">
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/30 placeholder:text-subtle transition-all"
              />
            </div>

            {message && (
              <p className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
                {message}
              </p>
            )}
            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-foreground text-white rounded-lg text-sm font-medium hover:bg-zinc-700 disabled:opacity-50 transition-colors flex justify-center items-center"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Send reset link"
              )}
            </button>

            <p className="text-center text-sm text-muted pt-1">
              Remembered it?{" "}
              <Link href="/" className="text-foreground font-medium hover:underline underline-offset-2 transition-colors">
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
