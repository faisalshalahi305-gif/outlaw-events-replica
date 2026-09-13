import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Crown, ShieldCheck } from "lucide-react";

import { VisitorMenu } from "@/components/VisitorMenu";
import twoAAsset from "@/assets/management/2a.jpeg.asset.json";
import fadAsset from "@/assets/management/fad.jpeg.asset.json";
import soveAsset from "@/assets/management/sove.jpeg.asset.json";
import dappiAsset from "@/assets/management/dappi.jpeg.asset.json";
import fwazAsset from "@/assets/management/fwaz.jpeg.asset.json";
import fahadAsset from "@/assets/management/fahad.jpeg.asset.json";
import naroAsset from "@/assets/management/naro.jpeg.asset.json";
import { useVisitorNumber } from "@/lib/use-visitor";

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

const MEMBERS = [
  { name: "2a", role: "OWNER", image: twoAAsset.url },
  { name: "Fad", role: "OWNER", image: fadAsset.url },
  { name: "SOVE", role: "FOUNDER", image: soveAsset.url },
  { name: "Dappi", role: "FOUNDER", image: dappiAsset.url },
  { name: "Fwaz", role: "FOUNDER", image: fwazAsset.url },
  { name: "FaHaD", role: "DEV DIRECTOR", image: fahadAsset.url },
  { name: "Naro", role: "DEV DIRECTOR", image: naroAsset.url },
] as const;

function ManagementPage() {
  const visitorNumber = useVisitorNumber();

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

        <section aria-label="أعضاء إدارة سيرفر أوت لاو" className="relative">
          <div className="absolute bottom-16 right-5 top-16 w-px bg-gradient-to-b from-transparent via-primary/50 to-transparent sm:right-1/2" />

          <div className="space-y-8 sm:space-y-12">
            {MEMBERS.map((member, index) => (
              <article
                key={member.name}
                className="group relative grid min-h-64 overflow-hidden rounded-2xl border border-primary/25 bg-card/80 shadow-[var(--shadow-soft)] backdrop-blur-sm sm:grid-cols-[minmax(0,1.1fr)_minmax(190px,0.9fr)]"
              >
                <div className="relative min-h-72 overflow-hidden sm:min-h-80">
                  <img
                    src={member.image}
                    alt={`${member.name} — ${member.role}`}
                    loading={index === 0 ? "eager" : "lazy"}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.025]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card/70 via-transparent to-transparent sm:bg-gradient-to-l" />
                </div>

                <div className="relative flex min-h-40 flex-col items-center justify-center border-t border-primary/20 px-6 py-8 text-center sm:border-r sm:border-t-0">
                  <span className="mb-5 flex h-10 w-10 items-center justify-center rounded-full border border-primary/40 bg-primary/10 text-primary">
                    <ShieldCheck className="h-5 w-5" />
                  </span>
                  <span className="mb-2 text-[11px] font-bold text-muted-foreground">
                    {String(index + 1).padStart(2, "0")} / {String(MEMBERS.length).padStart(2, "0")}
                  </span>
                  <h2 className="text-3xl font-extrabold text-foreground">{member.name}</h2>
                  <p className="mt-3 text-xs font-extrabold text-primary">{member.role}</p>
                  <span className="mt-6 h-px w-16 bg-primary/50" />
                </div>

                <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full border border-primary/50 bg-background sm:right-1/2 sm:top-1/2 sm:-translate-y-1/2 sm:translate-x-1/2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                </span>
              </article>
            ))}
          </div>
        </section>

        <footer className="mt-16 text-center">
          <p className="wordmark text-sm">OUTLAW</p>
        </footer>
      </div>
    </main>
  );
}