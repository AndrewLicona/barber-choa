import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Portal de Especialistas | Barber Choa & LM Nails",
  description: "Portal para barberos y manicuristas. Gestiona tu horario, disponibilidad y citas.",
  icons: {
    icon: "/logo_barberchoa.jpg",
    apple: "/logo_barberchoa.jpg",
  },
};

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
