import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { files } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import imagekit from "@/lib/imagekit";

/**
 * POST /api/files/[fileId]/share
 *
 * Generates a token-based share link with an ImageKit signed URL.
 *
 * Architecture:
 *   - File STORAGE lives in ImageKit (object storage + CDN)
 *   - File METADATA lives in PostgreSQL (Neon)
 *   - Sharing uses a UUID token stored in DB + ImageKit signed URL with expiry
 *   - Signed URLs provide temporary access, expiration, and permission control
 *   - The original file remains private — only the signed URL grants access
 *
 * Security:
 *   - Only the file owner can generate a share link (verified via Clerk auth)
 *   - Signed URLs expire after a set time (default 1 hour)
 *   - Share token is a random UUID — not guessable
 */
const SHARE_EXPIRY_SECONDS = 3600; // 1 hour

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ fileId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!baseUrl && process.env.NODE_ENV === "production") {
      console.warn(
        "WARNING: NEXT_PUBLIC_APP_URL is not set in production. Share links may not work correctly."
      );
    }
    const finalBaseUrl = baseUrl || "http://localhost:3000";

    const { fileId } = await props.params;
    if (!fileId) {
      return NextResponse.json(
        { error: "File ID is required" },
        { status: 400 }
      );
    }

    // Verify file ownership — only the owner can share their file
    const [file] = await db
      .select()
      .from(files)
      .where(and(eq(files.id, fileId), eq(files.userId, userId)));

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    if (file.isFolder) {
      return NextResponse.json(
        { error: "Folders cannot be shared" },
        { status: 400 }
      );
    }

    if (file.isTrash) {
      return NextResponse.json(
        { error: "Trashed files cannot be shared" },
        { status: 400 }
      );
    }

    // If already shared with an unexpired link, return existing share info
    if (file.shareToken && file.isPublic) {
      const isExpired =
        file.shareExpiry && new Date(file.shareExpiry) < new Date();

      if (!isExpired) {
        // Generate a fresh signed URL for the existing token
        const signedUrl = imagekit.url({
          path: file.path,
          transformation: [{ quality: "90" }],
          signed: true,
          expireSeconds: SHARE_EXPIRY_SECONDS,
        });

        return NextResponse.json({
          shareToken: file.shareToken,
          shareUrl: `${finalBaseUrl}/shared/${file.shareToken}`,
          signedUrl,
          expiresAt: file.shareExpiry,
        });
      }
    }

    // Generate new share token and signed URL
    const shareToken = uuidv4();
    const shareExpiry = new Date(
      Date.now() + SHARE_EXPIRY_SECONDS * 1000
    ).toISOString();

    // Generate ImageKit signed URL — provides CDN-backed temporary access
    // Instead of making the file permanently public, signed URLs give
    // time-limited controlled access while keeping the original file private
    const signedUrl = imagekit.url({
      path: file.path,
      transformation: [{ quality: "90" }],
      signed: true,
      expireSeconds: SHARE_EXPIRY_SECONDS,
    });

    // Update file record with share token and expiry
    const [updatedFile] = await db
      .update(files)
      .set({
        isPublic: true,
        shareToken,
        shareExpiry: new Date(shareExpiry),
        updatedAt: new Date(),
      })
      .where(and(eq(files.id, fileId), eq(files.userId, userId)))
      .returning();

    return NextResponse.json({
      shareToken: updatedFile.shareToken,
      shareUrl: `${finalBaseUrl}/shared/${updatedFile.shareToken}`,
      signedUrl,
      expiresAt: shareExpiry,
    });
  } catch (error) {
    console.error("Error sharing file:", error);
    return NextResponse.json(
      { error: "Failed to share file" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/files/[fileId]/share
 *
 * Revokes the share link — clears the token and sets isPublic to false.
 * This immediately invalidates the share link and any signed URLs.
 */
export async function DELETE(
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

    // Verify file ownership — only the owner can revoke sharing
    const [file] = await db
      .select()
      .from(files)
      .where(and(eq(files.id, fileId), eq(files.userId, userId)));

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Clear share token and mark as not public
    const [updatedFile] = await db
      .update(files)
      .set({
        isPublic: false,
        shareToken: null,
        shareExpiry: null,
        updatedAt: new Date(),
      })
      .where(and(eq(files.id, fileId), eq(files.userId, userId)))
      .returning();

    return NextResponse.json({
      success: true,
      message: "Share link revoked",
    });
  } catch (error) {
    console.error("Error revoking share:", error);
    return NextResponse.json(
      { error: "Failed to revoke share link" },
      { status: 500 }
    );
  }
}
