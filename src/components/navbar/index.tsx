"use client";

import React, { useState, useEffect } from 'react';
import { globalStyles } from '@/app/styles.global';
import {NavbarProps, NavItem, navbarStyles} from './navbar.style';
import { useRouter } from "next/navigation";

const defaultNavItems: NavItem[] = [
  { label: 'Agents', href: '#' },
  { label: 'Intel', href: '#' },
  { label: 'Special Ops', href: '#' },
  { label: 'Q Branch', href: '#' },
  { label: 'Head Quarters', href: '#' },
];

export const Navbar: React.FC<NavbarProps> = ({ initialItems = defaultNavItems }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
    const router = useRouter();


  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    // Cleanup on unmount
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  const toggleMenu = (): void => setIsOpen(!isOpen);
  const closeMenu = (): void => setIsOpen(false);

  return (
    <>
      <header className={navbarStyles.header}>
        <div className={navbarStyles.container}>
          
          {/* Logo */}
          <div className={navbarStyles.logo}>The Spy Agency</div>

          {/* Desktop Navigation */}
          <nav className={navbarStyles.desktopNav}>
            {initialItems.map((item) => (
              <a key={item.label} href={item.href} className={navbarStyles.navLink}>
                {item.label}
              </a>
            ))}
          </nav>

          {/* Desktop Login Button */}
          <button onClick={() => router.push("/login")} className={navbarStyles.desktopLoginBtn}>
            <svg className={`w-[18px] h-[18px] ${globalStyles.iconStroke2}`} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
            Login
          </button>

          {/* Mobile Hamburger Button */}
          <button onClick={toggleMenu} className={navbarStyles.hamburgerBtn} aria-label="Toggle Menu">
            <svg className={`w-6 h-6 ${globalStyles.iconStroke2}`} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>

        </div>
      </header>

      {/* Mobile Drawer Backdrop Wrapper */}
      <div 
        className={`${navbarStyles.drawerWrapper} ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeMenu} 
      >
        {/* Inner Content Panel */}
        <div 
          className={`${navbarStyles.drawerContent} ${
            isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          onClick={(e) => e.stopPropagation()} 
        >
          <div>
            {/* Drawer Header */}
            <div className={navbarStyles.drawerHeader}>
              <div className={navbarStyles.logo}>The Spy Agency</div>
              <button onClick={closeMenu} className="p-1 text-gray-500 hover:text-gray-900 transition-colors focus:outline-none" aria-label="Close Menu">
                <svg className={`w-6 h-6 ${globalStyles.iconStroke2}`} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Drawer Links */}
            <nav className={navbarStyles.mobileNav}>
              {initialItems.map((item) => (
                <a key={item.label} href={item.href} onClick={closeMenu} className={navbarStyles.mobileNavLink}>
                  {item.label}
                </a>
              ))}
            </nav>
          </div>

          {/* Drawer Login Button */}
          <div className="pt-6 border-t border-gray-100">
            <button onClick={() => router.push("/login")} className={navbarStyles.mobileLoginBtn}>
              <svg className={`w-4 h-4 ${globalStyles.iconStroke2}`} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
              Login 
            </button>
          </div>
        </div>
      </div>
    </>
  );
};