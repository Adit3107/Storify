import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { files } from "@/lib/db/schema";
import { eq, sum } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Calculate total storage used by the user and fetch all files to calculate breakdown
    const allUserFiles = await db
      .select({ size: files.size, type: files.type })
      .from(files)
      .where(eq(files.userId, userId));

    let usedBytes = 0;
    let imageBytes = 0;
    let videoBytes = 0;
    let documentBytes = 0;
    let otherBytes = 0;

    allUserFiles.forEach(file => {
      const size = Number(file.size || 0);
      usedBytes += size;
      
      const type = file.type?.toLowerCase() || "";
      if (type.startsWith("image/")) {
        imageBytes += size;
      } else if (type.startsWith("video/")) {
        videoBytes += size;
      } else if (type.includes("pdf") || type.includes("document") || type.includes("msword") || type.includes("excel") || type.includes("csv") || type.includes("text/")) {
        documentBytes += size;
      } else if (type !== "folder") {
        otherBytes += size;
      }
    });
    
    // Set a default limit, e.g., 2GB
    const limitBytes = 2 * 1024 * 1024 * 1024;

    return NextResponse.json({
      used: usedBytes,
      limit: limitBytes,
      percentage: Math.min((usedBytes / limitBytes) * 100, 100),
      breakdown: [
        { name: "Images", value: imageBytes, fill: "#3b82f6" }, // blue-500
        { name: "Videos", value: videoBytes, fill: "#8b5cf6" }, // violet-500
        { name: "Documents", value: documentBytes, fill: "#f59e0b" }, // amber-500
        { name: "Other", value: otherBytes, fill: "#9ca3af" }, // gray-400
      ]
    });
  } catch (error) {
    console.error("Error fetching storage usage:", error);
    return NextResponse.json(
      { error: "Failed to fetch storage usage" },
      { status: 500 }
    );
  }
}
