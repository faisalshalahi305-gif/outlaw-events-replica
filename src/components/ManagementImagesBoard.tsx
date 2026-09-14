import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, ImagePlus, Images, Loader2, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ensureBrowserSupabaseConfig } from "@/integrations/supabase/runtime-config";
import { loadSection, publishSection } from "@/lib/edits.functions";
import { EDIT_BUCKET } from "@/lib/edits-shared";
import { readAccessToken, readVisitorToken } from "@/lib/gate-identity";
import { DEFAULT_MANAGEMENT_IMAGES, MANAGEMENT_MEMBERS } from "@/lib/management-images";

type ManagedImage = { path: string; url: string };

const uid = () => crypto.randomUUID();

export function ManagementImagesBoard() {
  const load = useServerFn(loadSection);
  const publish = useServerFn(publishSection);
  const fileRef = useRef<HTMLInputElement>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
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
        setImages(MANAGEMENT_MEMBERS.map((_, index) => {
          const path = paths[index];
          const fallback = DEFAULT_MANAGEMENT_IMAGES[index] ?? "";
          return path && result.imageUrls[path]
            ? { path, url: result.imageUrls[path] }
            : { path: fallback, url: fallback };
        }));
      })
      .catch(() => setMessage("تعذّر تحميل الصور"))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [load]);

  const replaceImage = async (file: File, index: number) => {
    setUploading(true);
    setMessage("");
    try {
      await ensureBrowserSupabaseConfig();
      const ext = (file.name.split(".").pop() || "img").toLowerCase();
      const path = `live/management/${uid()}.${ext}`;
      const { error } = await supabase.storage.from(EDIT_BUCKET).upload(path, file, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });
      if (error) throw error;
      const { data } = await supabase.storage.from(EDIT_BUCKET).createSignedUrl(path, 60 * 60 * 6);
      if (!data?.signedUrl) throw new Error("signed_url_failed");
      setImages((current) => current.map((image, itemIndex) => itemIndex === index ? { path, url: data.signedUrl } : image));
      setMessage(`تم استبدال صورة ${MANAGEMENT_MEMBERS[index]?.name ?? "الشخص"}، اضغط حفظ لنشرها`);
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
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file && selectedIndex !== null) void replaceImage(file, selectedIndex);
          }}
        />

        {loading ? (
          <div className="flex justify-center py-12 text-muted-foreground"><Loader2 className="animate-spin" /></div>
        ) : (
          <div className="space-y-5">
            {MANAGEMENT_MEMBERS.map((member, index) => (
              <article key={member.name} className="surface-card relative overflow-hidden rounded-2xl border border-primary/30 p-2">
                <img src={images[index]?.url} alt={`صورة ${member.name}`} className="max-h-[70vh] w-full rounded-xl object-contain" />
                <div className="flex items-center justify-between gap-4 px-3 py-4">
                  <div dir="ltr" className="text-left">
                    <p className="text-lg font-extrabold text-foreground">{member.name}</p>
                    <p className="text-xs font-bold text-primary">{member.role}</p>
                  </div>
                  <Button
                    type="button"
                    disabled={uploading}
                    onClick={() => {
                      setSelectedIndex(index);
                      fileRef.current?.click();
                    }}
                  >
                    {uploading && selectedIndex === index ? <Loader2 className="animate-spin" /> : <ImagePlus />}
                    استبدال الصورة
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {!loading && (
        <div className="fixed inset-x-0 bottom-6 z-50 px-4">
          <div className="surface-card mx-auto flex max-w-2xl items-center justify-between gap-3 rounded-2xl border border-primary/50 bg-background/95 p-3 backdrop-blur">
            <span className="text-xs text-muted-foreground">{message || "7 خانات ثابتة"}</span>
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