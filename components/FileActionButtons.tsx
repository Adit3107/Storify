"use client";

import { RefreshCw, Trash, Search, X, LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useRef } from "react";

interface FileActionButtonsProps {
  activeTab: string;
  trashCount: number;
  folderPath: Array<{ id: string; name: string }>;
  onRefresh: () => void;
  onEmptyTrash: () => void;
  onSearch: (query: string) => void;
  viewMode: "list" | "grid";
  onViewModeChange: (mode: "list" | "grid") => void;
}

export default function FileActionButtons({
  activeTab,
  trashCount,
  folderPath,
  onRefresh,
  onEmptyTrash,
  onSearch,
  viewMode,
  onViewModeChange,
}: FileActionButtonsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const initialMount = useRef(true);

  // Debounced search — wait 300ms after typing stops before firing API call
  // Without debounce: typing "resume" = 6 API calls
  // With debounce: typing "resume" = 1 API call after 300ms
  useEffect(() => {
    if (initialMount.current) {
      initialMount.current = false;
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      onSearch(searchQuery);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchQuery, onSearch]);

  const clearSearch = () => {
    setSearchQuery("");
    onSearch("");
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
      <h2 className="text-xl sm:text-2xl font-semibold truncate max-w-full">
        {activeTab === "all" &&
          (folderPath.length > 0
            ? folderPath[folderPath.length - 1].name
            : "All Files")}
        {activeTab === "starred" && "Starred Files"}
        {activeTab === "trash" && "Trash"}
      </h2>
      <div className="flex gap-2 sm:gap-3 self-end sm:self-auto items-center">
        {/* View Mode Toggle */}
        <div className="flex bg-muted rounded-md p-1 items-center">
          <Button
            variant={viewMode === "list" ? "solid" : "ghost"}
            size="icon"
            className="h-7 w-7 rounded-sm"
            onClick={() => onViewModeChange("list")}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "grid" ? "solid" : "ghost"}
            size="icon"
            className="h-7 w-7 rounded-sm"
            onClick={() => onViewModeChange("grid")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>

        {/* Search input — only show for all/starred tabs */}
        {activeTab !== "trash" && (
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-8 h-9 w-48 sm:w-56"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}
        <Button
          variant="flat"
          size="sm"
          onClick={onRefresh}
        >
          <RefreshCw className="h-4 w-4" />
          <span className="ml-1">Refresh</span>
        </Button>
        {activeTab === "trash" && trashCount > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={onEmptyTrash}
          >
            <Trash className="h-4 w-4" />
            <span className="ml-1">Empty Trash</span>
          </Button>
        )}
      </div>
    </div>
  );
}
