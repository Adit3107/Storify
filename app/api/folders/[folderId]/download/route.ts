import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { files } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const archiver = require("archiver");

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

    // Create a PassThrough stream to pipe the archive to the response
    const { PassThrough } = await import("stream");
    const stream = new PassThrough();
    
    // Create the archive
    const archive = archiver("zip", {
      zlib: { level: 5 } // Moderate compression
    });

    archive.on("error", (err: Error) => {
      console.error("Archive error:", err);
      stream.destroy(err);
    });

    // Pipe archive data to the stream
    archive.pipe(stream);

    // Convert Node.js readable stream to Web ReadableStream for NextResponse
    const webStream = new ReadableStream({
      start(controller) {
        stream.on("data", (chunk) => controller.enqueue(chunk));
        stream.on("end", () => controller.close());
        stream.on("error", (err) => controller.error(err));
      },
      cancel() {
        stream.destroy();
        archive.abort();
      }
    });

    // Start appending files asynchronously
    const appendFiles = async () => {
      for (const file of folderFiles) {
        if (!file.fileUrl) continue;
        try {
          // Fetch the file from ImageKit
          const response = await fetch(file.fileUrl);
          if (!response.ok || !response.body) throw new Error(`Failed to fetch ${file.name}`);
          const arrayBuffer = await response.arrayBuffer();
          archive.append(Buffer.from(arrayBuffer), { name: file.name });
        } catch (error) {
          console.error(`Failed to download ${file.name} for zip:`, error);
          // Continue with other files even if one fails
        }
      }
      archive.finalize();
    };

    appendFiles();

    // Return the response stream immediately
    return new NextResponse(webStream, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${folder.name}.zip"`,
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
