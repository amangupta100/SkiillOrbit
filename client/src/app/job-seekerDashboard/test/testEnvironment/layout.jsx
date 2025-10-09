import { ThemeProvider } from "@/components/ui/theme-provider";

export default function testEnvLayout({ children }) {
  return (
    <div className="flex flex-col h-screen">
      
      <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
    </div>
  );
}