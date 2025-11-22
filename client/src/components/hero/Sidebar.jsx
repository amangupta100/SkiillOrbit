"use client";

import Link from "next/link";
import useSidebarStore from "@/store/sidebarStore";
import { X } from "lucide-react";
import { BsInstagram, BsLinkedin, BsTwitterX } from "react-icons/bs";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { FaFacebook } from "react-icons/fa";

export default function Sidebar() {
  const { isSidebarOpen, closeSidebar } = useSidebarStore();
  const [isClosing, setIsClosing] = useState(false);

  // When global state closes while animation is not done
  useEffect(() => {
    if (isSidebarOpen) setIsClosing(false);
  }, [isSidebarOpen]);

  // Custom close handler
  const handleClose = () => {
    setIsClosing(true);

    closeSidebar();
  };

  return (
    <AnimatePresence>
      {isSidebarOpen && (
        <>
          {/* BACKDROP */}
          <motion.div
            className="fixed inset-0 z-[998] bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={handleClose}
          />

          {/* SIDEBAR PANEL */}
          <motion.div
            className="fixed top-0 right-0 h-full w-full bg-white/60 backdrop-blur-md shadow-xl z-[999] flex flex-col"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{
              type: "spring",
              stiffness: 70,
              damping: 18,
              duration: 0.35,
            }}
            onClick={(e) => e.stopPropagation()} // ⬅️ STOP BUBBLING
          >
            {/* Close Button */}
            <button className="absolute top-3 right-3" onClick={handleClose}>
              <X className="h-6 w-6" />
            </button>

            {/* NAV */}
            <nav className="flex flex-col items-center justify-center flex-grow text-lg space-y-4">
              <Link
                href="/about"
                onClick={handleClose}
                className="font-semibold uppercase tracking-wide"
              >
                About Us
              </Link>

              <Link
                href="/contact_us"
                onClick={handleClose}
                className="font-semibold uppercase tracking-wide"
              >
                Contact Us
              </Link>

              <Link
                href="/login/job-seeker"
                onClick={handleClose}
                className="font-semibold uppercase tracking-wide"
              >
                Get Started
              </Link>
            </nav>

            {/* FOOTER */}
            <footer className="flex items-center justify-center gap-8 py-2 text-center text-2xl border-t-2 border-zinc-400 bg-white/10">
              <a
                href="https://www.linkedin.com/company/skills-orbit/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-blue-600 transition"
              >
                <BsLinkedin />
              </a>
              <BsTwitterX />
              <BsInstagram />
              <FaFacebook />
            </footer>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
