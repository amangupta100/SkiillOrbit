import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Settings, HelpCircle, UserCircle2 } from "lucide-react"

export default function AppFooter() {
  return (
    <footer className="fixed bottom-0 left-0 w-full h-16 bg-background/80 backdrop-blur-sm border-t z-50">
      <div className="container mx-auto h-full flex items-center justify-end px-4">
        <div className="flex items-center gap-2">
           <Button variant="ghost" size="icon" aria-label="Help">
            <HelpCircle className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Settings">
            <Settings className="h-5 w-5" />
          </Button>
          <Avatar className="h-8 w-8">
            <AvatarImage src="https://placehold.co/40x40.png" alt="User avatar" data-ai-hint="person face" />
            <AvatarFallback>
              <UserCircle2 />
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </footer>
  );
}
