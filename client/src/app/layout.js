import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import LayoutContent from "./RootLayoutContent";

export const metadata = {
  title: "SkillsOrbit",
  description:
    "SkillsOrbit is a job landing platform that evaluates applicants by testing their skills in a anti-cheat environment connects them with recruiters and recruiters can manage,schedule interviews using built-in most-secured interview environment.",
  icons: {
    icon: "/icon.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* ✅ Google Search Console Verification */}
        <meta
          name="google-site-verification"
          content="4LCagVikNSJBo7S2FDA_5rDCYTBL0WSx4EEW2SSVeg8"
        />

        {/* Google Fonts */}
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
