
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, MapPin, Calendar, Camera, Heart, MessageCircle } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import Image from "next/image";
import { PostModal } from "@/components/community/PostModal";
import { ImageCarousel } from "@/components/community/ImageCarousel";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, tripsRes, postsRes] = await Promise.all([
          fetch("http://localhost:5000/api/auth/me", { credentials: "include" }),
          fetch("http://localhost:5000/api/trips", { credentials: "include" }),
          fetch("http://localhost:5000/api/users/me/posts", { credentials: "include" })
        ]);

        if (userRes.status === 401) {
          router.push("/login");
          return;
        }

        const userData = await userRes.json();
        const tripsData = await tripsRes.json();
        const postsData = postsRes.ok ? await postsRes.json() : [];

        setUser(userData.user);
        setEditName(userData.user.name);
        setTrips(tripsData);
        setUserPosts(postsData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [router]);

  const handleSaveProfile = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/auth/me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName }),
        credentials: "include"
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setIsEditing(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    let avatarUrl = "";
    
    // 1. Upload to Cloudinary
    try {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dbwymmt1i";
      const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "LDCEXODOO";

      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", uploadPreset);

      const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: formData,
      });

      if (uploadRes.ok) {
        const data = await uploadRes.json();
        avatarUrl = data.secure_url;
      } else {
        const errData = await uploadRes.json(); 
        alert("Cloudinary Error: " + (errData.error?.message || "Check console")); 
        console.error("Cloudinary failed:", errData);
        setUploadingAvatar(false);
        return;
      }
    } catch (err) {
      console.error("Cloudinary Fetch Error:", err);
      alert("Error uploading image to Cloudinary. Check your adblocker.");
      setUploadingAvatar(false);
      return;
    }

    // 2. Update Backend
    try {
      if (avatarUrl) {
        const updateRes = await fetch("http://localhost:5000/api/auth/me", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ avatarUrl }),
          credentials: "include"
        });
        
        if (updateRes.ok) {
          const updatedData = await updateRes.json();
          setUser(updatedData.user);
        } else {
          console.error("Backend update failed with status:", updateRes.status);
          alert("Failed to update backend");
        }
      }
    } catch (err) {
      console.error("Backend Fetch Error:", err);
      alert("Error updating profile in backend. Is the server running?");
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-background p-8"><div className="text-center">Loading...</div></div>;

  const now = new Date();
  const preplannedTrips = trips.filter(t => new Date(t.startDate) >= now);
  const previousTrips = trips.filter(t => new Date(t.startDate) < now);

  const TripCard = ({ trip }: { trip: any }) => (
    <Card className="flex-shrink-0 w-64 border border-border/80 shadow-sm overflow-hidden flex flex-col h-[320px]">
      <div className="h-40 bg-muted relative">
        {trip.coverPhotoUrl ? (
          <img src={trip.coverPhotoUrl} alt={trip.name} className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/30">
            <MapPin size={48} />
          </div>
        )}
      </div>
      <CardContent className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-semibold text-lg line-clamp-1">{trip.name}</h3>
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            <Calendar size={12} />
            {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}
          </p>
        </div>
        <Button className="w-full mt-4" variant="outline" onClick={() => router.push(`/trips/${trip.id}`)}>View</Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <h1 className="text-2xl font-bold mb-6">User Profile (Screen 7)</h1>

        <div className="flex flex-col md:flex-row gap-8 mb-12">
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-48 h-48 rounded-full border-4 border-muted overflow-hidden bg-muted/30 flex items-center justify-center group">
              {user.avatarUrl ? (
                 <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                 <User size={64} className="text-muted-foreground" />
              )}
              <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
                <Camera className="text-white" size={32} />
              </label>
            </div>
            <p className="text-xs text-muted-foreground">{uploadingAvatar ? "Uploading..." : "Hover & click to change"}</p>
          </div>

          <Card className="flex-1">
            <CardContent className="p-6 h-full flex flex-col justify-center">
              {isEditing ? (
                <div className="space-y-4 max-w-md">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input value={user.email} disabled />
                    <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button onClick={handleSaveProfile}>Save Changes</Button>
                    <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <div>
                  <h2 className="text-3xl font-bold mb-2">{user.name}</h2>
                  <p className="text-muted-foreground mb-6">{user.email}</p>
                  <Button variant="outline" onClick={() => setIsEditing(true)}>Edit Information</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="mb-10">
          <h2 className="text-xl font-semibold mb-4">Preplanned Trips</h2>
          {preplannedTrips.length === 0 ? (
            <p className="text-muted-foreground border border-dashed p-8 rounded-lg text-center">No upcoming trips.</p>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {preplannedTrips.map(trip => <TripCard key={trip.id} trip={trip} />)}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Previous Trips</h2>
          {previousTrips.length === 0 ? (
            <p className="text-muted-foreground border border-dashed p-8 rounded-lg text-center">No previous trips.</p>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {previousTrips.map(trip => <TripCard key={trip.id} trip={trip} />)}
            </div>
          )}
        </div>
        <div className="mt-10">
          <h2 className="text-xl font-semibold mb-4">Posts by me</h2>
          {userPosts.length === 0 ? (
            <p className="text-muted-foreground border border-dashed p-8 rounded-lg text-center">You haven't made any community posts yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userPosts.map(item => (
                <Card 
                  key={item.post.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow overflow-hidden flex flex-col h-full min-h-[280px]"
                  onClick={() => setSelectedPostId(item.post.id)}
                >
                  {item.post.imageUrls && item.post.imageUrls.length > 0 && (
                    <div className="h-40 bg-muted relative shrink-0">
                      <ImageCarousel imageUrls={item.post.imageUrls} />
                    </div>
                  )}
                  <CardContent className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-semibold text-lg line-clamp-1 mb-1">{item.post.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">{item.post.content}</p>
                    </div>
                    <div className="text-xs text-muted-foreground mt-4 flex items-center justify-between shrink-0">
                      <span>{new Date(item.post.createdAt).toLocaleDateString()}</span>
                      
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 hover:text-red-500 transition-colors">
                          <Heart className="h-3 w-3" />
                          <span>{item.likesCount || 0}</span>
                        </div>
                        <div className="flex items-center gap-1 hover:text-primary transition-colors">
                          <MessageCircle className="h-3 w-3" />
                          <span>{item.commentsCount || 0}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

      </main>
      <PostModal postId={selectedPostId} isOpen={!!selectedPostId} onClose={() => setSelectedPostId(null)} />
    </div>
  );
}
