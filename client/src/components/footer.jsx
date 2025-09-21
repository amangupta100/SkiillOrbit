import Image from 'next/image';
import Facebook from '../assests/facebook.svg';
import Twitter from '../assests/twitter.svg';
import Insta from '../assests/instagram.svg'
import logo from '../assests/logo.png';

export default function Footer() {
  return (
    <div className="relative w-full min-h-fit my-28 md:py-10">

      {/* Footer Content */}
      <footer className="relative z-10 px-4 pt-32 pb-10 text-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-10 md:items-center">
          
          {/* Logo + Copyright */}
          <div className="flex flex-col">
            <Image 
              src={logo} 
              alt="SkillOrbit Logo" 
              width={200} 
              height={180} 
              className="w-40 md:w-48"  priority
            />
            <p className="text-sm text-gray-300 mt-2">
              © {new Date().getFullYear()} SkillOrbit. All rights reserved.
            </p>
          </div>

          {/* Important Links */}
          <div className="flex flex-col gap-2 text-base">
            <h3 className="font-semibold text-white mb-2">Quick Links</h3>
            <a href="#features" className="hover:text-primary transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-primary transition-colors">How it Works</a>
            <a href="#testimonials" className="hover:text-primary transition-colors">Testimonials</a>
            <a href="#faqs" className="hover:text-primary transition-colors">FAQs</a>
          </div>

          {/* Social Icons */}
          <div className="flex flex-col gap-4">
            <h3 className="font-semibold text-white text-base">Connect With Us</h3>
            <div className="flex gap-4">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-transform">
                <Image alt='Facebook' src={Facebook} width={25} height={25} />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-transform">
                <Image alt='Twitter' src={Twitter} width={25} height={25} />
              </a>
               <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-transform">
                <Image alt='Insta' src={Insta} width={25} height={25} />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}