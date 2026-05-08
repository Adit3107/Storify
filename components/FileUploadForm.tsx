"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  Upload,
  X,
  FileUp,
  AlertTriangle,
  FolderPlus,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import axios from "axios";

interface FileUploadFormProps {
  userId: string;
  onUploadSuccess?: () => void;
  currentFolder?: string | null;
}

export default function FileUploadForm({
  userId,
  onUploadSuccess,
  currentFolder = null,
}: FileUploadFormProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentFileIndex, setCurrentFileIndex] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Folder creation state
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [creatingFolder, setCreatingFolder] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      const validFiles = selectedFiles.filter(f => f.size <= 100 * 1024 * 1024);
      
      if (validFiles.length < selectedFiles.length) {
        setError("Some files exceeded the 100MB limit and were skipped");
      } else {
        setError(null);
      }

      setFiles(prev => [...prev, ...validFiles]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      const validFiles = droppedFiles.filter(f => f.size <= 100 * 1024 * 1024);
      
      if (validFiles.length < droppedFiles.length) {
        setError("Some files exceeded the 100MB limit and were skipped");
      } else {
        setError(null);
      }

      setFiles(prev => [...prev, ...validFiles]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const clearFiles = () => {
    setFiles([]);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  
  const removeFile = (indexToRemove: number) => {
    setFiles(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    setError(null);

    let successCount = 0;

    // Upload files sequentially for reliability
    for (let i = 0; i < files.length; i++) {
      setCurrentFileIndex(i);
      setProgress(0);
      
      const currentFile = files[i];
      const formData = new FormData();
      formData.append("file", currentFile);
      formData.append("userId", userId);
      if (currentFolder) {
        formData.append("parentId", currentFolder);
      }

      try {
        await axios.post("/api/files/upload", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              setProgress(percentCompleted);
            }
          },
        });
        successCount++;
      } catch (error) {
        console.error(`Error uploading file ${currentFile.name}:`, error);
        toast.error(`Upload Failed: ${currentFile.name}`, {
          description: "We couldn't upload this file.",
        });
        // Continue with the next file even if one fails
      }
    }

    setUploading(false);
    setCurrentFileIndex(-1);

    if (successCount > 0) {
      toast.success("Upload Complete", {
        description: `Successfully uploaded ${successCount} of ${files.length} files.`,
      });
      clearFiles();
      if (onUploadSuccess) onUploadSuccess();
    } else {
      setError("Failed to upload all files. Please try again.");
    }
  };

  const handleCreateFolder = async () => {
    if (!folderName.trim()) {
      toast.error("Invalid Folder Name", {
        description: "Please enter a valid folder name.",
      });
      return;
    }

    setCreatingFolder(true);

    try {
      await axios.post("/api/folders/create", {
        name: folderName.trim(),
        userId: userId,
        parentId: currentFolder,
      });

      toast.success("Folder Created", {
        description: `Folder "${folderName}" has been created successfully.`,
      });

      // Reset folder name and close modal
      setFolderName("");
      setFolderModalOpen(false);

      // Call the onUploadSuccess callback to refresh the file list
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (error) {
      console.error("Error creating folder:", error);
      toast.error("Folder Creation Failed", {
        description: "We couldn't create the folder. Please try again.",
      });
    } finally {
      setCreatingFolder(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Action buttons */}
      <div className="flex gap-2 mb-2">
        <Button
          variant="secondary"
          onClick={() => setFolderModalOpen(true)}
          className="flex-1"
        >
          <FolderPlus className="h-4 w-4 mr-2" />
          New Folder
        </Button>
        <Button
          variant="secondary"
          onClick={() => fileInputRef.current?.click()}
          className="flex-1"
        >
          <FileUp className="h-4 w-4 mr-2" />
          Add File
        </Button>
      </div>

      {/* File drop area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${error && files.length === 0
          ? "border-destructive/30 bg-destructive/5"
          : files.length > 0
            ? "border-primary/30 bg-primary/5"
            : "border-muted-foreground/20 hover:border-primary/50"
          }`}
      >
        {files.length === 0 ? (
          <div className="space-y-3">
            <FileUp className="h-12 w-12 mx-auto text-primary/70" />
            <div>
              <p className="text-muted-foreground">
                Drag and drop your file here, or{" "}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-primary cursor-pointer font-medium inline bg-transparent border-0 p-0 m-0 hover:underline"
                >
                  browse
                </button>
              </p>
              <p className="text-xs text-muted-foreground mt-1">Files up to 100MB</p>
            </div>
              <Input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              multiple
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
              {files.map((f, idx) => (
                <div key={idx} className="flex items-center justify-between bg-background p-2 rounded border">
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <div className="p-1.5 bg-primary/10 rounded-md shrink-0">
                      <FileUp className="h-4 w-4 text-primary" />
                    </div>
                    <div className="text-left overflow-hidden">
                      <p className="text-sm font-medium truncate max-w-[150px] sm:max-w-[200px]">
                        {f.name}
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-muted-foreground">
                          {f.size < 1024
                            ? `${f.size} B`
                            : f.size < 1024 * 1024
                              ? `${(f.size / 1024).toFixed(1)} KB`
                              : `${(f.size / (1024 * 1024)).toFixed(1)} MB`}
                        </p>
                        {uploading && currentFileIndex === idx && (
                          <span className="text-xs font-semibold text-primary">{progress}%</span>
                        )}
                        {uploading && currentFileIndex > idx && (
                          <span className="text-xs font-semibold text-green-500">Done</span>
                        )}
                      </div>
                    </div>
                  </div>
                  {!uploading && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFile(idx)}
                      className="text-muted-foreground hover:text-destructive shrink-0 h-8 w-8"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            
            {uploading && (
              <div className="space-y-1 text-left">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Uploading file {currentFileIndex + 1} of {files.length}</span>
                  <span>{progress}%</span>
                </div>
                <Progress
                  value={progress}
                  className="w-full h-2"
                />
              </div>
            )}

            {error && (
              <div className="bg-destructive/10 text-destructive p-3 rounded-lg flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span className="text-sm text-left">{error}</span>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={clearFiles}
                disabled={uploading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                isLoading={uploading}
                className="flex-1"
                disabled={uploading}
              >
                {uploading ? "Uploading..." : `Upload ${files.length} File${files.length > 1 ? "s" : ""}`}
                {!uploading && <ArrowRight className="h-4 w-4 ml-2" />}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Upload tips */}
      <div className="bg-muted/50 p-4 rounded-lg">
        <h4 className="text-sm font-medium mb-2">Tips</h4>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• Images are private and only visible to you</li>
          <li>• Supported formats: All files (Images, PDF, PPTX, TXT, Code, etc.)</li>
          <li>• Maximum file size: 100MB</li>
        </ul>
      </div>

      {/* Create Folder Modal */}
      <Dialog
        open={folderModalOpen}
        onOpenChange={setFolderModalOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex gap-2 items-center">
              <FolderPlus className="h-5 w-5 text-primary" />
              <span>New Folder</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Enter a name for your folder:
            </p>
            <Input
              type="text"
              label="Folder Name"
              placeholder="My Images"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              autoFocus
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setFolderModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateFolder}
              isLoading={creatingFolder}
              disabled={!folderName.trim()}
            >
              Create
              {!creatingFolder && <ArrowRight className="h-4 w-4 ml-2" />}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
