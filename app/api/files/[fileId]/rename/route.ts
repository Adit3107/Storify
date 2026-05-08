import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { files } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * PATCH /api/files/[fileId]/rename
 *
 * Rename is a metadata update with ownership validation and input checks.
 * The actual file in object storage (ImageKit) keeps its UUID-based filename —
 * only the display name (metadata) changes in the database.
 *
 * Edge cases handled:
 *   - Empty name rejected
 *   - Name too long (255 chars max) rejected
 *   - Only the file owner can rename
 */
export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ fileId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fileId } = await props.params;
    if (!fileId) {
      return NextResponse.json(
        { error: "File ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name } = body;

    // Validate name
    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json(
        { error: "Name cannot be empty" },
        { status: 400 }
      );
    }

    if (name.trim().length > 255) {
      return NextResponse.json(
        { error: "Name cannot exceed 255 characters" },
        { status: 400 }
      );
    }

    // Verify file ownership
    const [file] = await db
      .select()
      .from(files)
      .where(and(eq(files.id, fileId), eq(files.userId, userId)));

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Update name in database (metadata only — file in ImageKit keeps UUID name)
    const [updatedFile] = await db
      .update(files)
      .set({
        name: name.trim(),
        updatedAt: new Date(),
      })
      .where(and(eq(files.id, fileId), eq(files.userId, userId)))
      .returning();

    return NextResponse.json(updatedFile);
  } catch (error) {
    console.error("Error renaming file:", error);
    return NextResponse.json(
      { error: "Failed to rename file" },
      { status: 500 }
    );
  }
}
