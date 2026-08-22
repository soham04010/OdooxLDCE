"use client";

import { useEffect, useState, useRef } from "react";
import { MessageSquare, X, Send, Users, ChevronDown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export function TripChatWidget({ tripId, tripName }: { tripId?: string; tripName?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [trips, setTrips] = useState<any[]>([]);
  const [activeTripId, setActiveTripId] = useState<string | undefined>(tripId);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputMsg, setInputMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch list of my trips if tripId not passed directly
  useEffect(() => {
    if (!tripId) {
      fetch("http://localhost:5000/api/trips", { credentials: "include" })
        .then((res) => res.json())
        .then((data) => {
          setTrips(data || []);
          if (data && data.length > 0 && !activeTripId) {
            setActiveTripId(data[0].id);
          }
        })
        .catch(console.error);
    } else {
      setActiveTripId(tripId);
    }
  }, [tripId]);

  // Fetch messages whenever activeTripId changes or chat opens
  const fetchMessages = async (tId: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/trips/${tId}/messages`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (isOpen && activeTripId) {
      fetchMessages(activeTripId);
      const interval = setInterval(() => fetchMessages(activeTripId), 4000);
      return () => clearInterval(interval);
    }
  }, [isOpen, activeTripId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim() || !activeTripId) return;
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/trips/${activeTripId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: inputMsg.trim() }),
        credentials: "include",
      });
      if (res.ok) {
        setInputMsg("");
        fetchMessages(activeTripId);
      } else {
        toast.error("Failed to send message");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const currentTripName =
    tripName || trips.find((t) => t.id === activeTripId)?.name || "Trip Group Chat";

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Sleek Floating Toggle Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="h-12 px-5 rounded-full bg-marine text-white shadow-xl hover:bg-marine/90 transition-all transform hover:scale-105 flex items-center gap-2.5 border border-white/20"
        >
          <div className="relative">
            <MessageSquare className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-marine" />
          </div>
          <span className="font-bold text-xs">Trip Chat</span>
        </Button>
      )}

      {/* Sleek Phone-Style Chat Window */}
      {isOpen && (
        <div className="w-[340px] sm:w-[380px] h-[520px] bg-card border border-border/80 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Top Smartphone Header */}
          <div className="bg-marine text-white p-4 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2.5 truncate">
              <div className="w-9 h-9 rounded-full bg-wave text-white flex items-center justify-center font-bold text-xs shrink-0 ring-2 ring-white/30">
                💬
              </div>
              <div className="truncate">
                {!tripId && trips.length > 1 ? (
                  <select
                    value={activeTripId}
                    onChange={(e) => setActiveTripId(e.target.value)}
                    className="bg-marine/80 text-white font-bold text-xs border border-white/20 rounded-md px-2 py-1 focus:outline-none truncate w-40"
                  >
                    {trips.map((t) => (
                      <option key={t.id} value={t.id} className="bg-zinc-900 text-white">
                        {t.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <h4 className="font-bold text-xs truncate max-w-[180px]">{currentTripName}</h4>
                )}
                <p className="text-[10px] text-emerald-300 font-medium flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Group Live Chat
                </p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white hover:bg-white/10 rounded-full h-8 w-8 shrink-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-muted/20">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
                <Users className="w-10 h-10 mb-2 opacity-30 text-wave" />
                <p className="text-xs font-bold text-foreground">No messages yet</p>
                <p className="text-[11px] mt-1">Start chatting with your trip friends!</p>
              </div>
            ) : (
              messages.map((m, idx) => (
                <div key={m.id || idx} className="flex flex-col space-y-1">
                  <span className="text-[10px] font-semibold text-muted-foreground px-1">
                    {m.senderName}
                  </span>
                  <div className="bg-card border border-border/70 p-3 rounded-2xl rounded-tl-xs shadow-2xs max-w-[85%] text-xs">
                    <p className="text-foreground leading-relaxed">{m.content}</p>
                    <span className="text-[9px] text-muted-foreground mt-1 block text-right">
                      {new Date(m.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Send Bar */}
          <form onSubmit={handleSend} className="p-3 bg-card border-t border-border/60 flex items-center gap-2">
            <Input
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              placeholder="Type message..."
              className="h-10 text-xs rounded-full border-border/80 focus-visible:ring-wave bg-muted/30"
            />
            <Button
              type="submit"
              size="icon"
              disabled={loading || !inputMsg.trim()}
              className="h-10 w-10 rounded-full bg-marine text-white hover:bg-marine/90 shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
