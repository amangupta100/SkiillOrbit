"use client";

import Link from "next/link";
import { BsLinkedin, BsTwitter, BsInstagram, BsFacebook } from "react-icons/bs";
import Image from "next/image";
import logo from "@/assests/skillsorbit_logo.png"; // Replace with your actual logo path

export default function Footer() {
  return (
    <footer className="bg-gradient-to-r from-gray-900 via-gray-800 to-black text-white py-12 px-4">
      <div className="max-w-8xl sm:w-full mx-auto">
        <div className="flex flex-col sm:flex-row justify-between  gap-8">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/">
              <Image
                src={logo}
                alt="Skills Orbit Logo"
                width={190}
                height={50}
                className="hover:opacity-80 sm:w-40 transition-opacity"
              />
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col sm:flex-row gap-6 sm:gap-8 lg:justify-end flex-1">
            <div className="flex flex-col space-y-2 text-sm sm:text-base">
              <Link
                href="/about"
                className="hover:text-blue-400 transition-colors duration-200"
              >
                About Us
              </Link>
              <Link
                href="/contact"
                className="hover:text-blue-400 transition-colors duration-200"
              >
                Contact Us
              </Link>
            </div>
            <div className="flex flex-col space-y-2 text-sm sm:text-base">
              <Link
                href="/login/recruiter"
                className="hover:text-blue-400 transition-colors duration-200"
              >
                Recruiter Login
              </Link>
              <Link
                href="/login/job-seeker"
                className="hover:text-blue-400 transition-colors duration-200"
              >
                Job Seeker Login
              </Link>
            </div>
          </nav>

          {/* Social Media Icons */}
          <div className="flex space-x-4">
            <Link
              href="https://www.linkedin.com/company/skills-orbit/"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-200 hover:scale-110"
            >
              <BsLinkedin className="h-5 w-5 text-white" />
            </Link>
            <Link
              href="Take a look at SkillsOrbit (@SOrbit44262): https://x.com/SOrbit44262?t=L9S2V1_uAe_CPE89mO_1Nw&s=08"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-200 hover:scale-110"
            >
              <BsTwitter className="h-5 w-5 text-white" />
            </Link>
            <Link
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-200 hover:scale-110"
            >
              <BsInstagram className="h-5 w-5 text-white" />
            </Link>
            <Link
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-200 hover:scale-110"
            >
              <BsFacebook className="h-5 w-5 text-white" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
