import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import LayoutContent from "./RootLayoutContent";
import { Outfit } from "next/font/google";
// import "@/components/lightswind.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata = {
  title: "SkillOrbit",
  description:
    "A skill-first job platform where candidates must prove their abilities through real-time tests before applying.",
  icons: {
    icon: "/icon.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} font-sans`}
      suppressHydrationWarning
    >
      <body className="font-body antialiased">
        <LayoutContent />

        <main className="pt-0">{children}</main>
        <Toaster position="top-center" richColors={true} />
      </body>
    </html>
  );
}
