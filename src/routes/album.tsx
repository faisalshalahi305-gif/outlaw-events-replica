import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, ImagePlus, Images, Loader2, X } from "lucide-react";

import { VisitorMenu } from "@/components/VisitorMenu";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ensureBrowserSupabaseConfig } from "@/integrations/supabase/runtime-config";
import { EDIT_BUCKET } from "@/lib/edits-shared";
import { useVisitorNumber } from "@/lib/use-visitor";
import {
  ALBUM_PREFIX,
  listAlbumPhotos,
  signAlbumPhotos,
  type AlbumPhoto,
} from "@/lib/album.functions";

export const Route = createFileRoute("/album")({
  head: () => ({
    meta: [
      { title: "الألبوم | OUTLAW" },
      {
        name: "description",
        content:
          "ألبوم صور سيرفر أوت لاو العامة: شاهد صور اللاعبين وأضف صورك الخاصة ليراها الجميع.",
      },
      { property: "og:title", content: "الألبوم | OUTLAW" },
      {
        property: "og:description",
        content: "صور عامة لسيرفر أوت لاو، أضف صورتك وشاهد صور بقية اللاعبين.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AlbumPage,
});

const uid = () => crypto.randomUUID();

function AlbumPage() {
  const visitorNumber = useVisitorNumber();
  const fetchPhotos = useServerFn(listAlbumPhotos);
  const signPhotos = useServerFn(signAlbumPhotos);
  const fileRef = useRef<HTMLInputElement>(null);

  const [photos, setPhotos] = useState<AlbumPhoto[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchPhotos({ data: { page: 0, withTotal: true } })
      .then((res) => {
        if (cancelled) return;
        setPhotos(res.photos);
        setHasMore(res.hasMore);
        setTotal(res.total);
      })
      .catch(() => {
        if (!cancelled) setMessage("تعذّر تحميل الصور، حاول تحديث الصفحة");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fetchPhotos]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const next = page + 1;
      const res = await fetchPhotos({ data: { page: next } });
      setPhotos((current) => [...current, ...res.photos]);
      setHasMore(res.hasMore);
      setPage(next);
    } catch {
      setMessage("تعذّر تحميل المزيد");
    } finally {
      setLoadingMore(false);
    }
  };

  const upload = async (files: File[]) => {
    setUploading(true);
    setMessage("جاري رفع الصور…");
    try {
      await ensureBrowserSupabaseConfig();
      const paths: string[] = [];
      for (const file of files.slice(0, 20)) {
        const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
        const path = `${ALBUM_PREFIX}/${Date.now()}-${uid()}.${ext}`;
        const { error } = await supabase.storage.from(EDIT_BUCKET).upload(path, file, {
          contentType: file.type || "application/octet-stream",
          upsert: false,
        });
        if (error) throw error;
        paths.push(path);
      }
      const res = await signPhotos({ data: { paths } });
      setPhotos((current) => [...res.photos, ...current]);
      setTotal((current) => (current === null ? current : current + res.photos.length));
      setMessage(`تمت إضافة ${res.photos.length} صورة ✓`);
    } catch (error) {
      console.error(error);
      setMessage("تعذّر رفع الصور، حاول مرة أخرى");
    } finally {
      setUploading(false);
    }
  };

  return (
    <main dir="rtl" className="relative min-h-screen px-4 pb-24 pt-8">
      <div className="fixed right-4 top-4 z-40">
        <VisitorMenu visitorNumber={visitorNumber} />
      </div>

      <div className="mx-auto w-full max-w-4xl">
        <header className="mb-8 text-center">
          <Link
            to="/"
            className="surface-card mb-8 inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-bold text-muted-foreground transition-colors hover:border-primary/60 hover:text-primary"
          >
            <ArrowRight className="h-3.5 w-3.5" />
            الرجوع للرئيسية
          </Link>
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-primary/50 bg-primary/10 text-primary">
            <Images className="h-7 w-7" />
          </span>
          <h1 className="mt-5 bg-gradient-to-l from-primary via-primary-glow to-primary bg-clip-text text-3xl font-extrabold text-transparent">
            الألبوم
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            صور عامة لسيرفر أوت لاو — أضف صورك وشاهد صور بقية اللاعبين
          </p>
          {total !== null && (
            <p className="mt-2 text-xs font-bold text-primary">{total} صورة في الألبوم</p>
          )}
        </header>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(event) => {
            const files = Array.from(event.target.files ?? []);
            event.target.value = "";
            if (files.length) void upload(files);
          }}
        />

        <div className="mb-6 flex flex-col items-center gap-3">
          <Button
            type="button"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
            className="w-full max-w-sm"
          >
            {uploading ? <Loader2 className="animate-spin" /> : <ImagePlus />}
            إضافة صور
          </Button>
          {message && <p className="text-xs text-muted-foreground">{message}</p>}
        </div>

        {loading ? (
          <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            جاري التحميل…
          </p>
        ) : photos.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">
            لا توجد صور بعد، كن أول من يضيف صورة.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {photos.map((photo) => (
              <button
                key={photo.path}
                type="button"
                onClick={() => setPreview(photo.url)}
                className="surface-card group overflow-hidden rounded-2xl border border-primary/25 transition-all hover:border-primary hover:shadow-[var(--shadow-elegant)]"
              >
                <img
                  src={photo.url}
                  alt="صورة من ألبوم أوت لاو"
                  loading="lazy"
                  className="aspect-square w-full object-cover transition-transform group-hover:scale-105"
                />
              </button>
            ))}
          </div>
        )}

        {hasMore && !loading && (
          <div className="mt-8 flex justify-center">
            <Button variant="outline" disabled={loadingMore} onClick={() => void loadMore()}>
              {loadingMore ? <Loader2 className="animate-spin" /> : null}
              عرض المزيد
            </Button>
          </div>
        )}
      </div>

      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 p-4 backdrop-blur"
          onClick={() => setPreview(null)}
        >
          <button
            type="button"
            aria-label="إغلاق"
            className="absolute left-4 top-4 rounded-full border border-primary/40 p-2 text-primary"
            onClick={() => setPreview(null)}
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={preview}
            alt="عرض الصورة"
            className="max-h-[85vh] max-w-full rounded-2xl object-contain"
          />
        </div>
      )}
    </main>
  );
}
