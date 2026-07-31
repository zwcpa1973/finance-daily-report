import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "财经培训日报｜免费财税法培训情报",
  description: "每日聚合全国注协、税协及财政局公开培训信息。",
  openGraph: { title: "财经培训日报", description: "重要的财经培训，不错过。", images: [{ url: "/og.png", width: 1200, height: 630 }] },
  twitter: { card: "summary_large_image", images: ["/og.png"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
