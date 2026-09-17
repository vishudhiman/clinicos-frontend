import { Stethoscope } from "lucide-react";
import { auth } from "@/auth";
import { ChatWindow } from "@/components/chat/chat-window";
import { EmptyState } from "@/components/empty-state";

export default async function Home() {
  const session = await auth();
  if (!session) return null;

  if (session.user.role !== "PATIENT" || !session.user.patientId) {
    return (
      <div className="flex flex-1 items-center justify-center bg-muted/30 p-4">
        <EmptyState
          icon={Stethoscope}
          title="Patient chat unavailable"
          description="This account isn't a patient account. Head to the Doctors page to manage your clinic profile."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-muted/30 p-4">
      <ChatWindow patientId={session.user.patientId} patientName={session.user.name ?? "there"} />
    </div>
  );
}
