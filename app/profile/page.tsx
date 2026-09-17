"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Pencil, Check, X, Mail, Phone, CalendarDays } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getProfile, updateProfile, type ProfileData } from "@/lib/profile";

function initials(name?: string | null) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? "").concat(parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "").toUpperCase();
}

export default function ProfilePage() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getProfile()
      .then((p) => {
        setProfile(p);
        setName(p.name);
        setPhone(p.phoneNumber ?? "");
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load profile"))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSubmitting(true);
    setError(null);
    try {
      const updated = await updateProfile({ name, phoneNumber: phone || undefined });
      setProfile(updated);
      setEditing(false);
      toast.success("Profile updated");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-4 p-4 md:p-6">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Profile</h1>
        <p className="text-sm text-muted-foreground">Your basic information on file with the clinic.</p>
      </div>

      {loading ? (
        <Card className="p-5">
          <div className="flex items-center gap-4">
            <Skeleton className="size-16 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          </div>
        </Card>
      ) : (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Card className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-4">
                <Avatar className="size-16">
                  <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
                    {initials(profile?.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  {!editing ? (
                    <h2 className="text-lg font-semibold">{profile?.name}</h2>
                  ) : (
                    <Input value={name} onChange={(e) => setName(e.target.value)} className="h-8" />
                  )}
                  <Badge variant="secondary" className="mt-1">
                    {session?.user.role}
                  </Badge>
                </div>
              </div>
              {session?.user.role === "PATIENT" && !editing && (
                <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                  <Pencil className="size-3.5" />
                  Edit
                </Button>
              )}
            </div>

            <div className="mt-5 flex flex-col gap-3 border-t border-border pt-4">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="size-4 text-muted-foreground" />
                <span className="text-muted-foreground">Email</span>
                <span className="ml-auto font-medium">{profile?.email ?? "—"}</span>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <Phone className="size-4 text-muted-foreground" />
                <span className="text-muted-foreground">Phone</span>
                {!editing ? (
                  <span className="ml-auto font-medium">{profile?.phoneNumber ?? "Not set"}</span>
                ) : (
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Add a phone number"
                    className="ml-auto h-8 max-w-45"
                  />
                )}
              </div>

              {profile?.memberSince && (
                <div className="flex items-center gap-3 text-sm">
                  <CalendarDays className="size-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Member since</span>
                  <span className="ml-auto font-medium">
                    {new Date(profile.memberSince).toLocaleDateString("en-IN", {
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
              )}
            </div>

            {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

            {editing && (
              <div className="mt-4 flex gap-2 border-t border-border pt-4">
                <Button size="sm" onClick={handleSave} disabled={submitting}>
                  <Check className="size-3.5" />
                  {submitting ? "Saving..." : "Save changes"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setEditing(false);
                    setName(profile?.name ?? "");
                    setPhone(profile?.phoneNumber ?? "");
                  }}
                >
                  <X className="size-3.5" />
                  Cancel
                </Button>
              </div>
            )}
          </Card>
        </motion.div>
      )}
    </div>
  );
}
