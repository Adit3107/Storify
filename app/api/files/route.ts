import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { files } from "@/lib/db/schema";
import { eq, and, isNull, ilike, sql, count } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryUserId = searchParams.get("userId");
    const parentId = searchParams.get("parentId");
    const search = searchParams.get("search");
    const tab = searchParams.get("tab") || "all";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    // Verify the user is requesting their own files
    if (!queryUserId || queryUserId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Build conditions array — searchable metadata lives in the DB,
    // actual files live in ImageKit. This separation makes search faster
    // and cheaper than querying object storage directly.
    const conditions = [eq(files.userId, userId)];

    if (tab === "trash") {
      conditions.push(eq(files.isTrash, true));
    } else {
      conditions.push(eq(files.isTrash, false));
      
      if (tab === "starred") {
        conditions.push(eq(files.isStarred, true));
      }
      
      // Handle parentId based on tab
      if (tab === "all" && !search) {
        if (parentId === "all") {
          // No parentId restriction when fetching all folders
        } else if (parentId) {
          conditions.push(eq(files.parentId, parentId));
        } else {
          // Only filter by null parentId when not searching
          conditions.push(isNull(files.parentId));
        }
      }
    }

    if (search) {
      conditions.push(ilike(files.name, `%${search}%`));
    }

    const whereClause = and(...conditions);

    // Get total count for pagination
    const [{ total }] = await db
      .select({ total: count() })
      .from(files)
      .where(whereClause);

    // Pagination prevents over-fetching and keeps API responses predictable
    // as the user's file count grows.
    // OFFSET/LIMIT is fine for this scale. For very large datasets,
    // cursor-based pagination would be better.
    const offset = (page - 1) * limit;

    // Fetch paginated files from database
    const userFilesQuery = db
      .select()
      .from(files)
      .where(whereClause);
      
    if (tab === "recent") {
      userFilesQuery.orderBy(sql`${files.createdAt} DESC`).limit(10);
    } else {
      userFilesQuery.orderBy(
        sql`CASE WHEN ${files.isFolder} THEN 0 ELSE 1 END`, // Folders first
        sql`${files.createdAt} DESC` // Then newest first
      )
      .limit(limit)
      .offset(offset);
    }
    
    const userFiles = await userFilesQuery;

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      files: userFiles,
      total,
      page,
      limit,
      totalPages,
    });
  } catch (error) {
    console.error("Error fetching files:", error);
    return NextResponse.json(
      { error: "Failed to fetch files" },
      { status: 500 }
    );
  }
}