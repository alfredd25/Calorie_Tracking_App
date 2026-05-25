import { Suspense } from "react";
import ForgotPasswordForm from "./ForgotPasswordForm";

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-md space-y-4 px-4">
        <div className="h-8 w-48 mx-auto rounded bg-slate-200 animate-pulse" />
        <div className="h-10 w-full rounded bg-slate-200 animate-pulse" />
        <div className="h-10 w-full rounded bg-slate-200 animate-pulse" />
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
