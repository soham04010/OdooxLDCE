"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Calendar, Camera, ExternalLink, Plus, X, Heart, MessageCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

import { PostModal } from "@/components/community/PostModal";
import { ImageCarousel } from "@/components/community/ImageCarousel";

export default function CommunityPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  const [isCreating, setIsCreating] = useState(false);
  const [newPost, setNewPost] = useState({ title: "", content: "", city: "", country: "", imageUrls: [] as string[] });
  const [uploadingImage, setUploadingImage] = useState(false);

  const fetchPosts = async (searchQuery = "") => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/community/posts?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setPosts(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPosts(search);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    try {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dbwymmt1i";
      const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "LDCEXODOO";

      const uploadedUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append("file", files[i]);
        formData.append("upload_preset", uploadPreset);

        const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: "POST",
          body: formData,
        });

        if (uploadRes.ok) {
          const data = await uploadRes.json();
          uploadedUrls.push(data.secure_url);
        } else {
          const errData = await uploadRes.json();
          console.error("Cloudinary error:", errData);
        }
      }

      setNewPost(prev => ({ ...prev, imageUrls: [...prev.imageUrls, ...uploadedUrls] }));
    } catch (err) {
      console.error(err);
      alert("Error uploading images");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.title || !newPost.content) return;
    
    try {
      const res = await fetch("http://localhost:5000/api/community/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPost),
        credentials: "include"
      });
      if (res.ok) {
        setIsCreating(false);
        setNewPost({ title: "", content: "", city: "", country: "", imageUrls: [] });
        fetchPosts(search);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-background font-sans">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Community Board</h1>
          <Button onClick={() => setIsCreating(!isCreating)}>
            <Plus className="h-4 w-4 mr-2" />
            {isCreating ? "Cancel" : "Create Post"}
          </Button>
        </div>

        {isCreating && (
          <Card className="mb-8 border-primary shadow-sm bg-primary/5">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4">Share your travel experience</h2>
              <form onSubmit={handleSubmitPost} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input 
                    placeholder="Post Title (e.g., Hidden Gem in Paris)" 
                    value={newPost.title} onChange={e => setNewPost({...newPost, title: e.target.value})} required 
                  />
                  <div className="flex gap-2">
                    <Input 
                      placeholder="City (optional)" 
                      value={newPost.city} onChange={e => setNewPost({...newPost, city: e.target.value})} 
                    />
                    <Input 
                      placeholder="Country (optional)" 
                      value={newPost.country} onChange={e => setNewPost({...newPost, country: e.target.value})} 
                    />
                  </div>
                </div>
                
                <Textarea 
                  placeholder="Tell us about your trip..." 
                  className="min-h-[120px]"
                  value={newPost.content} onChange={e => setNewPost({...newPost, content: e.target.value})} required 
                />

                <div className="flex items-center gap-4">
                  <label className="cursor-pointer flex items-center justify-center gap-2 bg-muted px-4 py-2 rounded-md border hover:bg-muted/80 transition-colors text-sm font-medium">
                    <input type="file" className="hidden" accept="image/*" multiple onChange={handleImageUpload} disabled={uploadingImage} />
                    <Camera className="h-4 w-4" />
                    {uploadingImage ? "Uploading..." : "Add Photos"}
                  </label>
                  
                  {newPost.imageUrls.length > 0 && (
                    <div className="text-xs text-green-600 font-medium">{newPost.imageUrls.length} photo(s) uploaded!</div>
                  )}
                  
                  <div className="ml-auto">
                    <Button type="submit">Post to Community</Button>
                  </div>
                </div>

                {newPost.imageUrls.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto py-2">
                    {newPost.imageUrls.map((url, i) => (
                      <div key={i} className="relative h-20 w-20 flex-shrink-0 rounded-md overflow-hidden border group">
                        <img src={url} alt="Preview" className="w-full h-full object-cover" />
                        <button 
                          type="button" 
                          onClick={() => setNewPost(prev => ({ ...prev, imageUrls: prev.imageUrls.filter((_, index) => index !== i) }))}
                          className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        )}
        
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 space-y-6">
            <form onSubmit={handleSearch} className="flex gap-2 bg-muted/20 p-2 rounded-md border border-border/50">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search community posts by title, content, city, or country..." 
                  className="pl-9 h-10 w-full"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Button type="submit" variant="secondary" className="px-6 h-10 border border-border/50">
                Filter
              </Button>
            </form>

            <div className="space-y-6">
              {loading ? (
                <>
                  <Skeleton className="w-full h-48 rounded-lg" />
                  <Skeleton className="w-full h-48 rounded-lg" />
                </>
              ) : posts.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground border rounded-lg border-dashed">
                  No posts found. Be the first to share your experience!
                </div>
              ) : (
                posts.map((item: any, i) => (
                  <Card 
                    key={item.post.id} 
                    className="overflow-hidden border-border/80 shadow-sm transition-hover hover:shadow-md cursor-pointer"
                    onClick={() => setSelectedPostId(item.post.id)}
                  >
                    <CardContent className="p-0">
                      {item.post.imageUrls && item.post.imageUrls.length > 0 && (
                        <div className="w-full h-64 bg-muted relative">
                          <ImageCarousel imageUrls={item.post.imageUrls} />
                        </div>
                      )}
                      
                      <div className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <img 
                            src={item.userAvatar || "https://ui-avatars.com/api/?name=" + encodeURIComponent(item.user)} 
                            alt={item.user}
                            className="w-8 h-8 rounded-full bg-muted object-cover"
                          />
                          <div>
                            <p className="font-semibold text-sm leading-none">{item.user}</p>
                            <p className="text-xs text-muted-foreground mt-1">{new Date(item.post.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>

                        <h3 className="font-bold text-xl mb-2">{item.post.title}</h3>
                        <p className="text-muted-foreground text-sm whitespace-pre-line mb-4 line-clamp-3">
                          {item.post.content}
                        </p>

                        <div className="flex items-center justify-between mt-4">
                          {(item.post.city || item.post.country) ? (
                            <div className="flex items-center gap-2 text-xs font-medium bg-muted/50 w-fit px-3 py-1.5 rounded-full border">
                               <MapPin className="h-3 w-3 text-primary" />
                               {item.post.city} {item.post.city && item.post.country ? "," : ""} {item.post.country}
                            </div>
                          ) : <div />}
                          
                          <div className="flex items-center gap-4 text-muted-foreground">
                            <div className="flex items-center gap-1.5 hover:text-red-500 transition-colors">
                              <Heart className="h-4 w-4" />
                              <span className="text-xs font-medium">{item.likesCount || 0}</span>
                            </div>
                            <div className="flex items-center gap-1.5 hover:text-primary transition-colors">
                              <MessageCircle className="h-4 w-4" />
                              <span className="text-xs font-medium">{item.commentsCount || 0}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          <div className="w-full md:w-80 shrink-0">
             <Card className="border border-border/50 bg-muted/10 sticky top-20">
               <CardContent className="p-6 text-sm text-muted-foreground leading-relaxed">
                 Welcome to the Community Board! <br/><br/>
                 Here you can share your travel experiences, upload photos, and write blogs about your favorite destinations.<br/><br/>
                 Use the search bar to discover posts about specific countries or cities.
               </CardContent>
             </Card>
          </div>
        </div>
        <PostModal postId={selectedPostId} isOpen={!!selectedPostId} onClose={() => setSelectedPostId(null)} />
      </main>
    </div>
  );
}
