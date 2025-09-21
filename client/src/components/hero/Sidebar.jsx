'use client';

import Link from 'next/link';
import useSidebarStore from '@/store/sidebarStore';
import { X } from 'lucide-react';

export default function Sidebar() {
  const { isSidebarOpen, closeSidebar } = useSidebarStore();

  return (
    <div className='fixed w-full h-full bg-black/50'>

<div
      className={`fixed top-0 right-0 h-full w-64 bg-white/50 backdrop-blur-md shadow-lg z-[999] transform transition-transform duration-300 ${
        isSidebarOpen ? '-translate-x-0' : 'translate-x-full'
      }`}
    >
        <button className='absolute top-2 right-2' onClick={closeSidebar}>
          <X className="h-6 w-6" />
        </button>

      <nav className="flex flex-col px-4 py-16 space-y-4">
        <Link href="/about" onClick={closeSidebar} className="text-gray-700 hover:text-black">
          About
        </Link>
        <Link href="/login/job-seeker" onClick={closeSidebar} className="text-gray-700 hover:text-black">
          Get Started
        </Link>
      </nav>
    </div>
    </div>
  );
}
