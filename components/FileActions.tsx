"use client";

import { useState, useEffect } from "react";
import { MoreVertical, Star, Trash, X, ArrowUpFromLine, Download, Share2, Pencil, FolderInput, ExternalLink, Copy, Clock, Info } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import type { File as FileType } from "@/lib/db/schema";

interface FileActionsProps {
  file: FileType;
  onStar: (id: string) => void;
  onTrash: (id: string) => void;
  onDelete: (file: FileType) => void;
  onDownload?: (file: FileType) => void;
  onRename?: (fileId: string, newName: string) => void;
  onMove?: (fileId: string, parentId: string | null) => void;
}

export default function FileActions({
  file,
  onStar,
  onTrash,
  onDelete,
  onRename,
  onMove,
}: FileActionsProps) {
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [folders, setFolders] = useState<FileType[]>([]);
  const [loadingFolders, setLoadingFolders] = useState(false);

  // Fetch user's folders for move dialog
  useEffect(() => {
    if (moveDialogOpen) {
      setLoadingFolders(true);
      fetch(`/api/files?userId=${file.userId}&parentId=all`)
        .then((res) => res.json())
        .then((data) => {
          const fileList = data.files || data;
          setFolders(fileList.filter((f: FileType) => f.isFolder && f.id !== file.id));
        })
        .catch(() => toast.error("Failed to load folders"))
        .finally(() => setLoadingFolders(false));
    }
  }, [moveDialogOpen, file.userId, file.id]);

  const handleRename = () => {
    const newName = prompt("Enter new name:", file.name);
    if (newName && newName.trim() && newName.trim() !== file.name) {
      onRename?.(file.id, newName.trim());
    }
  };

  const handleMove = (targetParentId: string | null) => {
    onMove?.(file.id, targetParentId);
    setMoveDialogOpen(false);
  };

  return (
    <div className="flex items-center justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-accent rounded-full">
            <MoreVertical className="h-4 w-4 text-muted-foreground" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 p-1">
          {!file.isTrash && !file.isFolder && file.fileUrl && (
            <>
              <DropdownMenuItem
                onClick={() => {
                  navigator.clipboard.writeText(file.fileUrl!);
                  toast.success("Link copied successfully");
                }}
              >
                <Copy className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>Copy Link</span>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a
                  href={file.fileUrl}
                  download
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center w-full cursor-pointer"
                >
                  <Download className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>Download File</span>
                </a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}

          {!file.isTrash && file.isFolder && (
            <>
              <DropdownMenuItem asChild>
                <a
                  href={`/api/folders/${file.id}/download`}
                  download
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center w-full cursor-pointer"
                >
                  <Download className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>Download ZIP</span>
                </a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}

          {!file.isTrash && (
            <>
              <DropdownMenuItem onClick={handleRename}>
                <Pencil className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>Rename</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setMoveDialogOpen(true)}>
                <FolderInput className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>Move to Folder</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onStar(file.id)}>
                <Star
                  className={`h-4 w-4 mr-2 ${file.isStarred ? "text-yellow-400 fill-current" : "text-muted-foreground"}`}
                />
                <span>{file.isStarred ? "Unstar" : "Star"}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}

          <DropdownMenuItem onClick={() => onTrash(file.id)}>
            {file.isTrash ? (
              <ArrowUpFromLine className="h-4 w-4 mr-2 text-muted-foreground" />
            ) : (
              <Trash className="h-4 w-4 mr-2 text-muted-foreground" />
            )}
            <span>{file.isTrash ? "Restore File" : "Move to Trash"}</span>
          </DropdownMenuItem>

          {file.isTrash && (
            <DropdownMenuItem
              onClick={() => onDelete(file)}
              className="text-destructive focus:text-destructive focus:bg-destructive/10"
            >
              <X className="h-4 w-4 mr-2" />
              <span>Delete Permanently</span>
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />
          
          {/* File details section */}
          <DropdownMenuLabel className="flex items-center gap-2 px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            <Info className="h-3 w-3" />
            File Details
          </DropdownMenuLabel>
          <div className="px-2 py-2 pt-0">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-[11px]">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">Added:</span>
                <span className="font-medium text-foreground">
                  {formatDistanceToNow(new Date(file.createdAt), { addSuffix: true })}
                </span>
              </div>
              <div className="text-[9px] text-muted-foreground ml-5">
                {format(new Date(file.createdAt), "MMM d, yyyy 'at' h:mm a")}
              </div>
              {!file.isFolder && (
                <div className="flex items-center gap-2 text-[11px] mt-0.5">
                  <div className="w-3" />
                  <span className="text-muted-foreground">Size:</span>
                  <span className="font-medium text-foreground">
                    {file.size < 1024
                      ? `${file.size} B`
                      : file.size < 1024 * 1024
                        ? `${(file.size / 1024).toFixed(1)} KB`
                        : `${(file.size / (1024 * 1024)).toFixed(1)} MB`}
                  </span>
                </div>
              )}
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>




      {/* Move dialog */}
      <Dialog open={moveDialogOpen} onOpenChange={setMoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderInput className="h-5 w-5 text-primary" />
              Move &quot;{file.name}&quot;
            </DialogTitle>
            <DialogDescription>
              Select a destination folder or move to root.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1 py-4 max-h-60 overflow-y-auto">
            <button
              onClick={() => handleMove(null)}
              className="w-full text-left px-3 py-2 rounded-md hover:bg-accent transition-colors flex items-center gap-2"
            >
              <FolderInput className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Root (Home)</span>
            </button>
            {loadingFolders ? (
              <p className="text-sm text-muted-foreground text-center py-4">Loading folders...</p>
            ) : folders.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No folders found</p>
            ) : (
              folders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => handleMove(folder.id)}
                  className="w-full text-left px-3 py-2 rounded-md hover:bg-accent transition-colors flex items-center gap-2"
                >
                  <FolderInput className="h-4 w-4 text-muted-foreground" />
                  <span>{folder.name}</span>
                </button>
              ))
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setMoveDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
