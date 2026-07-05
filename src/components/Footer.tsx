'use client'

import Link from 'next/link'
import Image from 'next/image'

export default function Footer() {
  return (
    <footer className="bg-primary-900 text-cream-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
          <div>
            <div className="mb-3 flex items-center gap-2.5">
              <Image
                src="/logo.png"
                alt="Eweeha — Wedding Cars Lebanon"
                width={144}
                height={144}
                className="w-12 h-12 sm:w-14 sm:h-14 object-contain"
              />
              <span className="leading-none">
                <span className="script-accent block text-3xl text-primary-100">Eweeha</span>
                <span className="block text-[9px] tracking-[0.24em] text-primary-200 uppercase mt-1">Wedding Cars Lebanon</span>
              </span>
            </div>
            <p className="text-sm text-primary-100/80">Wedding cars with chauffeur, everywhere in Lebanon.</p>
          </div>
          <div>
            <h4 className="text-cream-50 font-semibold mb-3">Company</h4>
            <ul className="space-y-2 text-sm text-primary-100/80">
              <li><Link href="/about" className="hover:text-white">About Us</Link></li>
              {/* Blog link hidden until enough posts exist — /blog route still live */}
              <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
              <li><Link href="/faq" className="hover:text-white">FAQ</Link></li>
              <li><Link href="/terms" className="hover:text-white">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-cream-50 font-semibold mb-3">Services</h4>
            <ul className="space-y-2 text-sm text-primary-100/80">
              <li><Link href="/fleet" className="hover:text-white">Wedding Car Fleet</Link></li>
              <li><Link href="/services/wedding-convoy" className="hover:text-white">Wedding Convoy</Link></li>
              <li><Link href="/services/bridal-car" className="hover:text-white">Bridal Car &amp; Chauffeur</Link></li>
              <li><Link href="/services/photoshoot-cars" className="hover:text-white">Classic &amp; Convertible Cars</Link></li>
              <li><Link href="/services/guest-shuttle" className="hover:text-white">Guest Shuttle Vans</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-cream-50 font-semibold mb-3">Payment Methods</h4>
            <div className="flex items-center gap-2 text-xs text-primary-100 flex-wrap">
              <span className="px-2 py-1 bg-primary-800 rounded">Visa</span>
              <span className="px-2 py-1 bg-primary-800 rounded">Mastercard</span>
              <span className="px-2 py-1 bg-primary-800 rounded">OMT</span>
              <span className="px-2 py-1 bg-primary-800 rounded">Bank Transfer</span>
            </div>
          </div>
          <div>
            <h4 className="text-cream-50 font-semibold mb-3">Support</h4>
            <ul className="space-y-2 text-sm text-primary-100/80">
              <li><a href="tel:+96170971841" className="hover:text-white">+961-70-971-841</a></li>
              <li><a href="mailto:eweehalebanon@gmail.com" className="hover:text-white">eweehalebanon@gmail.com</a></li>
              <li><a href="https://wa.me/96170971841" target="_blank" rel="noopener noreferrer" className="hover:text-white">WhatsApp</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-primary-800 pt-6 text-sm text-primary-100/70 flex justify-between items-center">
          <div>© {new Date().getFullYear()} Eweeha. All rights reserved.</div>
          <Link href="/routes" className="hover:text-white">Site Map</Link>
        </div>
      </div>
    </footer>
  )
}
