import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { files } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import JSZip from "jszip";

export async function GET(request: NextRequest, context: { params: Promise<{ folderId: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Await params as required by Next.js 15
    const { folderId } = await context.params;

    // Verify folder exists and belongs to user
    const [folder] = await db
      .select()
      .from(files)
      .where(and(eq(files.id, folderId), eq(files.userId, userId), eq(files.isFolder, true)));

    if (!folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    // Get all files directly inside this folder
    const folderFiles = await db
      .select()
      .from(files)
      .where(and(eq(files.parentId, folderId), eq(files.isFolder, false), eq(files.isTrash, false)));

    if (folderFiles.length === 0) {
      return NextResponse.json({ error: "Folder is empty" }, { status: 400 });
    }

    // Create a new ZIP archive using JSZip (pure JS, works in serverless)
    const zip = new JSZip();

    // Fetch all files and add them to the ZIP
    for (const file of folderFiles) {
      if (!file.fileUrl) continue;
      try {
        const response = await fetch(file.fileUrl);
        if (!response.ok) throw new Error(`Failed to fetch ${file.name}`);
        const arrayBuffer = await response.arrayBuffer();
        zip.file(file.name, arrayBuffer);
      } catch (error) {
        console.error(`Failed to download ${file.name} for zip:`, error);
        // Continue with other files even if one fails
      }
    }

    // Generate the ZIP as an ArrayBuffer
    const zipArrayBuffer = await zip.generateAsync({ type: "arraybuffer", compression: "DEFLATE", compressionOptions: { level: 5 } });

    // Return the ZIP as a downloadable response
    return new NextResponse(zipArrayBuffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${folder.name}.zip"`,
        "Content-Length": zipArrayBuffer.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error("Error creating zip:", error);
    return NextResponse.json(
      { error: "Failed to create zip archive" },
      { status: 500 }
    );
  }
}
