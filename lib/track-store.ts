import path from "path";
import { DatabaseSync } from "node:sqlite";

type RawTrackRecord = {
  id: number;
  title: string;
  slug: string;
  audioPath: string;
  coverPath: string | null;
  lyrics: string;
  style: string;
  tags: string;
  sourceType: string;
  createdByUserId: number | null;
  createdAt: string;
  updatedAt: string;
  releaseDate: string | null;
  isPublished: number;
};

const databaseFilePath = path.join(process.cwd(), "prisma", "dev.db");

const globalForTrackDatabase = globalThis as typeof globalThis & {
  trackDatabase?: DatabaseSync;
  trackSchemaReady?: boolean;
};

function getTrackDatabase() {
  if (!globalForTrackDatabase.trackDatabase) {
    globalForTrackDatabase.trackDatabase = new DatabaseSync(databaseFilePath);
  }

  if (!globalForTrackDatabase.trackSchemaReady) {
    const database = globalForTrackDatabase.trackDatabase;

    database.exec(`
      CREATE TABLE IF NOT EXISTS "Track" (
        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        "title" TEXT NOT NULL,
        "slug" TEXT NOT NULL UNIQUE,
        "audioPath" TEXT NOT NULL,
        "coverPath" TEXT,
        "lyrics" TEXT NOT NULL,
        "style" TEXT NOT NULL,
        "tags" TEXT NOT NULL,
        "sourceType" TEXT NOT NULL DEFAULT 'SUNO',
        "createdByUserId" INTEGER,
        "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "releaseDate" TEXT,
        "isPublished" INTEGER NOT NULL DEFAULT 1,
        FOREIGN KEY ("createdByUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
      );
    `);

    database.exec(`
      CREATE TABLE IF NOT EXISTS "Favorite" (
        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        "userId" INTEGER NOT NULL,
        "trackId" INTEGER NOT NULL,
        "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY ("trackId") REFERENCES "Track" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
      CREATE UNIQUE INDEX IF NOT EXISTS "Favorite_userId_trackId_key" ON "Favorite"("userId", "trackId");
    `);

    database.exec(`
      CREATE TABLE IF NOT EXISTS "Video" (
        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        "title" TEXT NOT NULL,
        "slug" TEXT NOT NULL UNIQUE,
        "videoPath" TEXT NOT NULL,
        "thumbnailPath" TEXT,
        "description" TEXT,
        "createdByUserId" INTEGER,
        "trackId" INTEGER,
        "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("createdByUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
        FOREIGN KEY ("trackId") REFERENCES "Track" ("id") ON DELETE SET NULL ON UPDATE CASCADE
      );
    `);

    globalForTrackDatabase.trackSchemaReady = true;
  }

  return globalForTrackDatabase.trackDatabase;
}

export function findTrackRecordBySlug(slug: string) {
  const database = getTrackDatabase();
  const statement = database.prepare(
    `SELECT * FROM "Track" WHERE "slug" = ?1 LIMIT 1`
  );

  return (statement.get(slug) as RawTrackRecord | undefined) ?? null;
}

export function listPublishedTrackRecords(limit?: number) {
  const database = getTrackDatabase();
  const statement = database.prepare(
    limit
      ? `SELECT * FROM "Track" WHERE "isPublished" = 1 ORDER BY datetime("createdAt") DESC LIMIT ?1`
      : `SELECT * FROM "Track" WHERE "isPublished" = 1 ORDER BY datetime("createdAt") DESC`
  );

  return (limit
    ? statement.all(limit)
    : statement.all()) as RawTrackRecord[];
}

export function createTrackRecord(input: {
  title: string;
  slug: string;
  audioPath: string;
  coverPath: string;
  lyrics: string;
  style: string;
  tags: string;
  sourceType: string;
  createdByUserId: number;
}) {
  const database = getTrackDatabase();
  const now = new Date().toISOString();
  const insertStatement = database.prepare(`
    INSERT INTO "Track" (
      "title",
      "slug",
      "audioPath",
      "coverPath",
      "lyrics",
      "style",
      "tags",
      "sourceType",
      "createdByUserId",
      "createdAt",
      "updatedAt",
      "isPublished"
    ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, 1)
  `);
  const selectStatement = database.prepare(`SELECT * FROM "Track" WHERE "id" = ?1 LIMIT 1`);
  const result = insertStatement.run(
    input.title,
    input.slug,
    input.audioPath,
    input.coverPath,
    input.lyrics,
    input.style,
    input.tags,
    input.sourceType,
    input.createdByUserId,
    now,
    now
  );
  const insertedId = Number(result.lastInsertRowid);

  return selectStatement.get(insertedId) as RawTrackRecord;
}
