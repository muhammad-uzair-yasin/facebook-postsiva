import Link from "next/link";
import { 
  Mail, 
  Phone, 
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Music,
} from "lucide-react";

/**
 * Footer Component
 * Mobile-first, ultra-responsive design using utility classes.
 * All icons and elements scale or re-layout smoothly across devices.
 */
export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-100 pt-12 pb-6 sm:pt-16 sm:pb-10">
      <div className="container mx-auto max-w-7xl px-4 sm:px-8">
        <div className="grid grid-cols-1 gap-y-12 gap-x-8 sm:grid-cols-2 lg:grid-cols-4 mb-12">
          {/* Branding & Socials */}
          <div className="flex flex-col col-span-1 sm:col-span-2">
            <Link
              href="/"
              className="flex items-center gap-2 mb-5 sm:mb-6"
            >
              <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary/30">
                P
              </div>
              <span className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
                Post<span className="text-primary">siva</span>
              </span>
            </Link>
            <p className="text-slate-500 mb-6 sm:mb-8 leading-relaxed text-sm font-medium max-w-lg">
              Automate and amplify your digital voice with the world&apos;s most advanced Facebook automation platform. Built for growth-minded founders and high-performing teams.
            </p>
            <div className="flex flex-row flex-wrap gap-2 sm:gap-3">
              {[
                { icon: Facebook, href: "https://web.facebook.com/profile.php?id=61587174115716" },
                { icon: Twitter, href: "https://x.com/Postsiva" },
                { icon: Instagram, href: "https://www.instagram.com/postsiva/" },
                { icon: Linkedin, href: "https://www.linkedin.com/company/postiva/" },
                { icon: Music, href: "https://www.tiktok.com/@postsiva?_r=1&_t=ZS-93LYwEssgzt" },
              ].map((social, i) => (
                <Link
                  key={i}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all duration-300 border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-1"
                  aria-label="Social Link"
                >
                  <social.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                </Link>
              ))}
            </div>
          </div>
          {/* Product Links */}
          <div className="flex flex-col">
            <h4 className="font-black text-slate-900 mb-5 sm:mb-7 uppercase text-[10px] tracking-[0.20em]">
              Product
            </h4>
            <ul className="space-y-3 sm:space-y-4">
              <li>
                <Link href="/#features" className="block w-fit text-slate-500 hover:text-primary transition-colors text-sm font-bold">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/#how-it-works" className="block w-fit text-slate-500 hover:text-primary transition-colors text-sm font-bold">
                  How it Works
                </Link>
              </li>
              <li>
                <Link href="/about" className="block w-fit text-slate-500 hover:text-primary transition-colors text-sm font-bold">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/#reviews" className="block w-fit text-slate-500 hover:text-primary transition-colors text-sm font-bold">
                  Testimonials
                </Link>
              </li>
            </ul>
          </div>
          {/* Contact */}
          <div className="flex flex-col">
            <h4 className="font-black text-slate-900 mb-5 sm:mb-7 uppercase text-[10px] tracking-[0.20em]">
              Contact Us
            </h4>
            <ul className="space-y-4 sm:space-y-5">
              <li className="flex items-start gap-2.5 sm:gap-3.5 text-sm font-bold text-slate-500">
                <Mail className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <a href="mailto:support@postsiva.com" className="hover:text-primary transition-colors break-all">
                  support@postsiva.com
                </a>
              </li>
              <li className="flex items-start gap-2.5 sm:gap-3.5 text-sm font-bold text-slate-500">
                <Phone className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span className="whitespace-nowrap">
                  +92 323 6891550
                </span>
              </li>
              <li className="flex items-start gap-2.5 sm:gap-3.5 text-sm font-bold text-slate-500">
                <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span className="leading-tight">
                  Islamabad, Pakistan
                </span>
              </li>
            </ul>
          </div>
          {/* Spacer for 4-column on large or summary information (optional) */}
          <div className="hidden lg:block" />
        </div>
        <div className="pt-8 sm:pt-10 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 sm:gap-6 text-slate-500 text-xs sm:text-sm">
          <p>
            © 2026 Postsiva Inc. All rights reserved.
          </p>
          <div className="flex flex-col items-center gap-1 sm:gap-8 sm:flex-row">
            <Link
              href="https://privacy-policy.postsiva.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="https://terms.postsiva.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
