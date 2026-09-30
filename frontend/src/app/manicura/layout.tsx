import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "LM Nails & Spa Studio | Panel Manicura",
  description: "Panel de administración y landing de LM Nails & Spa Studio. Manicura y spa premium.",
  icons: {
    icon: [
      { url: "/favicon-manicura-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-manicura.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/favicon-manicura.png",
  },
};

export default function ManicuraLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
