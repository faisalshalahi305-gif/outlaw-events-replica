import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { ArrowRight, Check, Loader2, MessagesSquare, PencilLine, Trash2 } from "lucide-react";

import { decideEdit, listEdits, type EditRequest } from "@/lib/edits.functions";
import { adminDeleteThread, listThreads, type ThreadCard } from "@/lib/threads.functions";
import { readAccessToken, readVisitorToken } from "@/lib/gate-identity";

export const Route = createFileRoute("/control/threads/")({
  head: () => ({
    meta: [
      { title: "إدارة الثريدات | لوحة التحكم السرية" },
      {
        name: "description",
        content: "قسم مستقل لمراجعة طلبات الثريدات وإدارة الثريدات المنشورة.",
      },
      { property: "og:title", content: "إدارة الثريدات | لوحة التحكم السرية" },
      { property: "og:description", content: "مراجعة وإدارة الثريدات." },
      { property: "og:type", content: "website" },
      { name: "robots", content: "noindex" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ThreadsPanel,
});

const THREAD_LABEL: Record<string, string> = {
  thread_create: "ثريد جديد",
  thread_update: "تعديل ثريد",
  thread_delete: "حذف ثريد",
};

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("ar", { dateStyle: "medium", timeStyle: "short" }).format(
      new Date(iso),
    );
  } catch {
    return iso;
  }
}

function ThreadsPanel() {
  const load = useServerFn(listEdits);
  const decide = useServerFn(decideEdit);
  const loadThreads = useServerFn(listThreads);
  const dropThread = useServerFn(adminDeleteThread);

  const [requests, setRequests] = useState<EditRequest[]>([]);
  const [threads, setThreads] = useState<ThreadCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");

  const refresh = async () => {
    try {
      setError("");
      const res = await load({
        data: { accessToken: readAccessToken(), visitorToken: readVisitorToken() },
      });
      setRequests(res.requests.filter((r) => r.section.startsWith("thread_")));
      const threadRes = await loadThreads({ data: {} });
      setThreads(threadRes.threads);
    } catch {
      setError("تعذّر تحميل بيانات الثريدات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const act = async (id: string, action: "approve" | "reject") => {
    setBusy(id);
    setMessage("");
    try {
      await decide({
        data: { id, action, accessToken: readAccessToken(), visitorToken: readVisitorToken() },
      });
      setMessage(action === "approve" ? "تم القبول والنشر ✓" : "تم رفض الطلب");
      await refresh();
    } catch {
      setMessage("تعذّر تنفيذ العملية");
    }
    setBusy("");
    setTimeout(() => setMessage(""), 4000);
  };

  const removeThread = async (id: string, title: string) => {
    if (!window.confirm(`حذف الثريد «${title}» نهائيًا؟`)) return;
    setBusy(id);
    setMessage("");
    try {
      await dropThread({
        data: { id, accessToken: readAccessToken(), visitorToken: readVisitorToken() },
      });
      setMessage("تم حذف الثريد ✓");
      await refresh();
    } catch {
      setMessage("تعذّر حذف الثريد");
    }
    setBusy("");
    setTimeout(() => setMessage(""), 4000);
  };

  const pending = requests.filter((r) => r.status === "pending");

  return (
    <main dir="rtl" className="relative min-h-screen px-4 pb-24 pt-8">
      <div className="mx-auto w-full max-w-3xl">
        <header className="mb-8 text-center">
          <Link
            to="/control"
            className="surface-card mb-8 inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-bold text-muted-foreground transition-colors hover:border-primary/60 hover:text-primary"
          >
            <ArrowRight className="h-3.5 w-3.5" />
            الرجوع للوحة التحكم
          </Link>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-primary/50 bg-primary/10 text-primary">
            <MessagesSquare className="h-7 w-7" />
          </div>
          <h1 className="mt-5 bg-gradient-to-l from-primary via-primary-glow to-primary bg-clip-text text-3xl font-extrabold text-transparent">
            إدارة الثريدات
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {pending.length} طلب ثريد بانتظار المراجعة.
          </p>
          {message ? <p className="mt-4 text-sm font-bold text-primary">{message}</p> : null}
        </header>

        {loading ? (
          <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            جاري التحميل…
          </p>
        ) : error ? (
          <p className="text-center text-sm text-destructive">{error}</p>
        ) : (
          <>
            <section>
              <h2 className="mb-4 text-center text-xl font-extrabold text-primary">
                طلبات الثريدات
              </h2>
              {requests.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground">لا توجد طلبات ثريدات.</p>
              ) : (
                <div className="space-y-6">
                  {requests.map((row) => (
                    <article
                      key={row.id}
                      className="surface-card rounded-3xl border border-border p-5 text-right"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <span className="text-sm font-extrabold text-primary">
                          {THREAD_LABEL[row.section] ?? row.section}
                        </span>
                        <span className="rounded-full border border-border px-3 py-1 text-[11px] text-muted-foreground">
                          {row.status === "pending"
                            ? "قيد المراجعة"
                            : row.status === "approved"
                              ? "مقبول ومنشور"
                              : "مرفوض"}
                        </span>
                      </div>

                      <p className="mt-2 text-xs text-muted-foreground">
                        {row.visitorNumber ? `زائر-${row.visitorNumber} · ` : ""}
                        {formatDate(row.createdAt)}
                      </p>

                      {row.payload ? (
                        <div className="mt-3 rounded-2xl border border-primary/40 p-3">
                          <p className="text-sm font-extrabold text-foreground">
                            {row.payload.title}
                          </p>
                          <p className="mt-2 text-sm leading-6 text-muted-foreground">
                            {row.payload.excerpt}
                          </p>
                          {row.payload.coverPath && row.imageUrls[row.payload.coverPath] ? (
                            <img
                              src={row.imageUrls[row.payload.coverPath]}
                              alt={row.payload.title}
                              loading="lazy"
                              className="mt-3 h-auto max-h-72 w-full rounded-xl border border-border object-cover"
                            />
                          ) : null}
                        </div>
                      ) : null}

                      {row.note ? (
                        <p className="mt-3 rounded-2xl border border-border/60 p-3 text-sm leading-6 text-foreground">
                          {row.note}
                        </p>
                      ) : null}

                      {row.status === "pending" ? (
                        <div className="mt-5 flex flex-wrap gap-3">
                          <button
                            onClick={() => act(row.id, "approve")}
                            disabled={busy === row.id}
                            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-l from-primary to-primary-glow px-6 py-2.5 text-sm font-bold text-primary-foreground shadow-[var(--shadow-elegant)] transition-opacity hover:opacity-90 disabled:opacity-60"
                          >
                            {busy === row.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                            قبول ونشر
                          </button>
                          <button
                            onClick={() => act(row.id, "reject")}
                            disabled={busy === row.id}
                            className="inline-flex items-center gap-2 rounded-xl border border-input px-5 py-2.5 text-sm font-bold text-muted-foreground transition-colors hover:border-destructive/60 hover:text-destructive disabled:opacity-60"
                          >
                            <Trash2 className="h-4 w-4" />
                            رفض
                          </button>
                        </div>
                      ) : null}
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="mt-14">
              <h2 className="mb-2 text-center text-xl font-extrabold text-primary">
                الثريدات المنشورة
              </h2>
              <p className="mb-6 text-center text-sm text-muted-foreground">
                التعديل والحذف من هنا فقط، ويُطبّق فورًا على الموقع.
              </p>

              {threads.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground">لا توجد ثريدات منشورة.</p>
              ) : (
                <div className="space-y-4">
                  {threads.map((thread) => (
                    <article
                      key={thread.id}
                      className="surface-card rounded-3xl border border-border p-4 text-right"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <span className="text-sm font-extrabold text-foreground">
                          {thread.title}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {formatDate(thread.createdAt)}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {thread.excerpt}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-3">
                        <Link
                          to="/control/threads/$id"
                          params={{ id: thread.id }}
                          className="inline-flex items-center gap-2 rounded-xl border border-primary/50 px-5 py-2 text-xs font-bold text-primary transition-colors hover:bg-accent"
                        >
                          <PencilLine className="h-3.5 w-3.5" />
                          تعديل الثريد
                        </Link>
                        <button
                          onClick={() => removeThread(thread.id, thread.title)}
                          disabled={busy === thread.id}
                          className="inline-flex items-center gap-2 rounded-xl border border-input px-5 py-2 text-xs font-bold text-muted-foreground transition-colors hover:border-destructive/60 hover:text-destructive disabled:opacity-60"
                        >
                          {busy === thread.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                          حذف الثريد
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
