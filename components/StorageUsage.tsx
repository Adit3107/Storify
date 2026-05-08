"use client";

import { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { HardDrive } from "lucide-react";
import axios from "axios";
import StorageAnalytics from "./StorageAnalytics";

export default function StorageUsage({ refreshTrigger }: { refreshTrigger: number }) {
  const [used, setUsed] = useState(0);
  const [limit, setLimit] = useState(2 * 1024 * 1024 * 1024); // 2GB default
  const [breakdown, setBreakdown] = useState<{ name: string; value: number; fill: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStorage = async () => {
      try {
        const response = await axios.get("/api/storage");
        setUsed(response.data.used);
        setLimit(response.data.limit);
        if (response.data.breakdown) {
          setBreakdown(response.data.breakdown);
        }
      } catch (error) {
        console.error("Failed to fetch storage usage", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStorage();
  }, [refreshTrigger]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const percentage = Math.min((used / limit) * 100, 100);

  if (loading) {
    return <div className="h-4 w-full bg-muted animate-pulse rounded-full mt-4" />;
  }

  return (
    <div className="mt-4 bg-card border border-border p-4 rounded-xl shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <HardDrive className="h-4 w-4 text-primary" />
          <span>Storage</span>
        </div>
        <span className="text-xs text-muted-foreground font-medium">
          {formatBytes(used)} / {formatBytes(limit)}
        </span>
      </div>
      <Progress value={percentage} className="h-2" />
      <p className="text-xs text-muted-foreground mt-2">
        {percentage.toFixed(1)}% used
      </p>

      <StorageAnalytics data={breakdown} loading={loading} />
    </div>
  );
}
