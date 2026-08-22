import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, MessageCircle, MapPin, Send } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ImageCarousel } from "@/components/community/ImageCarousel";

export function PostModal({ postId, isOpen, onClose }: { postId: string | null; isOpen: boolean; onClose: () => void }) {
  const [postData, setPostData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [commentContent, setCommentContent] = useState("");
  const [isLiking, setIsLiking] = useState(false);

  useEffect(() => {
    if (isOpen && postId) {
      setLoading(true);
      fetch(`http://localhost:5000/api/community/posts/${postId}`, { credentials: "include" })
        .then(res => res.json())
        .then(data => {
          setPostData(data);
          setLoading(false);
        })
        .catch(console.error);
    }
  }, [isOpen, postId]);

  const handleLike = async () => {
    if (!postId || isLiking) return;
    setIsLiking(true);
    try {
      const res = await fetch(`http://localhost:5000/api/community/posts/${postId}/like`, { method: "POST", credentials: "include" });
      const data = await res.json();
      setPostData((prev: any) => ({
        ...prev,
        hasLiked: data.liked,
        likesCount: prev.likesCount + (data.liked ? 1 : -1)
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setIsLiking(false);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postId || !commentContent.trim()) return;
    try {
      const res = await fetch(`http://localhost:5000/api/community/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: commentContent }),
        credentials: "include"
      });
      if (res.ok) {
        const refreshed = await fetch(`http://localhost:5000/api/community/posts/${postId}`, { credentials: "include" }).then(r => r.json());
        setPostData(refreshed);
        setCommentContent("");
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="w-[90vw] sm:max-w-3xl md:max-w-5xl p-0 overflow-hidden h-[85vh] flex flex-col md:flex-row gap-0 bg-background rounded-xl border-0 shadow-2xl">
        <DialogTitle className="sr-only">Post Details</DialogTitle>
        <DialogDescription className="sr-only">Details of the community post</DialogDescription>
        
        {loading || !postData ? (
          <div className="w-full h-full flex items-center justify-center p-8">Loading...</div>
        ) : !postData.post ? (
          <div className="w-full h-full flex items-center justify-center p-8 flex-col gap-2">
            <p className="text-red-500">Error: {postData.error || "Failed to load post"}</p>
            <Button variant="outline" onClick={onClose}>Close</Button>
          </div>
        ) : (
          <>
            <div className="w-full md:w-3/5 relative flex flex-col border-r h-full bg-black">
              {postData.post.imageUrls && postData.post.imageUrls.length > 0 ? (
                <div className="w-full h-full">
                  <ImageCarousel imageUrls={postData.post.imageUrls} />
                </div>
              ) : (
                <div className="p-8 h-full flex items-center justify-center text-center text-muted-foreground">
                  <p className="text-xl italic">"{postData.post.title}"</p>
                </div>
              )}
            </div>

            <div className="w-full md:w-2/5 flex flex-col h-full bg-background relative">
              <div className="p-4 flex items-center gap-3 border-b shrink-0">
                <img 
                  src={postData.userAvatar || "https://ui-avatars.com/api/?name=" + encodeURIComponent(postData.user)} 
                  alt={postData.user}
                  className="w-10 h-10 rounded-full bg-muted object-cover shrink-0"
                />
                <div>
                  <p className="font-semibold text-sm leading-none">{postData.user}</p>
                  {(postData.post.city || postData.post.country) && (
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <MapPin size={10} /> {postData.post.city} {postData.post.city && postData.post.country ? "," : ""} {postData.post.country}
                    </p>
                  )}
                </div>
              </div>

              <ScrollArea className="flex-1 p-4">
                <div className="mb-6">
                  <h3 className="font-bold text-lg mb-2">{postData.post.title}</h3>
                  <p className="text-sm whitespace-pre-line text-foreground/90">{postData.post.content}</p>
                  <p className="text-xs text-muted-foreground mt-2">{new Date(postData.post.createdAt).toLocaleString()}</p>
                </div>

                <Separator className="my-4" />

                <div className="space-y-4 pb-4">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Comments ({postData.comments?.length || 0})</h4>
                  {postData.comments && postData.comments.map((c: any, i: number) => (
                    <div key={i} className="flex gap-3 text-sm">
                      <img 
                        src={c.userAvatar || "https://ui-avatars.com/api/?name=" + encodeURIComponent(c.user)} 
                        alt={c.user}
                        className="w-8 h-8 rounded-full bg-muted object-cover shrink-0"
                      />
                      <div className="bg-muted/50 p-3 rounded-lg flex-1">
                        <p className="font-semibold text-xs mb-1">{c.user} <span className="text-muted-foreground font-normal ml-2">{new Date(c.comment.createdAt).toLocaleDateString()}</span></p>
                        <p className="text-foreground/90 leading-snug">{c.comment.content}</p>
                      </div>
                    </div>
                  ))}
                  {(!postData.comments || postData.comments.length === 0) && (
                    <p className="text-xs text-muted-foreground text-center py-4">No comments yet. Be the first!</p>
                  )}
                </div>
              </ScrollArea>

              <div className="border-t bg-background shrink-0 p-4">
                <div className="flex items-center gap-6 mb-4">
                  <button onClick={handleLike} className="flex items-center gap-2 group transition-colors">
                    <Heart className={`h-6 w-6 transition-colors ${postData.hasLiked ? "fill-red-500 text-red-500" : "text-foreground group-hover:text-red-500"}`} />
                    <span className="font-medium">{postData.likesCount}</span>
                  </button>
                  <button className="flex items-center gap-2 text-foreground hover:text-primary transition-colors cursor-default">
                    <MessageCircle className="h-6 w-6" />
                    <span className="font-medium">{postData.comments?.length || 0}</span>
                  </button>
                </div>

                <form onSubmit={handleComment} className="flex gap-2">
                  <Input 
                    placeholder="Add a comment..." 
                    className="flex-1 bg-muted/30 focus-visible:ring-1" 
                    value={commentContent}
                    onChange={e => setCommentContent(e.target.value)}
                  />
                  <Button type="submit" size="icon" disabled={!commentContent.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
