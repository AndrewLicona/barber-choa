import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Barber Choa Studio | Panel Barbería",
  description: "Panel de administración y landing de Barber Choa Studio. Barbería urbana premium.",
  icons: {
    icon: [
      { url: "/favicon-barberia-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-barberia.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/favicon-barberia.png",
  },
};

export default function BarberiaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
