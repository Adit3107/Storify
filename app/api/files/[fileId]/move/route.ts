import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { files } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * PATCH /api/files/[fileId]/move
 *
 * Move operation is not about physically moving the file in object storage.
 * It is a metadata update where parent-child relationships define folder structure.
 * The actual file stays in ImageKit at its original path — only the parentId changes.
 *
 * Validation:
 *   - File must belong to user
 *   - Target folder must belong to user and exist
 *   - Cannot move folder inside itself (prevents circular nesting)
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
    const { parentId } = body;

    // Verify file ownership
    const [file] = await db
      .select()
      .from(files)
      .where(and(eq(files.id, fileId), eq(files.userId, userId)));

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // If moving to root (parentId is null), just update
    if (!parentId) {
      const [updatedFile] = await db
        .update(files)
        .set({
          parentId: null,
          updatedAt: new Date(),
        })
        .where(and(eq(files.id, fileId), eq(files.userId, userId)))
        .returning();

      return NextResponse.json(updatedFile);
    }

    // Verify target folder exists and belongs to user
    const [targetFolder] = await db
      .select()
      .from(files)
      .where(
        and(
          eq(files.id, parentId),
          eq(files.userId, userId),
          eq(files.isFolder, true)
        )
      );

    if (!targetFolder) {
      return NextResponse.json(
        { error: "Target folder not found" },
        { status: 404 }
      );
    }

    // Prevent circular nesting: if moving a folder, walk up the target's
    // parent chain to ensure it doesn't include the folder being moved
    if (file.isFolder) {
      let currentParentId: string | null = parentId;
      while (currentParentId) {
        if (currentParentId === fileId) {
          return NextResponse.json(
            { error: "Cannot move folder inside itself" },
            { status: 400 }
          );
        }
        const [parent] = await db
          .select({ parentId: files.parentId })
          .from(files)
          .where(eq(files.id, currentParentId));
        currentParentId = parent?.parentId || null;
      }
    }

    // Update parentId (metadata only — file stays at same path in ImageKit)
    const [updatedFile] = await db
      .update(files)
      .set({
        parentId,
        updatedAt: new Date(),
      })
      .where(and(eq(files.id, fileId), eq(files.userId, userId)))
      .returning();

    return NextResponse.json(updatedFile);
  } catch (error) {
    console.error("Error moving file:", error);
    return NextResponse.json(
      { error: "Failed to move file" },
      { status: 500 }
    );
  }
}
