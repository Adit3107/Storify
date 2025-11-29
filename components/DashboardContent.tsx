"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileUp, FileText, User } from "lucide-react";
import FileUploadForm from "@/components/FileUploadForm";
import FileList from "@/components/FileList";
import UserProfile from "@/components/UserProfile";
import { useSearchParams } from "next/navigation";

interface DashboardContentProps {
  userId: string;
  userName: string;
}

export default function DashboardContent({
  userId,
  userName,
}: DashboardContentProps) {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");

  const [activeTab, setActiveTab] = useState<string>("files");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);

  // Set the active tab based on URL parameter
  useEffect(() => {
    if (tabParam === "profile") {
      setActiveTab("profile");
    } else {
      setActiveTab("files");
    }
  }, [tabParam]);

  const handleFileUploadSuccess = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  const handleFolderChange = useCallback((folderId: string | null) => {
    setCurrentFolder(folderId);
  }, []);

  return (
    <>
      <div className="mb-8">
        <h2 className="text-4xl font-bold text-foreground">
          Hi,{" "}
          <span className="text-primary">
            {userName?.length > 10
              ? `${userName?.substring(0, 10)}...`
              : userName?.split(" ")[0] || "there"}
          </span>
          !
        </h2>
        <p className="text-muted-foreground mt-2 text-lg">
          Your images are waiting for you.
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value)}
        className="w-full"
      >
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
          <TabsTrigger value="files" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span>My Files</span>
          </TabsTrigger>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>Profile</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="files" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <Card className="border border-border bg-card shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2">
                  <FileUp className="h-5 w-5 text-primary" />
                  <CardTitle className="text-xl font-semibold">Upload</CardTitle>
                </CardHeader>
                <CardContent>
                  <FileUploadForm
                    userId={userId}
                    onUploadSuccess={handleFileUploadSuccess}
                    currentFolder={currentFolder}
                  />
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2">
              <Card className="border border-border bg-card shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <CardTitle className="text-xl font-semibold">Your Files</CardTitle>
                </CardHeader>
                <CardContent>
                  <FileList
                    userId={userId}
                    refreshTrigger={refreshTrigger}
                    onFolderChange={handleFolderChange}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="profile">
          <div className="mt-2">
            <UserProfile />
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}
