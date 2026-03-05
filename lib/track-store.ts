import os from "os";
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

type UploadAccessSettings = {
  allowDillonUpload: boolean;
  allowNickUpload: boolean;
};

export type RawVideoRecord = {
  id: number;
  title: string;
  slug: string;
  videoPath: string;
  thumbnailPath: string | null;
  description: string | null;
  createdByUserId: number | null;
  trackId: number | null;
  createdAt: string;
  updatedAt: string;
};

const isServerlessRuntime =
  process.env.VERCEL === "1" ||
  Boolean(process.env.VERCEL_ENV) ||
  process.cwd().startsWith("/var/task") ||
  process.env.NODE_ENV === "production";

const databaseFilePath = isServerlessRuntime
  ? path.join(os.tmpdir(), "jayton-ai-music-vault.db")
  : path.join(process.cwd(), "prisma", "dev.db");

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
      CREATE TABLE IF NOT EXISTS "User" (
        "id" INTEGER NOT NULL PRIMARY KEY,
        "username" TEXT NOT NULL UNIQUE,
        "displayName" TEXT NOT NULL
      );
    `);

    database.exec(`
      INSERT OR IGNORE INTO "User" ("id", "username", "displayName") VALUES
      (1, 'jayton', 'Jayton'),
      (2, 'dillon', 'Dillon'),
      (3, 'nick', 'Nick');
    `);

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

    database.exec(`
      CREATE TABLE IF NOT EXISTS "PortalSetting" (
        "key" TEXT NOT NULL PRIMARY KEY,
        "value" TEXT NOT NULL,
        "updatedAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
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
  releaseDate?: string | null;
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
      "releaseDate",
      "isPublished"
    ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, 1)
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
    now,
    input.releaseDate ?? null
  );
  const insertedId = Number(result.lastInsertRowid);

  return selectStatement.get(insertedId) as RawTrackRecord;
}

export function getUploadAccessSettings(): UploadAccessSettings {
  const database = getTrackDatabase();
  const statement = database.prepare(
    `SELECT "key", "value" FROM "PortalSetting" WHERE "key" IN ('allowDillonUpload','allowNickUpload')`
  );
  const rows = statement.all() as Array<{ key: string; value: string }>;
  const map = new Map(rows.map((row) => [row.key, row.value]));
  const parseSetting = (value: string | undefined) => {
    if (typeof value === "undefined") {
      return true;
    }

    return value === "true";
  };

  return {
    allowDillonUpload: parseSetting(map.get("allowDillonUpload")),
    allowNickUpload: parseSetting(map.get("allowNickUpload"))
  };
}

export function setUploadAccessSettings(input: UploadAccessSettings): UploadAccessSettings {
  const database = getTrackDatabase();
  const now = new Date().toISOString();
  const upsert = database.prepare(`
    INSERT INTO "PortalSetting" ("key", "value", "updatedAt")
    VALUES (?1, ?2, ?3)
    ON CONFLICT("key") DO UPDATE SET "value"=excluded."value", "updatedAt"=excluded."updatedAt"
  `);

  try {
    upsert.run("allowDillonUpload", String(input.allowDillonUpload), now);
    upsert.run("allowNickUpload", String(input.allowNickUpload), now);
  } catch (error) {
    if (error instanceof Error && /readonly/i.test(error.message)) {
      return getUploadAccessSettings();
    }

    throw error;
  }

  return getUploadAccessSettings();
}

export function deleteTrackRecordById(trackId: number) {
  const database = getTrackDatabase();
  const statement = database.prepare(`DELETE FROM "Track" WHERE "id" = ?1`);
  const result = statement.run(trackId);
  return Number(result.changes) > 0;
}

export function listVideoRecords() {
  const database = getTrackDatabase();
  const statement = database.prepare(`
    SELECT *
    FROM "Video"
    ORDER BY datetime("createdAt") DESC
  `);

  return statement.all() as RawVideoRecord[];
}

export function findVideoRecordBySlug(slug: string) {
  const database = getTrackDatabase();
  const statement = database.prepare(`
    SELECT *
    FROM "Video"
    WHERE "slug" = ?1
    LIMIT 1
  `);

  return (statement.get(slug) as RawVideoRecord | undefined) ?? null;
}

export function findVideoRecordByTrackId(trackId: number) {
  const database = getTrackDatabase();
  const statement = database.prepare(`
    SELECT *
    FROM "Video"
    WHERE "trackId" = ?1
    LIMIT 1
  `);

  return (statement.get(trackId) as RawVideoRecord | undefined) ?? null;
}

export function upsertVideoRecordForTrack(input: {
  title: string;
  slug: string;
  videoPath: string;
  description: string;
  createdByUserId: number;
  trackId: number;
}) {
  const database = getTrackDatabase();
  const now = new Date().toISOString();
  const existing = findVideoRecordByTrackId(input.trackId);

  if (existing) {
    const statement = database.prepare(`
      UPDATE "Video"
      SET "title" = ?1,
          "slug" = ?2,
          "videoPath" = ?3,
          "description" = ?4,
          "createdByUserId" = ?5,
          "updatedAt" = ?6
      WHERE "id" = ?7
    `);

    statement.run(
      input.title,
      input.slug,
      input.videoPath,
      input.description,
      input.createdByUserId,
      now,
      existing.id
    );

    return findVideoRecordBySlug(input.slug) ?? findVideoRecordByTrackId(input.trackId);
  }

  const insert = database.prepare(`
    INSERT INTO "Video" (
      "title",
      "slug",
      "videoPath",
      "description",
      "createdByUserId",
      "trackId",
      "createdAt",
      "updatedAt"
    ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
  `);

  insert.run(
    input.title,
    input.slug,
    input.videoPath,
    input.description,
    input.createdByUserId,
    input.trackId,
    now,
    now
  );

  return findVideoRecordBySlug(input.slug);
}

export function deleteVideoRecordById(videoId: number) {
  const database = getTrackDatabase();
  const statement = database.prepare(`DELETE FROM "Video" WHERE "id" = ?1`);
  const result = statement.run(videoId);
  return Number(result.changes) > 0;
}
