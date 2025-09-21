'use client';
import { usePathname } from 'next/navigation';
import Header from '@/components/navbar';

export default function LayoutContent() {
  const pathname = usePathname();

  const hideHeaderRoutes = ["/userDashboard","/recruiterDashboard"];
  const shouldHideHeader = hideHeaderRoutes.some(route => pathname.startsWith(route));

  return (
    <>
      {!shouldHideHeader && (
        <header className="fixed top-0 left-0 right-0 z-50">
          <Header />
        </header>
      )}
      
    </>
  );
}
