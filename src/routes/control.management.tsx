import { createFileRoute } from "@tanstack/react-router";

import { ManagementImagesBoard } from "@/components/ManagementImagesBoard";

export const Route = createFileRoute("/control/management")({
  head: () => ({
    meta: [
      { title: "صور إدارة السيرفر | لوحة التحكم" },
      { name: "description", content: "إضافة وحذف وترتيب صور إدارة سيرفر أوت لاو." },
      { property: "og:title", content: "صور إدارة السيرفر | لوحة التحكم" },
      { property: "og:description", content: "إدارة صور فريق أوت لاو." },
      { property: "og:type", content: "website" },
      { name: "robots", content: "noindex" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ManagementImagesBoard,
});