'use client'

import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { useConfig } from '@/hooks/useConfig'

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
}

const navigationItems = [
  { name: 'The Cars', href: '#fleet' },
  { name: 'Full Fleet', href: '/fleet' },
  { name: 'Services', href: '#services' },
  { name: 'Wedding Areas', href: '/routes' },
  { name: 'Book Now', href: '/booking' },
  { name: 'Contact', href: '#contact' },
  { name: 'Track Booking', href: '/booking/lookup' },
]

export default function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const { appConfig: config } = useConfig()

  const handleLinkClick = (href: string) => {
    onClose()
    // Add smooth scrolling for anchor links
    if (href.startsWith('#')) {
      setTimeout(() => {
        const element = document.querySelector(href)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 100)
    }
  }

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50 md:hidden" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-500"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-500"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-warm-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-500"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-500"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto relative w-screen max-w-sm">
                  <Transition.Child
                    as={Fragment}
                    enter="ease-in-out duration-500"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in-out duration-500"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <div className="absolute left-0 top-0 -ml-8 flex pr-2 pt-4 sm:-ml-10 sm:pr-4">
                      <button
                        type="button"
                        className="relative rounded-md text-gray-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-white"
                        onClick={onClose}
                      >
                        <span className="absolute -inset-2.5" />
                        <span className="sr-only">Close panel</span>
                        <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                      </button>
                    </div>
                  </Transition.Child>
                  <div className="flex h-full flex-col overflow-y-scroll bg-white dark:bg-gray-800 py-6 shadow-xl">
                    <div className="px-4 sm:px-6">
                      <Dialog.Title className="text-base font-semibold leading-6 text-charcoal-500 dark:text-white">
                        Eweeha
                      </Dialog.Title>
                    </div>
                    <div className="relative mt-6 flex-1 px-4 sm:px-6">
                      <nav className="space-y-1">
                        {navigationItems.map((item) => (
                          item.href.startsWith('#') ? (
                            <button
                              key={item.name}
                              onClick={() => handleLinkClick(item.href)}
                              className="block w-full text-left px-3 py-2 text-base font-medium rounded-md transition-colors text-charcoal-500 dark:text-gray-300 hover:text-charcoal-500 dark:hover:text-white hover:bg-warm-50 dark:hover:bg-gray-700"
                            >
                              {item.name}
                            </button>
                          ) : (
                            <Link
                              key={item.name}
                              href={item.href}
                              onClick={() => onClose()}
                              className="block w-full text-left px-3 py-2 text-base font-medium rounded-md transition-colors text-charcoal-500 dark:text-gray-300 hover:text-charcoal-500 dark:hover:text-white hover:bg-warm-50 dark:hover:bg-gray-700"
                            >
                              {item.name}
                            </Link>
                          )
                        ))}
                        <Link
                          href="/booking"
                          onClick={() => onClose()}
                          className="block w-full text-center px-3 py-2 mt-4 text-base font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 transition-colors"
                        >
                          Book Your Wedding Car
                        </Link>
                        <div className="border-t border-warm-200 dark:border-gray-700 pt-4 mt-4">
                          <a
                            href={`tel:${config?.contact?.phone || '+96170971841'}`}
                            className="flex items-center px-3 py-2 text-base font-medium text-charcoal-500 dark:text-gray-300 hover:text-charcoal-500 dark:hover:text-white transition-colors"
                          >
                            📞 {config?.contact?.phone || '+961-70-971-841'}
                          </a>
                          <a
                            href={`https://wa.me/${config?.contact?.whatsapp || '96170971841'}`}
                            className="flex items-center px-3 py-2 text-base font-medium text-[#128C7E] hover:text-[#075E54] transition-colors"
                          >
                            💬 WhatsApp
                          </a>
                        </div>
                      </nav>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}
