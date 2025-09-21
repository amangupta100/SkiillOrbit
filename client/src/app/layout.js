import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import LayoutContent from "./RootLayoutContent";

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
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Google Fonts link */}
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:ital,wght@0,100..900;1,100..900&family=Outfit:wght@100..900&family=Smooch+Sans:wght@100..900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <LayoutContent />
        <main className="pt-0">{children}</main>
        <Toaster position="top-center" richColors={true} />
      </body>
    </html>
  );
}
