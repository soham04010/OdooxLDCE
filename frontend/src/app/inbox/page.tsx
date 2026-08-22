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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[600px]">
            {/* Left Sidebar: Select Trip */}
            <Card className="border border-border/80 p-4 bg-card rounded-2xl flex flex-col justify-between overflow-hidden">
              <div>
                <h3 className="font-bold text-sm text-marine dark:text-foreground mb-3 px-2 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-wave" /> Select Trip Group
                </h3>

                {trips.length === 0 ? (
                  <p className="text-xs text-muted-foreground p-4 text-center">No active trips found.</p>
                ) : (
                  <div className="space-y-1 overflow-y-auto max-h-[500px] pr-1">
                    {trips.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setSelectedTripId(t.id)}
                        className={`w-full text-left p-3 rounded-xl text-xs font-semibold transition-colors flex items-center justify-between ${
                          selectedTripId === t.id
                            ? "bg-marine text-white"
                            : "hover:bg-muted/60 text-foreground"
                        }`}
                      >
                        <div className="truncate">
                          <p className="truncate font-bold">{t.name}</p>
                          <p className={`text-[10px] truncate mt-0.5 ${selectedTripId === t.id ? "text-white/80" : "text-muted-foreground"}`}>
                            {t.startDate ? `${new Date(t.startDate).toLocaleDateString()}` : "Upcoming Trip"}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            {/* Right Chat Panel */}
            <Card className="md:col-span-2 border border-border/80 bg-card rounded-2xl flex flex-col h-full overflow-hidden">
              {/* Chat Header */}
              <div className="p-4 border-b border-border/60 bg-muted/20 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-base text-marine dark:text-foreground">
                    {trips.find((t) => t.id === selectedTripId)?.name || "Group Chat"}
                  </h4>
                  <p className="text-xs text-muted-foreground">Live chat with your trip members</p>
                </div>
              </div>

              {/* Chat Message List */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {chatLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-10 w-3/4 rounded-xl" />
                    <Skeleton className="h-10 w-1/2 ml-auto rounded-xl" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-xs py-12">
                    <MessageSquare className="w-8 h-8 mb-2 opacity-40" />
                    No messages yet in this group. Start the conversation!
                  </div>
                ) : (
                  messages.map((m) => (
                    <div key={m.id} className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-wave text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                        {m.senderName.charAt(0).toUpperCase()}
                      </div>
                      <div className="bg-muted/50 p-3 rounded-2xl rounded-tl-none border border-border/60 max-w-[80%]">
                        <div className="flex items-center justify-between gap-4 mb-1">
                          <span className="font-bold text-xs text-marine dark:text-foreground">{m.senderName}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs leading-relaxed text-foreground">{m.content}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Chat Input Box */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-border/60 bg-background flex items-center gap-2">
                <Input
                  value={msgInput}
                  onChange={(e) => setMsgInput(e.target.value)}
                  placeholder="Type a message to your group..."
                  className="text-xs h-10 border-border/80"
                />
                <Button type="submit" size="sm" disabled={sending || !msgInput.trim()} className="h-10 px-4 gap-1.5 font-semibold">
                  <Send className="w-4 h-4" /> Send
                </Button>
              </form>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
