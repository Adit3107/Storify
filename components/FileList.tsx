"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { Folder, Star, Trash, X, ExternalLink, Share2, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatDistanceToNow, format } from "date-fns";
import type { File as FileType } from "@/lib/db/schema";
import axios from "axios";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import FileEmptyState from "@/components/FileEmptyState";
import FileIcon from "@/components/FileIcon";
import FileActions from "@/components/FileActions";
import FileLoadingState from "@/components/FileLoadingState";
import FileTabs from "@/components/FileTabs";
import FolderNavigation from "@/components/FolderNavigation";
import FileActionButtons from "@/components/FileActionButtons";
import FilePreviewModal from "@/components/FilePreviewModal";

interface FileListProps {
  userId: string;
  refreshTrigger?: number;
  onFolderChange?: (folderId: string | null) => void;
}

export default function FileList({
  userId,
  refreshTrigger = 0,
  onFolderChange,
}: FileListProps) {
  const [files, setFiles] = useState<FileType[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState<
    Array<{ id: string; name: string }>
  >([]);

  // Modal states
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [emptyTrashModalOpen, setEmptyTrashModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileType | null>(null);
  
  // Preview Modal state
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileType | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalFiles, setTotalFiles] = useState(0);

  // Drag and Drop state
  const [draggedFileId, setDraggedFileId] = useState<string | null>(null);
  const [dragTargetFolderId, setDragTargetFolderId] = useState<string | null>(null);
  const PAGE_LIMIT = 20;

  // View mode state
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  // Fetch files — supports search + pagination
  // Searchable metadata lives in DB, actual files live in ImageKit.
  // This separation makes search faster and cheaper.
  const fetchFiles = async (search?: string, page: number = 1) => {
    setLoading(true);
    try {
      let url = `/api/files?userId=${userId}&page=${page}&limit=${PAGE_LIMIT}&tab=${activeTab}`;
      if (currentFolder && !search && activeTab === "all") {
        url += `&parentId=${currentFolder}`;
      }
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }

      const response = await axios.get(url);
      const data = response.data;
      // API now returns { files, total, page, limit, totalPages }
      setFiles(data.files || data);
      setTotalFiles(data.total || 0);
      setTotalPages(data.totalPages || 1);
      setCurrentPage(data.page || 1);
    } catch (error) {
      console.error("Error fetching files:", error);
      toast.error("Error Loading Files", {
        description: "We couldn't load your files. Please try again later.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
    fetchFiles(query, 1);
  }, [currentFolder, userId]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchFiles(searchQuery, page);
  };

  // Fetch files when userId, refreshTrigger, currentFolder, or activeTab changes
  useEffect(() => {
    fetchFiles(searchQuery, 1);
  }, [userId, refreshTrigger, currentFolder, activeTab]);

  // Remove local filtering, just use the fetched files directly
  const filteredFiles = files;

  // Count files in trash (from current page)
  const trashCount = useMemo(() => {
    return files.filter((file) => file.isTrash).length;
  }, [files]);

  // Count starred files (from current page)
  const starredCount = useMemo(() => {
    return files.filter((file) => file.isStarred && !file.isTrash).length;
  }, [files]);

  const handleStarFile = async (fileId: string) => {
    try {
      await axios.patch(`/api/files/${fileId}/star`);

      // Update local state
      setFiles(
        files.map((file) =>
          file.id === fileId ? { ...file, isStarred: !file.isStarred } : file
        )
      );

      // Show toast
      const file = files.find((f) => f.id === fileId);
      toast.success(
        file?.isStarred ? "Removed from Starred" : "Added to Starred",
        {
          description: `"${file?.name}" has been ${file?.isStarred ? "removed from" : "added to"
            } your starred files`,
        }
      );
    } catch (error) {
      console.error("Error starring file:", error);
      toast.error("Action Failed", {
        description: "We couldn't update the star status. Please try again.",
      });
    }
  };

  const handleTrashFile = async (fileId: string) => {
    try {
      const response = await axios.patch(`/api/files/${fileId}/trash`);
      const responseData = response.data;

      // Update local state
      setFiles(
        files.map((file) =>
          file.id === fileId ? { ...file, isTrash: !file.isTrash } : file
        )
      );

      // Show toast
      const file = files.find((f) => f.id === fileId);
      toast.success(
        responseData.isTrash ? "Moved to Trash" : "Restored from Trash",
        {
          description: `"${file?.name}" has been ${responseData.isTrash ? "moved to trash" : "restored"
            }`,
        }
      );
    } catch (error) {
      console.error("Error trashing file:", error);
      toast.error("Action Failed", {
        description: "We couldn't update the file status. Please try again.",
      });
    }
  };



  const handleRename = async (fileId: string, newName: string) => {
    try {
      const response = await axios.patch(`/api/files/${fileId}/rename`, {
        name: newName,
      });
      const updatedFile = response.data;

      setFiles(
        files.map((f) => (f.id === fileId ? { ...f, name: updatedFile.name } : f))
      );

      toast.success("File Renamed", {
        description: `Renamed to "${updatedFile.name}"`,
      });
    } catch (error) {
      console.error("Error renaming file:", error);
      toast.error("Rename Failed", {
        description: "Could not rename file. Please try again.",
      });
    }
  };

  const handleMove = async (fileId: string, parentId: string | null) => {
    try {
      const response = await axios.patch(`/api/files/${fileId}/move`, {
        parentId,
      });
      const updatedFile = response.data;

      // Refresh file list since the file may have moved out of current view
      fetchFiles(searchQuery, currentPage);

      toast.success("File Moved", {
        description: parentId
          ? `Moved to folder`
          : `Moved to root`,
      });
    } catch (error) {
      console.error("Error moving file:", error);
      toast.error("Move Failed", {
        description: "Could not move file. Please try again.",
      });
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    try {
      // Store file info before deletion for the toast message
      const fileToDelete = files.find((f) => f.id === fileId);
      const fileName = fileToDelete?.name || "File";

      // Send delete request
      const response = await axios.delete(`/api/files/${fileId}/delete`);

      if (response.data.success) {
        // Remove file from local state
        setFiles(files.filter((file) => file.id !== fileId));

        // Show success toast
        toast.success("File Permanently Deleted", {
          description: `"${fileName}" has been permanently removed`,
        });

        // Close modal if it was open
        setDeleteModalOpen(false);
      } else {
        throw new Error(response.data.error || "Failed to delete file");
      }
    } catch (error) {
      console.error("Error deleting file:", error);
      toast.error("Deletion Failed", {
        description: "We couldn't delete the file. Please try again later.",
      });
    }
  };

  const handleEmptyTrash = async () => {
    try {
      await axios.delete(`/api/files/empty-trash`);

      // Remove all trashed files from local state
      setFiles(files.filter((file) => !file.isTrash));

      // Show toast
      toast.success("Trash Emptied", {
        description: `All ${trashCount} items have been permanently deleted`,
      });

      // Close modal
      setEmptyTrashModalOpen(false);
    } catch (error) {
      console.error("Error emptying trash:", error);
      toast.error("Action Failed", {
        description: "We couldn't empty the trash. Please try again later.",
      });
    }
  };

  const handleDownloadFile = async (file: FileType) => {
    let toastId;
    try {
      // Show loading toast
      toastId = toast.loading("Preparing Download", {
        description: `Getting "${file.name}" ready for download...`,
      });

      // For images, we can use the ImageKit URL directly with optimized settings
      if (file.type.startsWith("image/")) {
        // Create a download-optimized URL with ImageKit
        // Using high quality and original dimensions for downloads
        const downloadUrl = `${process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT}/tr:q-100,orig-true/${file.path}`;

        // Fetch the image first to ensure it's available
        const response = await fetch(downloadUrl);
        if (!response.ok) {
          throw new Error(`Failed to download image: ${response.statusText}`);
        }

        // Get the blob data
        const blob = await response.blob();

        // Create a download link
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = file.name;
        document.body.appendChild(link);

        // Remove loading toast and show success toast
        toast.success("Download Ready", {
          id: toastId,
          description: `"${file.name}" is ready to download.`,
        });

        // Trigger download
        link.click();

        // Clean up
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      } else {
        // For other file types, use the fileUrl directly
        if (!file.fileUrl) {
          throw new Error("File URL not available");
        }
        const response = await fetch(file.fileUrl);
        if (!response.ok) {
          throw new Error(`Failed to download file: ${response.statusText}`);
        }

        // Get the blob data
        const blob = await response.blob();

        // Create a download link
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = file.name;
        document.body.appendChild(link);

        // Remove loading toast and show success toast
        toast.success("Download Ready", {
          id: toastId,
          description: `"${file.name}" is ready to download.`,
        });

        // Trigger download
        link.click();

        // Clean up
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      }
    } catch (error) {
      console.error("Error downloading file:", error);
      toast.error("Download Failed", {
        id: toastId,
        description: "We couldn't download the file. Please try again later.",
      });
    }
  };

  // Function to open image in a new tab with optimized view
  const openImageViewer = (file: FileType) => {
    if (file.type.startsWith("image/")) {
      // Create an optimized URL with ImageKit transformations for viewing
      // Using higher quality and responsive sizing for better viewing experience
      const optimizedUrl = `${process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT}/tr:q-90,w-1600,h-1200,fo-auto/${file.path}`;
      window.open(optimizedUrl, "_blank");
    }
  };

  // Navigate to a folder
  const navigateToFolder = (folderId: string, folderName: string) => {
    setCurrentFolder(folderId);
    setFolderPath([...folderPath, { id: folderId, name: folderName }]);

    // Notify parent component about folder change
    if (onFolderChange) {
      onFolderChange(folderId);
    }
  };

  // Navigate back to parent folder
  const navigateUp = () => {
    if (folderPath.length > 0) {
      const newPath = [...folderPath];
      newPath.pop();
      setFolderPath(newPath);
      const newFolderId =
        newPath.length > 0 ? newPath[newPath.length - 1].id : null;
      setCurrentFolder(newFolderId);

      // Notify parent component about folder change
      if (onFolderChange) {
        onFolderChange(newFolderId);
      }
    }
  };

  // Navigate to specific folder in path
  const navigateToPathFolder = (index: number) => {
    if (index < 0) {
      setCurrentFolder(null);
      setFolderPath([]);

      // Notify parent component about folder change
      if (onFolderChange) {
        onFolderChange(null);
      }
    } else {
      const newPath = folderPath.slice(0, index + 1);
      setFolderPath(newPath);
      const newFolderId = newPath[newPath.length - 1].id;
      setCurrentFolder(newFolderId);

      // Notify parent component about folder change
      if (onFolderChange) {
        onFolderChange(newFolderId);
      }
    }
  };

  // Handle file or folder click
  const handleItemClick = (file: FileType) => {
    if (file.isFolder) {
      navigateToFolder(file.id, file.name);
    } else {
      const type = file.type?.toLowerCase() || "";
      if (type.startsWith("image/") || type.startsWith("video/") || type.includes("pdf")) {
        setPreviewFile(file);
        setPreviewModalOpen(true);
      } else if (file.fileUrl) {
        window.open(file.fileUrl, "_blank");
      }
    }
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, file: FileType) => {
    if (file.isTrash) {
      e.preventDefault();
      return;
    }
    setDraggedFileId(file.id);
    e.dataTransfer.setData("text/plain", file.id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, targetFile: FileType) => {
    e.preventDefault();
    if (!targetFile.isFolder || targetFile.id === draggedFileId) return;
    
    e.dataTransfer.dropEffect = "move";
    setDragTargetFolderId(targetFile.id);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragTargetFolderId(null);
  };

  const handleDrop = async (e: React.DragEvent, targetFile: FileType) => {
    e.preventDefault();
    setDragTargetFolderId(null);
    
    const fileId = e.dataTransfer.getData("text/plain");
    
    if (!targetFile.isFolder || fileId === targetFile.id) return;
    
    // Check if dragged file exists
    const fileToMove = files.find(f => f.id === fileId);
    if (!fileToMove) return;

    // Call existing move handler
    await handleMove(fileId, targetFile.id);
  };



  return (
    <div className="space-y-6">
      {/* Tabs for filtering files */}
      <FileTabs
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setCurrentPage(1);
        }}
      />

      {/* Folder navigation */}
      {activeTab === "all" && (
        <FolderNavigation
          folderPath={folderPath}
          navigateUp={navigateUp}
          navigateToPathFolder={navigateToPathFolder}
        />
      )}

      {/* Action buttons */}
      <FileActionButtons
        activeTab={activeTab}
        trashCount={trashCount}
        folderPath={folderPath}
        onRefresh={() => fetchFiles(searchQuery)}
        onEmptyTrash={() => setEmptyTrashModalOpen(true)}
        onSearch={handleSearch}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      <Separator className="my-4" />

      {/* Files table / grid */}
      {loading ? (
        <FileLoadingState />
      ) : filteredFiles.length === 0 ? (
        <FileEmptyState activeTab={activeTab} />
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filteredFiles.map((file) => (
            <Card
              key={file.id}
              className={`overflow-hidden transition-all group ${
                dragTargetFolderId === file.id ? "ring-2 ring-primary bg-primary/10" : "hover:ring-2 hover:ring-primary/50 cursor-pointer"
              } ${draggedFileId === file.id ? "opacity-50" : ""}`}
              onClick={() => handleItemClick(file)}
              draggable={!file.isTrash}
              onDragStart={(e) => handleDragStart(e, file)}
              onDragOver={(e) => handleDragOver(e, file)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, file)}
            >
              <div className="aspect-square bg-muted flex items-center justify-center p-4 relative">
                {file.isFolder ? (
                  <Folder className="h-16 w-16 text-blue-500" />
                ) : file.type && file.type.startsWith("image/") ? (
                  <img
                    src={`${process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT}/tr:w-200,h-200,fo-auto/${file.path}`}
                    alt={file.name}
                    className="w-full h-full object-cover rounded-md"
                  />
                ) : (
                  <FileIcon file={file} />
                )}
                
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 rounded-md backdrop-blur-sm" onClick={(e) => e.stopPropagation()}>
                  <FileActions
                    file={file}
                    onStar={handleStarFile}
                    onTrash={handleTrashFile}
                    onDelete={(f) => {
                      setSelectedFile(f);
                      setDeleteModalOpen(true);
                    }}
                    onDownload={handleDownloadFile}
                    onRename={handleRename}
                    onMove={handleMove}
                  />
                </div>
              </div>
              <div className="p-3 border-t">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate" title={file.name}>
                    {file.name}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-1 flex justify-between">
                  <span>{file.isFolder ? "Folder" : file.size < 1024 * 1024 ? `${(file.size / 1024).toFixed(0)} KB` : `${(file.size / (1024 * 1024)).toFixed(1)} MB`}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card
          className="border border-border bg-card overflow-hidden shadow-sm"
        >
          <div className="overflow-x-auto">
            <Table
              aria-label="Files table"
              className="min-w-full"
            >
              <TableHeader>
                <TableRow>
                  <TableColumn>Name</TableColumn>
                  <TableColumn className="hidden sm:table-cell">Type</TableColumn>
                  <TableColumn className="hidden md:table-cell">Size</TableColumn>
                  <TableColumn className="w-40">Actions</TableColumn>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFiles.map((file) => (
                  <TableRow
                    key={file.id}
                    className={`transition-colors ${file.isFolder || (file.type && file.type.startsWith("image/"))
                      ? "cursor-pointer"
                      : ""
                      } ${dragTargetFolderId === file.id ? "bg-primary/10" : "hover:bg-muted"} 
                      ${draggedFileId === file.id ? "opacity-50" : ""}`}
                    onClick={() => handleItemClick(file)}
                    draggable={!file.isTrash}
                    onDragStart={(e) => handleDragStart(e, file)}
                    onDragOver={(e) => handleDragOver(e, file)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, file)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <FileIcon file={file} />
                        <div>
                          <div className="font-medium flex items-center gap-2 text-foreground">
                            <span className="truncate max-w-[150px] sm:max-w-[200px] md:max-w-[300px]">
                              {file.name}
                            </span>
                            {file.isStarred && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="inline-flex cursor-help">
                                      <Star
                                        className="h-4 w-4 text-yellow-400"
                                        fill="currentColor"
                                      />
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>Starred</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                            {file.isFolder && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="inline-flex cursor-help">
                                      <Folder className="h-3 w-3 text-muted-foreground" />
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>Folder</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                            {file.type.startsWith("image/") && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <ExternalLink className="h-3 w-3 text-muted-foreground" />
                                  </TooltipTrigger>
                                  <TooltipContent>Click to view image</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div className="text-xs text-muted-foreground">
                        {file.isFolder ? "Folder" : file.type}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="text-foreground">
                        {file.isFolder
                          ? "-"
                          : file.size < 1024
                            ? `${file.size} B`
                            : file.size < 1024 * 1024
                              ? `${(file.size / 1024).toFixed(1)} KB`
                              : `${(file.size / (1024 * 1024)).toFixed(1)} MB`}
                      </div>
                    </TableCell>

                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <FileActions
                        file={file}
                        onStar={handleStarFile}
                        onTrash={handleTrashFile}
                        onDelete={(file) => {
                          setSelectedFile(file);
                          setDeleteModalOpen(true);
                        }}
                        onDownload={handleDownloadFile}
                        onRename={handleRename}
                        onMove={handleMove}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">
            {totalFiles} file{totalFiles !== 1 ? "s" : ""} · Page {currentPage} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="flat"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="ml-1">Previous</span>
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => {
                // Show first, last, current, and neighbors
                if (p === 1 || p === totalPages) return true;
                if (Math.abs(p - currentPage) <= 1) return true;
                return false;
              })
              .map((p, i, arr) => (
                <span key={p} className="flex items-center">
                  {i > 0 && arr[i - 1] !== p - 1 && (
                    <span className="px-1 text-muted-foreground">...</span>
                  )}
                  <Button
                    variant={p === currentPage ? "solid" : "flat"}
                    size="sm"
                    onClick={() => handlePageChange(p)}
                    className="min-w-0 w-9 h-9 p-0"
                  >
                    {p}
                  </Button>
                </span>
              ))}
            <Button
              variant="flat"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
            >
              <span className="mr-1">Next</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        title="Confirm Permanent Deletion"
        description={`Are you sure you want to permanently delete this file?`}
        icon={X}
        iconColor="text-danger"
        confirmText="Delete Permanently"
        confirmColor="danger"
        onConfirm={() => {
          if (selectedFile) {
            handleDeleteFile(selectedFile.id);
          }
        }}
        isDangerous={true}
        warningMessage={`You are about to permanently delete "${selectedFile?.name}". This file will be permanently removed from your account and cannot be recovered.`}
      />

      {/* Empty trash confirmation modal */}
      <ConfirmationModal
        isOpen={emptyTrashModalOpen}
        onOpenChange={setEmptyTrashModalOpen}
        title="Empty Trash"
        description={`Are you sure you want to empty the trash?`}
        icon={Trash}
        iconColor="text-danger"
        confirmText="Empty Trash"
        confirmColor="danger"
        onConfirm={handleEmptyTrash}
        isDangerous={true}
        warningMessage={`You are about to permanently delete all ${trashCount} items in your trash. These files will be permanently removed from your account and cannot be recovered.`}
      />

      {/* File Preview Modal */}
      <FilePreviewModal 
        file={previewFile}
        isOpen={previewModalOpen}
        onOpenChange={setPreviewModalOpen}
      />
    </div>
  );
}
