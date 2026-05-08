"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, FileText, Film } from "lucide-react";
import type { File as FileType } from "@/lib/db/schema";

interface FilePreviewModalProps {
  file: FileType | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function FilePreviewModal({
  file,
  isOpen,
  onOpenChange,
}: FilePreviewModalProps) {
  if (!file) return null;

  const renderPreviewContent = () => {
    const type = file.type?.toLowerCase() || "";
    
    if (type.startsWith("image/")) {
      const optimizedUrl = `${process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT}/tr:q-90,w-1600,h-1200,fo-auto/${file.path}`;
      return (
        <img
          src={optimizedUrl}
          alt={file.name}
          className="max-w-full max-h-full object-contain"
        />
      );
    }
    
    if (type.startsWith("video/")) {
      return (
        <video 
          controls 
          autoPlay 
          className="max-w-full max-h-full object-contain"
          src={file.fileUrl || ""}
        >
          Your browser does not support the video tag.
        </video>
      );
    }
    
    if (type.includes("pdf")) {
      return (
        <iframe
          src={file.fileUrl || ""}
          className="w-full h-full border-0"
          title={file.name}
        />
      );
    }

    return (
      <div className="flex flex-col items-center justify-center text-muted-foreground p-12">
        {type.startsWith("video/") ? <Film className="h-16 w-16 mb-4" /> : <FileText className="h-16 w-16 mb-4" />}
        <p>Preview not available for this file type.</p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => file.fileUrl && window.open(file.fileUrl, "_blank")}
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Open in New Tab
        </Button>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-full h-[85vh] flex flex-col p-0 overflow-hidden bg-black/95 border-border">
        <DialogHeader className="p-4 border-b border-white/10 absolute top-0 w-full z-10 bg-black/50 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-white truncate max-w-[80%] pr-4">
              {file.name}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={() => file.fileUrl && window.open(file.fileUrl, "_blank")}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 relative flex items-center justify-center p-4 pt-16 h-full w-full">
          {renderPreviewContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
