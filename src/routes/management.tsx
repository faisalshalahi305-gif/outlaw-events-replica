import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Crown, Loader2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";

import { VisitorMenu } from "@/components/VisitorMenu";
import { useVisitorNumber } from "@/lib/use-visitor";
import { loadSection } from "@/lib/edits.functions";
import { DEFAULT_MANAGEMENT_IMAGES, MANAGEMENT_MEMBERS } from "@/lib/management-images";

export const Route = createFileRoute("/management")({
  head: () => ({
    meta: [
      { title: "إدارة سيرفر أوت لاو | OUTLAW" },
      {
        name: "description",
        content: "تعرّف على إدارة سيرفر أوت لاو والمؤسسين ومديري التطوير.",
      },
      { property: "og:title", content: "إدارة سيرفر أوت لاو | OUTLAW" },
      {
        property: "og:description",
        content: "صفحة أعضاء إدارة سيرفر أوت لاو بالترتيب الرسمي.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ManagementPage,
});

function ManagementPage() {
  const visitorNumber = useVisitorNumber();
  const fetchImages = useServerFn(loadSection);
  const [images, setImages] = useState<string[]>([...DEFAULT_MANAGEMENT_IMAGES]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchImages({ data: { section: "management" } })
      .then((result) => {
        if (cancelled || result.entries.length === 0) return;
        const paths = result.entries.flatMap((entry) => entry.images);
        setImages(
          MANAGEMENT_MEMBERS.map(
            (_, index) => result.imageUrls[paths[index] ?? ""] ?? DEFAULT_MANAGEMENT_IMAGES[index] ?? "",
          ),
        );
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fetchImages]);

  return (
    <main dir="rtl" className="relative min-h-screen overflow-hidden px-4 pb-24 pt-8">
      <div className="fixed right-4 top-4 z-40">
        <VisitorMenu visitorNumber={visitorNumber} />
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-primary/5 blur-3xl" />

      <div className="relative mx-auto w-full max-w-3xl">
        <header className="mb-14 text-center">
          <Link
            to="/"
            className="surface-card mb-10 inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-bold text-muted-foreground transition-colors hover:border-primary/60 hover:text-primary"
          >
            <ArrowRight className="h-3.5 w-3.5" />
            الرجوع للرئيسية
          </Link>

          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-primary/50 bg-primary/10 text-primary shadow-[var(--shadow-elegant)]">
            <Crown className="h-7 w-7" />
          </div>
          <p className="wordmark mb-5 text-lg">OUTLAW</p>
          <h1 className="text-3xl font-extrabold text-foreground sm:text-4xl">
            إدارة سيرفر أوت لاو
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-muted-foreground">
            الفريق المؤسس والإداري خلف عالم أوت لاو
          </p>
          <div className="ornament-diamond mt-7 text-[10px] text-primary/70">
            THE COMMAND
          </div>
        </header>

        <section aria-label="إدارة سيرفر أوت لاو">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              جاري تحميل الصور…
            </div>
          ) : (
            <div className="space-y-8 sm:space-y-12">
              {MANAGEMENT_MEMBERS.map((member, index) => (
                <figure
                  key={member.name}
                  className="group relative overflow-hidden rounded-2xl border border-primary/30 bg-card/80 p-2 shadow-[var(--shadow-soft)]"
                >
                  <img
                    src={images[index]}
                    alt={`${member.name} — ${member.role}`}
                    loading={index === 0 ? "eager" : "lazy"}
                    className="mx-auto block h-auto max-h-[80vh] w-full rounded-xl object-contain transition-transform duration-700 group-hover:scale-[1.015]"
                  />
                  <figcaption className="relative mx-2 -mt-1 flex min-h-24 items-center justify-between gap-4 overflow-hidden border-x border-b border-primary/30 bg-background/90 px-5 py-5 shadow-[var(--shadow-soft)] sm:px-7">
                    <span className="absolute inset-y-5 right-0 w-1 bg-primary" aria-hidden="true" />
                    <span className="text-right">
                      <strong className="block text-xl font-extrabold text-foreground sm:text-2xl" dir="ltr">
                        {member.name}
                      </strong>
                      <span className="mt-1 block text-[11px] font-bold text-muted-foreground" dir="ltr">
                        OUTLAW MANAGEMENT
                      </span>
                    </span>
                    <span className="shrink-0 border border-primary/40 bg-primary/10 px-3 py-2 text-xs font-extrabold text-primary sm:text-sm" dir="ltr">
                      {member.role}
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
          )}
        </section>

        <footer className="mt-16 text-center">
          <p className="wordmark text-sm">OUTLAW</p>
        </footer>
      </div>
    </main>
  );
}