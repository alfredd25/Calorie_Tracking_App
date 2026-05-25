"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { resetPassword, verifyResetToken } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// ── Password strength rules ────────────────────────────────────────────────

interface Rule {
  label: string;
  test: (v: string) => boolean;
}

const PASSWORD_RULES: Rule[] = [
  { label: "At least 8 characters",      test: (v) => v.length >= 8 },
  { label: "One uppercase letter (A–Z)",  test: (v) => /[A-Z]/.test(v) },
  { label: "One lowercase letter (a–z)",  test: (v) => /[a-z]/.test(v) },
  { label: "One digit (0–9)",             test: (v) => /\d/.test(v) },
  { label: "One special character",       test: (v) => /[^A-Za-z0-9]/.test(v) },
];

function passwordIsValid(value: string): boolean {
  return PASSWORD_RULES.every((r) => r.test(value));
}

// ── Error helper ───────────────────────────────────────────────────────────

function getErrorMessage(err: unknown, fallback: string): string {
  if (typeof err === "object" && err !== null && "detail" in err) {
    const detail = (err as { detail?: unknown }).detail;
    if (typeof detail === "string") return detail;
  }
  return fallback;
}

// ── Component ──────────────────────────────────────────────────────────────

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useParams<{ token: string }>();

  const [password, setPassword]               = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage]                 = useState("");
  const [error, setError]                     = useState("");
  const [loading, setLoading]                 = useState(false);
  const [verifying, setVerifying]             = useState(true);

  // ── Token pre-check on mount ─────────────────────────────────────────────
  useEffect(() => {
    async function checkToken() {
      try {
        await verifyResetToken(params.token);
      } catch {
        // Token is invalid or expired — redirect immediately.
        router.replace("/forgot-password?error=invalid_token");
        return;
      } finally {
        setVerifying(false);
      }
    }
    checkToken();
  }, [params.token, router]);

  // ── Submit ───────────────────────────────────────────────────────────────
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const data = await resetPassword(params.token, password);
      setMessage(data.message || "Password reset successful");
      setTimeout(() => router.push("/login"), 1200);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Unable to reset password"));
    } finally {
      setLoading(false);
    }
  }

  // ── Loading state while verifying token ─────────────────────────────────
  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-500 text-sm">Verifying reset link…</p>
      </div>
    );
  }

  const canSubmit = passwordIsValid(password) && password === confirmPassword;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Reset Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>

            {/* New password */}
            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
              <Input
                id="password"
                type="password"
                placeholder="New password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {/* Live strength checklist */}
            {password.length > 0 && (
              <ul className="space-y-1 text-xs pl-1">
                {PASSWORD_RULES.map((rule) => {
                  const passed = rule.test(password);
                  return (
                    <li
                      key={rule.label}
                      className={passed ? "text-green-600" : "text-red-500"}
                    >
                      {passed ? "✓" : "✗"} {rule.label}
                    </li>
                  );
                })}
              </ul>
            )}

            {/* Confirm password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              {confirmPassword.length > 0 && password !== confirmPassword && (
                <p className="text-xs text-red-500">Passwords do not match</p>
              )}
            </div>

            {message && <p className="text-sm text-green-600">{message}</p>}
            {error   && <p className="text-sm text-red-500">{error}</p>}

            <Button
              className="w-full"
              type="submit"
              disabled={loading || !canSubmit}
            >
              {loading ? "Resetting…" : "Reset password"}
            </Button>

            <p className="text-center text-sm text-slate-500">
              <Link href="/login" className="text-blue-600 hover:underline">
                Back to login
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
