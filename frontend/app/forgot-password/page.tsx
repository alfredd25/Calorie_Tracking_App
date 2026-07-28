import { Suspense } from "react";
import ForgotPasswordForm from "./ForgotPasswordForm";

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-3 px-4">
        <div className="h-6 w-32 mx-auto rounded bg-border animate-pulse" />
        <div className="h-10 w-full rounded-lg bg-border animate-pulse" />
        <div className="h-10 w-full rounded-lg bg-border animate-pulse" />
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ForgotPasswordForm />
    </Suspense>
  );
}
