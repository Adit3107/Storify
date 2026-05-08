"use client";

import { File, Star, Trash, Clock } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Badge from "@/components/ui/Badge";
import type { File as FileType } from "@/lib/db/schema";

interface FileTabsProps {
  activeTab: string;
  onTabChange: (key: string) => void;
}

export default function FileTabs({
  activeTab,
  onTabChange,
}: FileTabsProps) {
  return (
    <Tabs
      value={activeTab}
      onValueChange={onTabChange}
      className="w-full"
    >
      <TabsList className="w-full justify-start overflow-x-auto h-auto p-0 bg-transparent border-b rounded-none">
        <TabsTrigger
          value="all"
          className="py-3 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <File className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="font-medium">All Files</span>
          </div>
        </TabsTrigger>
        <TabsTrigger
          value="recent"
          className="py-3 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="font-medium">Recent</span>
          </div>
        </TabsTrigger>
        <TabsTrigger
          value="starred"
          className="py-3 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <Star className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="font-medium">Starred</span>
          </div>
        </TabsTrigger>
        <TabsTrigger
          value="trash"
          className="py-3 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <Trash className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="font-medium">Trash</span>
          </div>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
