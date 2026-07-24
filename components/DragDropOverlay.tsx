"use client";

import { useState, useEffect } from "react";
import { UploadCloud, FileCode, CheckCircle2 } from "lucide-react";

interface DragDropOverlayProps {
  onFileDrop: (fileContent: string, fileName: string) => void;
}

export function DragDropOverlay({ onFileDrop }: DragDropOverlayProps) {
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    let dragCounter = 0;

    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter++;
      if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
        setIsDragging(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter--;
      if (dragCounter === 0) {
        setIsDragging(false);
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      dragCounter = 0;

      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        const fileName = file.name;
        const reader = new FileReader();

        reader.onload = (event) => {
          const content = event.target?.result as string;
          if (content) {
            onFileDrop(content, fileName);
          }
        };

        reader.readAsText(file);
      }
    };

    window.addEventListener("dragenter", handleDragEnter);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("drop", handleDrop);

    return () => {
      window.removeEventListener("dragenter", handleDragEnter);
      window.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("drop", handleDrop);
    };
  }, [onFileDrop]);

  if (!isDragging) return null;

  return (
    <div className="fixed inset-0 bg-neutral-950/90 backdrop-blur-xl z-50 flex items-center justify-center p-8 transition-all border-4 border-dashed border-indigo-500/80 animate-in fade-in duration-200">
      <div className="text-center space-y-6 max-w-lg pointer-events-none">
        <div className="w-24 h-24 rounded-3xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center mx-auto shadow-2xl shadow-indigo-500/30 animate-bounce">
          <UploadCloud className="w-12 h-12 text-indigo-400" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white tracking-tight">Drop File to Import Endpoint</h2>
          <p className="text-sm text-neutral-400">
            Supports JSON samples, OpenAPI specs (<code className="text-indigo-400">.json</code>, <code className="text-indigo-400">.yaml</code>), Postman Collections, or Mockbit Workspace backups.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <span className="px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
            <FileCode className="w-3.5 h-3.5" />
            <span>.json</span>
          </span>
          <span className="px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-xs font-semibold text-purple-400 flex items-center gap-1.5">
            <FileCode className="w-3.5 h-3.5" />
            <span>.yaml / .yml</span>
          </span>
          <span className="px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-xs font-semibold text-amber-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Postman</span>
          </span>
        </div>
      </div>
    </div>
  );
}
