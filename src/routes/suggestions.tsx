import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import { ArrowRight, ImagePlus, Lightbulb, Loader2, Send, X } from "lucide-react";

import { submitSuggestion } from "@/lib/suggestions.functions";
import { useVisitorNumber } from "@/lib/use-visitor";

export const Route = createFileRoute("/suggestions")({
  head: () => ({
    meta: [
      { title: "الاقتراحات | أحداث أوت لاو" },
      {
        name: "description",
        content: "شاركنا اقتراحك لتطوير سيرفر أوت لاو مع إمكانية إرفاق الصور.",
      },
      { property: "og:title", content: "الاقتراحات | أحداث أوت لاو" },
      {
        property: "og:description",
        content: "شاركنا اقتراحك لتطوير سيرفر أوت لاو مع إمكانية إرفاق الصور.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SuggestionsPage,
});

const MAX_IMAGES = 4;
const MAX_BYTES = 4 * 1024 * 1024;

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("read_failed"));
    reader.readAsDataURL(file);
  });
}

function SuggestionsPage() {
  const send = useServerFn(submitSuggestion);
  const visitorNumber = useVisitorNumber();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const pick = async (files: FileList | null) => {
    if (!files?.length) return;
    setError("");
    const room = MAX_IMAGES - images.length;
    const picked = Array.from(files).slice(0, Math.max(room, 0));
    const next: string[] = [];
    for (const file of picked) {
      if (!file.type.startsWith("image/")) continue;
      if (file.size > MAX_BYTES) {
        setError("حجم الصورة يجب أن يكون أقل من 4 ميجابايت");
        continue;
      }
      next.push(await readAsDataUrl(file));
    }
    setImages((prev) => [...prev, ...next].slice(0, MAX_IMAGES));
    if (fileRef.current) fileRef.current.value = "";
  };

  const submit = async () => {
    setError("");
    setMsg("");
    if (!name.trim() || !title.trim() || !body.trim()) {
      setError("الرجاء تعبئة الاسم والعنوان والنص");
      return;
    }
    setSending(true);
    try {
      await send({
        data: {
          name: name.trim(),
          title: title.trim(),
          body: body.trim(),
          images,
          visitorNumber: visitorNumber ?? null,
        },
      });
      setMsg("تم إرسال اقتراحك، سيتم مراجعته وقبوله أو رفضه قريباً");
      setName("");
      setTitle("");
      setBody("");
      setImages([]);
    } catch {
      setError("تعذر إرسال الاقتراح، حاول مرة أخرى");
    } finally {
      setSending(false);
    }
  };

  return (
    <main dir="rtl" className="relative min-h-screen overflow-hidden px-5 py-12">
      <span className="pointer-events-none absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />

      <div className="relative z-10 mx-auto w-full max-w-md pb-28">
        <Link
          to="/"
          className="surface-card mb-8 inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-bold text-muted-foreground transition-colors hover:border-primary/60 hover:text-primary"
        >
          <ArrowRight className="h-3.5 w-3.5" />
          الرجوع للرئيسية
        </Link>

        <header className="text-center">
          <div className="glow-ring mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-primary/60">
            <Lightbulb className="h-7 w-7 text-primary" />
          </div>
          <h1 className="mt-6 text-2xl font-extrabold text-primary">الاقتراحات</h1>
          <div className="ornament-line mx-auto mt-4 w-48" />
          <p className="mt-3 text-xs font-bold text-muted-foreground">
            شاركنا اقتراحك مع إمكانية إرفاق حتى {MAX_IMAGES} صور
          </p>
        </header>

        <div className="surface-card mt-8 space-y-4 rounded-2xl border border-primary/40 p-5 text-right">
          <label className="block space-y-1.5">
            <span className="text-xs font-bold text-foreground">الاسم</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
              placeholder="اسم صاحب الاقتراح"
              className="w-full rounded-xl border border-border bg-background/60 px-4 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-primary"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-bold text-foreground">العنوان</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              placeholder="عنوان الاقتراح"
              className="w-full rounded-xl border border-border bg-background/60 px-4 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-primary"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-bold text-foreground">النص</span>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={4000}
              rows={5}
              placeholder="تفاصيل الاقتراح"
              className="w-full resize-y rounded-xl border border-border bg-background/60 px-4 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-primary"
            />
          </label>

          <div className="space-y-2">
            <span className="text-xs font-bold text-foreground">
              الصور ({images.length}/{MAX_IMAGES})
            </span>
            <div className="flex flex-wrap gap-2">
              {images.map((src, i) => (
                <div
                  key={i}
                  className="relative h-20 w-20 overflow-hidden rounded-xl border border-primary/40"
                >
                  <img src={src} alt={`صورة ${i + 1}`} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    aria-label="حذف الصورة"
                    onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))}
                    className="absolute left-1 top-1 rounded-full bg-background/80 p-1 text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}

              {images.length < MAX_IMAGES ? (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-primary/50 text-[10px] font-bold text-primary"
                >
                  <ImagePlus className="h-4 w-4" />
                  إضافة صورة
                </button>
              ) : null}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => pick(e.target.files)}
              className="hidden"
            />
          </div>

          {error ? <p className="text-xs font-bold text-destructive">{error}</p> : null}
          {msg ? <p className="text-xs font-bold text-primary">{msg}</p> : null}

          <button
            type="button"
            onClick={submit}
            disabled={sending}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-primary/60 bg-primary/10 px-5 py-3 text-sm font-extrabold text-primary transition-all hover:border-primary disabled:opacity-60"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            إرسال
          </button>
        </div>
      </div>
    </main>
  );
}
