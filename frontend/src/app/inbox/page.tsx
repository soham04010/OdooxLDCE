"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Inbox as InboxIcon, 
  MessageSquare, 
  UserPlus, 
  Check, 
  X, 
  Send, 
  Compass, 
  Calendar, 
  Plane, 
  Users, 
  CheckCircle2,
  Clock,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";

export default function InboxPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"invitations" | "chat">("invitations");
  
  // Invitations State
  const [invitations, setInvitations] = useState<any[]>([]);
  const [invLoading, setInvLoading] = useState(true);

  // Trips & Chat State
  const [trips, setTrips] = useState<any[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [msgInput, setMsgInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [sending, setSending] = useState(false);

  // Fetch Invitations
  const fetchInvitations = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/inbox/invitations", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setInvitations(data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setInvLoading(false);
    }
  };

  // Fetch My Trips
  const fetchTrips = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/trips", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setTrips(data || []);
        if (data && data.length > 0 && !selectedTripId) {
          setSelectedTripId(data[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch Chat Messages for Selected Trip
  const fetchMessages = async (tripId: string) => {
    setChatLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/trips/${tripId}/messages`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setMessages(data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setChatLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
    fetchTrips();
  }, []);

  useEffect(() => {
    if (selectedTripId) {
      fetchMessages(selectedTripId);
    }
  }, [selectedTripId]);

  // Respond to invitation
  const handleRespondInvitation = async (invId: string, status: "accepted" | "declined", tripId?: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/inbox/invitations/${invId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
        credentials: "include"
      });
      if (res.ok) {
        toast.success(status === "accepted" ? "Invitation accepted! Joined trip." : "Invitation declined.");
        fetchInvitations();
        fetchTrips();
        if (status === "accepted" && tripId) {
          router.push(`/trips/${tripId}`);
        }
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to update invitation status");
    }
  };

  // Send Chat Message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgInput.trim() || !selectedTripId) return;
    setSending(true);
    try {
      const res = await fetch(`http://localhost:5000/api/trips/${selectedTripId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: msgInput.trim() }),
        credentials: "include"
      });
      if (res.ok) {
        setMsgInput("");
        fetchMessages(selectedTripId);
      } else {
        toast.error("Failed to send message");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  const pendingInvitations = invitations.filter((inv) => inv.invitation.status === "pending");

  return (
    <div className="min-h-screen bg-background font-sans">
      <Navbar />

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-wave flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Communication Hub
              </p>
            </div>
            <h1 className="text-3xl font-black text-marine dark:text-foreground tracking-tight">
              Inbox & Trip Group Chat
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage trip invitations and communicate with your travel crew in real-time.
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex bg-muted p-1 rounded-xl gap-1">
            <Button
              variant={activeTab === "invitations" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("invitations")}
              className="text-xs font-semibold gap-2 relative"
            >
              <InboxIcon className="w-4 h-4" /> Trip Invitations
              {pendingInvitations.length > 0 && (
                <span className="ml-1 bg-red-500 text-white rounded-full px-1.5 py-0.5 text-[10px] font-bold">
                  {pendingInvitations.length}
                </span>
              )}
            </Button>
            <Button
              variant={activeTab === "chat" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("chat")}
              className="text-xs font-semibold gap-2"
            >
              <MessageSquare className="w-4 h-4" /> Group Chat
            </Button>
          </div>
        </div>

        {/* TAB 1: TRIP INVITATIONS */}
        {activeTab === "invitations" && (
          <div className="space-y-6">
            {invLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-24 w-full rounded-2xl" />
                <Skeleton className="h-24 w-full rounded-2xl" />
              </div>
            ) : invitations.length === 0 ? (
              <Card className="border border-dashed p-12 text-center rounded-2xl">
                <UserPlus className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <h3 className="font-bold text-lg text-marine dark:text-foreground mb-1">No Pending Invitations</h3>
                <p className="text-xs text-muted-foreground">
                  When friends invite you to join their travel plans, invitations will appear here.
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {invitations.map((item) => {
                  const inv = item.invitation;
                  const trip = item.trip;
                  const isPending = inv.status === "pending";

                  return (
                    <Card
                      key={inv.id}
                      className="border border-border/80 p-6 shadow-2xs bg-card rounded-2xl hover:border-wave/40 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-full bg-marine text-white flex items-center justify-center font-bold text-lg shrink-0">
                            {inv.senderName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-base text-marine dark:text-foreground">
                                {inv.senderName}
                              </h4>
                              <Badge
                                variant="outline"
                                className={
                                  isPending
                                    ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                    : inv.status === "accepted"
                                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                    : "bg-muted text-muted-foreground"
                                }
                              >
                                {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Invited you to join <strong className="text-foreground">{trip?.name || "Travel Plan"}</strong>
                            </p>
                            {trip?.startDate && (
                              <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-1.5">
                                <Calendar className="w-3 h-3 text-wave" />
                                {new Date(trip.startDate).toLocaleDateString()} — {new Date(trip.endDate).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          {isPending ? (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRespondInvitation(inv.id, "declined")}
                                className="text-xs font-semibold h-9 gap-1 text-muted-foreground hover:text-destructive"
                              >
                                <X className="w-4 h-4" /> Decline
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleRespondInvitation(inv.id, "accepted", trip?.id)}
                                className="text-xs font-semibold h-9 gap-1.5"
                              >
                                <Check className="w-4 h-4" /> Accept & Join Trip
                              </Button>
                            </>
                          ) : inv.status === "accepted" && trip?.id ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => router.push(`/trips/${trip.id}`)}
                              className="text-xs font-semibold h-9 gap-1.5"
                            >
                              View Trip Itinerary
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: TRIP GROUP CHAT */}
        {activeTab === "chat" && (
          <div className="flex justify-center items-center py-6">
            {/* Mobile Phone Mockup Container */}
            <div className="w-[360px] h-[580px] bg-card border-4 border-marine/20 dark:border-border rounded-[36px] shadow-2xl flex flex-col overflow-hidden relative">
              {/* Phone Speaker Notch */}
              <div className="w-28 h-4 bg-marine/10 dark:bg-muted mx-auto rounded-b-xl flex items-center justify-center shrink-0">
                <div className="w-8 h-1 bg-marine/30 rounded-full" />
              </div>

              {/* Phone Header */}
              <div className="p-3 border-b border-border/60 bg-marine text-white flex items-center justify-between">
                <div className="truncate">
                  <h4 className="font-bold text-xs truncate">
                    {trips.find((t) => t.id === selectedTripId)?.name || "Group Chat"}
                  </h4>
                  <p className="text-[10px] text-emerald-300 font-medium">● Group Live Chat</p>
                </div>

                {trips.length > 1 && (
                  <select
                    value={selectedTripId || ""}
                    onChange={(e) => setSelectedTripId(e.target.value)}
                    className="bg-marine/80 text-white font-bold text-[11px] border border-white/20 rounded px-1.5 py-0.5"
                  >
                    {trips.map((t) => (
                      <option key={t.id} value={t.id} className="bg-zinc-900 text-white">
                        {t.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Chat Message List */}
              <div className="flex-1 p-3 overflow-y-auto space-y-3 bg-muted/20">
                {chatLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-8 w-3/4 rounded-xl" />
                    <Skeleton className="h-8 w-1/2 ml-auto rounded-xl" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-xs py-12 text-center">
                    <MessageSquare className="w-8 h-8 mb-2 opacity-30 text-wave" />
                    No messages yet in this group.
                  </div>
                ) : (
                  messages.map((m) => (
                    <div key={m.id} className="flex flex-col space-y-0.5">
                      <span className="text-[9px] font-semibold text-muted-foreground px-1">{m.senderName}</span>
                      <div className="bg-card border border-border/70 p-2.5 rounded-2xl rounded-tl-xs shadow-2xs max-w-[85%] text-xs">
                        <p className="text-foreground leading-relaxed">{m.content}</p>
                        <span className="text-[9px] text-muted-foreground mt-0.5 block text-right">
                          {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Chat Input Box */}
              <form onSubmit={handleSendMessage} className="p-2.5 border-t border-border/60 bg-card flex items-center gap-2">
                <Input
                  value={msgInput}
                  onChange={(e) => setMsgInput(e.target.value)}
                  placeholder="Type message..."
                  className="text-xs h-9 rounded-full border-border/80"
                />
                <Button type="submit" size="icon" disabled={sending || !msgInput.trim()} className="h-9 w-9 rounded-full bg-marine text-white shrink-0">
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
