import { Suspense } from "react";
import { isGoogleAuthEnabled } from "@/auth";
import { SignupForm } from "@/components/auth/signup-form";
import { AuthShell } from "@/components/auth/auth-shell";

export default function SignupPage() {
  return (
    <AuthShell
      title="Create your account"
      subtitle="For patients booking appointments, or doctors joining the clinic."
    >
      <Suspense>
        <SignupForm googleEnabled={isGoogleAuthEnabled} />
      </Suspense>
    </AuthShell>
  );
}
