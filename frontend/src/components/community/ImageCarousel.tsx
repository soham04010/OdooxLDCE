import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function ImageCarousel({ imageUrls }: { imageUrls: string[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!imageUrls || imageUrls.length === 0) return null;
  if (imageUrls.length === 1) {
    return (
      <div className="w-full h-full relative flex items-center justify-center bg-muted">
        <img src={imageUrls[0]} alt="Post image" className="max-w-full max-h-full object-cover sm:object-contain" />
      </div>
    );
  }

  const prev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((c) => (c === 0 ? imageUrls.length - 1 : c - 1));
  };

  const next = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((c) => (c === imageUrls.length - 1 ? 0 : c + 1));
  };

  return (
    <div className="w-full h-full relative flex items-center justify-center bg-muted group overflow-hidden">
      <img src={imageUrls[currentIndex]} alt="Post image" className="w-full h-full object-cover transition-opacity duration-300" />
      
      {/* Arrows */}
      <button 
        onClick={prev}
        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60 shadow-sm"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button 
        onClick={next}
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60 shadow-sm"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/20 px-2 py-1 rounded-full">
        {imageUrls.map((_, i) => (
          <div 
            key={i} 
            className={`rounded-full transition-all ${i === currentIndex ? "bg-white w-1.5 h-1.5" : "bg-white/50 w-1 h-1"}`}
          />
        ))}
      </div>
    </div>
  );
}
