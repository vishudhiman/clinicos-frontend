import { auth } from "@/auth";
import { ChatWindow } from "@/components/chat/chat-window";

export default async function Home() {
  const session = await auth();
  if (!session) return null;

  if (session.user.role !== "PATIENT" || !session.user.patientId) {
    return (
      <div className="flex flex-1 items-center justify-center bg-zinc-50 p-4 dark:bg-black">
        <p className="max-w-sm text-center text-sm text-zinc-500">
          The patient chat is only available to patient accounts. Head to the Doctors page to
          manage your clinic profile.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 p-4 dark:bg-black">
      <ChatWindow patientId={session.user.patientId} patientName={session.user.name ?? "there"} />
    </div>
  );
}
