import { globalStyles } from '@/app/styles.global';

export interface NavItem {
    label: string;
    href: string;
}

export interface NavbarProps {
    initialItems?: NavItem[];
}

export const navbarStyles = {
    // Completely translucent glass: Map layers run directly underneath this container
    header: "w-full bg-slate-950/75 backdrop-blur-md border-b border-slate-900/80 px-6 py-4 fixed top-0 z-50 select-none transition-all duration-300",
    container: "max-w-7xl mx-auto flex items-center justify-between",
    
    // Crisp white text matching the global logo typography 
    logo: "text-base font-bold tracking-wider text-white uppercase cursor-pointer select-none",
    
    // Desktop Nav Items with a refined emerald hover line indicator
    desktopNav: "hidden lg:flex items-center space-x-8",
    navLink: "text-xs tracking-wide text-slate-400 hover:text-white transition-colors duration-200 ease-in-out relative py-1 group",
    
    // Desktop CTA: High-contrast button with a micro-interactive press effect
    desktopLoginBtn: "hidden lg:flex items-center gap-2 px-4 py-1.5 rounded-md bg-white text-slate-950 text-xs font-bold hover:bg-slate-200 active:scale-95 transition-all duration-150",
    
    hamburgerBtn: "lg:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-900/60 rounded-lg transition-colors",
    
    // Mobile Drawer Setup
    drawerWrapper: "fixed inset-0 z-50 lg:hidden bg-slate-950/80 backdrop-blur-sm transition-opacity duration-300",
    drawerContent: "w-[85%] max-w-sm h-full bg-slate-950 border-r border-slate-900 flex flex-col justify-between p-6 overflow-y-auto shadow-2xl transition-transform duration-300 ease-in-out",
    drawerHeader: "flex items-center justify-between pb-6 border-b border-slate-900",
    
    mobileNav: "flex flex-col space-y-5 pt-6",
    mobileNavLink: "text-sm tracking-wide text-slate-300 hover:text-emerald-400 transition-colors",
    mobileLoginBtn: "w-full flex items-center justify-center gap-2 bg-emerald-500 text-slate-950 rounded-lg py-3 text-xs font-bold hover:bg-emerald-400 active:scale-95 transition-all"
} as const;