import { Suspense } from "react";
import { isGoogleAuthEnabled } from "@/auth";
import { LoginForm } from "@/components/auth/login-form";
import { AuthShell } from "@/components/auth/auth-shell";

export default function LoginPage() {
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to manage appointments or chat with the clinic assistant."
    >
      <Suspense>
        <LoginForm googleEnabled={isGoogleAuthEnabled} />
      </Suspense>
    </AuthShell>
  );
}
