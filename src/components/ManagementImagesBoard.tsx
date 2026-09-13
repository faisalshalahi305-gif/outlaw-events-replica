import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, ImagePlus, Images, Loader2, Save, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ensureBrowserSupabaseConfig } from "@/integrations/supabase/runtime-config";
import { loadSection, publishSection } from "@/lib/edits.functions";
import { EDIT_BUCKET } from "@/lib/edits-shared";
import { readAccessToken, readVisitorToken } from "@/lib/gate-identity";
import { DEFAULT_MANAGEMENT_IMAGES } from "@/routes/management";

type ManagedImage = { path: string; url: string };

const uid = () => crypto.randomUUID();

export function ManagementImagesBoard() {
  const load = useServerFn(loadSection);
  const publish = useServerFn(publishSection);
  const fileRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<ManagedImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    load({ data: { section: "management" } })
      .then((result) => {
        if (cancelled) return;
        const paths = result.entries.flatMap((entry) => entry.images);
        setImages(
          paths.length
            ? paths.map((path) => ({ path, url: result.imageUrls[path] ?? "" })).filter((item) => item.url)
            : DEFAULT_MANAGEMENT_IMAGES.map((url) => ({ path: url, url })),
        );
      })
      .catch(() => setMessage("تعذّر تحميل الصور"))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [load]);

  const uploadFiles = async (files: File[]) => {
    setUploading(true);
    setMessage("");
    try {
      await ensureBrowserSupabaseConfig();
      const uploaded: ManagedImage[] = [];
      for (const file of files) {
        const ext = (file.name.split(".").pop() || "img").toLowerCase();
        const path = `live/management/${uid()}.${ext}`;
        const { error } = await supabase.storage.from(EDIT_BUCKET).upload(path, file, {
          contentType: file.type || "application/octet-stream",
          upsert: false,
        });
        if (error) throw error;
        const { data } = await supabase.storage.from(EDIT_BUCKET).createSignedUrl(path, 60 * 60 * 6);
        if (!data?.signedUrl) throw new Error("signed_url_failed");
        uploaded.push({ path, url: data.signedUrl });
      }
      setImages((current) => [...current, ...uploaded]);
      setMessage("تمت إضافة الصور، اضغط حفظ لنشرها");
    } catch (error) {
      console.error(error);
      setMessage("تعذّر رفع الصورة");
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    setSaving(true);
    setMessage("جاري الحفظ…");
    try {
      await publish({
        data: {
          section: "management",
          entries: images.map((image) => ({ text: "", images: [image.path] })),
          accessToken: readAccessToken(),
          visitorToken: readVisitorToken(),
        },
      });
      setMessage("تم الحفظ وظهرت الصور للزوار ✓");
    } catch {
      setMessage("تعذّر حفظ الصور");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main dir="rtl" className="relative min-h-screen px-4 pb-36 pt-8">
      <div className="mx-auto w-full max-w-2xl">
        <header className="mb-10 text-center">
          <Link to="/control" className="surface-card mb-8 inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-bold text-muted-foreground">
            <ArrowRight className="h-3.5 w-3.5" />
            الرجوع للوحة التحكم
          </Link>
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-primary/50 bg-primary/10 text-primary">
            <Images className="h-7 w-7" />
          </span>
          <h1 className="mt-5 text-2xl font-extrabold text-primary">صور إدارة السيرفر</h1>
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
            if (files.length) void uploadFiles(files);
          }}
        />

        <Button className="mb-8 w-full" disabled={uploading || loading} onClick={() => fileRef.current?.click()}>
          {uploading ? <Loader2 className="animate-spin" /> : <ImagePlus />}
          إضافة صور
        </Button>

        {loading ? (
          <div className="flex justify-center py-12 text-muted-foreground"><Loader2 className="animate-spin" /></div>
        ) : images.length === 0 ? (
          <p className="surface-card rounded-2xl border border-dashed border-primary/40 px-4 py-12 text-center text-sm text-muted-foreground">لا توجد صور. أضف صورًا ثم اضغط حفظ.</p>
        ) : (
          <div className="space-y-5">
            {images.map((image, index) => (
              <article key={`${image.path}-${index}`} className="surface-card relative overflow-hidden rounded-2xl border border-primary/30 p-2">
                <img src={image.url} alt={`صورة الإدارة ${index + 1}`} className="max-h-[70vh] w-full rounded-xl object-contain" />
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  aria-label={`حذف الصورة ${index + 1}`}
                  className="absolute left-4 top-4"
                  onClick={() => setImages((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                >
                  <Trash2 />
                </Button>
              </article>
            ))}
          </div>
        )}
      </div>

      {!loading && (
        <div className="fixed inset-x-0 bottom-6 z-50 px-4">
          <div className="surface-card mx-auto flex max-w-2xl items-center justify-between gap-3 rounded-2xl border border-primary/50 bg-background/95 p-3 backdrop-blur">
            <span className="text-xs text-muted-foreground">{message || `${images.length} صورة`}</span>
            <Button disabled={saving || uploading} onClick={() => void save()}>
              {saving ? <Loader2 className="animate-spin" /> : <Save />}
              حفظ
            </Button>
          </div>
        </div>
      )}
    </main>
  );
}