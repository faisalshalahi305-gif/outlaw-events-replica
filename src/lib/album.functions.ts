import "./env.server";
import { createServerFn } from "@tanstack/react-start";

import { EDIT_BUCKET } from "./edits-shared";

export const ALBUM_PREFIX = "album";
export const ALBUM_PAGE_SIZE = 24;

export type AlbumPhoto = { path: string; url: string; createdAt: string };

async function admin() {
  const { createGateDatabaseClient } = await import("./admin-db.server");
  return createGateDatabaseClient() as any;
}

/** Public: one page of album photos, newest first, plus the total count. */
export const listAlbumPhotos = createServerFn({ method: "POST" })
  .inputValidator((data?: { page?: number; withTotal?: boolean }) => ({
    page: Math.max(0, Math.min(500, Math.floor(Number(data?.page ?? 0)) || 0)),
    withTotal: Boolean(data?.withTotal),
  }))
  .handler(async ({ data }) => {
    const db = await admin();
    const storage = db.storage.from(EDIT_BUCKET);

    const { data: rows, error } = await storage.list(ALBUM_PREFIX, {
      limit: ALBUM_PAGE_SIZE,
      offset: data.page * ALBUM_PAGE_SIZE,
      sortBy: { column: "created_at", order: "desc" },
    });
    if (error) throw new Error("load_failed");

    const files = ((rows ?? []) as any[]).filter((r) => r?.id);
    const photos: AlbumPhoto[] = [];
    await Promise.all(
      files.map(async (file, index) => {
        const path = `${ALBUM_PREFIX}/${file.name}`;
        const { data: signed } = await storage.createSignedUrl(path, 60 * 60 * 6);
        if (signed?.signedUrl)
          photos[index] = {
            path,
            url: signed.signedUrl,
            createdAt: String(file.created_at ?? ""),
          };
      }),
    );

    let total: number | null = null;
    if (data.withTotal) {
      total = 0;
      for (let offset = 0; offset < 20000; offset += 1000) {
        const { data: chunk } = await storage.list(ALBUM_PREFIX, { limit: 1000, offset });
        const count = ((chunk ?? []) as any[]).filter((r) => r?.id).length;
        total += count;
        if (count < 1000) break;
      }
    }

    return {
      photos: photos.filter(Boolean),
      hasMore: files.length === ALBUM_PAGE_SIZE,
      total,
    };
  });

/** Public: turn freshly uploaded storage paths into signed preview urls. */
export const signAlbumPhotos = createServerFn({ method: "POST" })
  .inputValidator((data: { paths: string[] }) => ({
    paths: (Array.isArray(data?.paths) ? data.paths : [])
      .map((p) => String(p ?? "").trim())
      .filter((p) => p.startsWith(`${ALBUM_PREFIX}/`) && p.length < 300)
      .slice(0, 20),
  }))
  .handler(async ({ data }) => {
    const db = await admin();
    const storage = db.storage.from(EDIT_BUCKET);
    const photos: AlbumPhoto[] = [];
    await Promise.all(
      data.paths.map(async (path, index) => {
        const { data: signed } = await storage.createSignedUrl(path, 60 * 60 * 6);
        if (signed?.signedUrl)
          photos[index] = { path, url: signed.signedUrl, createdAt: new Date().toISOString() };
      }),
    );
    return { photos: photos.filter(Boolean) };
  });

/** Public: remove one photo from the album. */
export const deleteAlbumPhoto = createServerFn({ method: "POST" })
  .inputValidator((data: { path: string }) => {
    const path = String(data?.path ?? "").trim();
    if (!path.startsWith(`${ALBUM_PREFIX}/`) || path.length > 300) throw new Error("invalid_path");
    return { path };
  })
  .handler(async ({ data }) => {
    const db = await admin();
    const { error } = await db.storage.from(EDIT_BUCKET).remove([data.path]);
    if (error) throw new Error("delete_failed");
    return { ok: true as const };
  });
