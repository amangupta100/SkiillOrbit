// app/offline/page.jsx
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/store/authStore';
import Image from 'next/image';
import banner from '@/assests/404-error-page-not-found-with-people-connecting-a-plug-animate.svg'

export default function OfflinePage() {
  const { checkAuth} = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(() => {
      if (navigator.onLine) {
        checkAuth().then(() => {
          router.back(); // Go back to previous page
        });
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [checkAuth, router]);

  return (
    <div className="flex text-black flex-col items-center justify-center min-h-screen">
    <Image src={banner} width={440} height={440} alt='Banner'/>
      <h1 className="text-2xl font-bold mb-2">You're offline</h1>
      <p className="mb-6">Please check your network and internet service</p>
      
    </div>
  );
}