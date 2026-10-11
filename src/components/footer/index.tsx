'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { Text } from 'rizzui';

import { cn } from '@/lib/utils/cn';
import { Box, Flex } from '@/components/layout';

const menuItems = [
  { label: 'Support', href: '/', target: '_blank' },
  { label: 'Privacy', href: '/' },
  { label: 'Terms & Condition', href: '/' },
];

const SOCIALS = [
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/profile.php?id=61587843457957',
    icon: (
      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
        <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
      </svg>
    ),
  },
  {
    label: 'YouTube',
    href: 'https://www.youtube.com/@TheSpyAgency-com',
    icon: (
      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.872.505 9.377.505 9.377.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/company/the-spy-agency/',
    icon: (
      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0z" />
      </svg>
    ),
  },
];

export const Footer = () => {
  const { ref } = useInView({
    threshold: 0,
  });

  const [email, setEmail] = useState('');
  const [signupState, setSignupState] = useState<
    'idle' | 'submitting' | 'success' | 'error'
  >('idle');

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (signupState === 'submitting') return;
    setSignupState('submitting');
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'footer' }),
      });
      if (res.ok) {
        setSignupState('success');
        setEmail('');
      } else {
        setSignupState('error');
      }
    } catch {
      setSignupState('error');
    }
  };

  return (
    <footer
      ref={ref}
      className="relative bottom-0 mt-8 font-geist bg-black text-center xl:mt-0 pt-16 pb-8"
    >
      <Box className="max-w-[120rem] md:px-8 3xl:px-40 px-4 mx-auto">
        {/* --- HERO SECTION FOR LANDING --- */}
        <div className="relative z-10 max-w-2xl mx-auto mb-20 flex flex-col items-center">
          {/* Subtle Grid Background Grid Simulation */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px] -z-10 pointer-events-none opacity-40" />

          <span className="text-xs font-semibold tracking-widest text-emerald-400 uppercase mb-3">
            Join the Community
          </span>

          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight leading-tight mb-4">
            Connect with <span className="text-emerald-500">The Spy Agency</span>
          </h2>

          <p className="text-gray-400 text-sm sm:text-base max-w-lg mb-8 leading-relaxed">
            Hop into our Facebook community or follow our socials to trade tips,
            receive free prompts, and chat with thousands of active agents.
          </p>

          {/* Newsletter signup — posts to /api/newsletter (newsletter_subscribers) */}
          <form
            onSubmit={handleSubscribe}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full max-w-md"
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              disabled={signupState === 'submitting'}
              aria-label="Email address for the newsletter"
              className="flex-1 px-4 py-2.5 rounded-md bg-emerald-950/20 border border-emerald-500/30 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-emerald-500 transition-all disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={signupState === 'submitting'}
              className="px-6 py-2.5 rounded-md border border-emerald-500/30 text-white font-medium text-sm bg-emerald-950/20 hover:bg-emerald-500/20 transition-all duration-300 shadow-[0_0_15px_rgba(16,185,129,0.1)] disabled:opacity-60 whitespace-nowrap"
            >
              {signupState === 'submitting' ? 'Joining…' : 'Free Prompt Newsletter'}
            </button>
          </form>
          {signupState === 'success' && (
            <p className="text-emerald-400 text-sm mt-3">
              You&apos;re on the list — welcome to the agency.
            </p>
          )}
          {signupState === 'error' && (
            <p className="text-red-400 text-sm mt-3">
              Signup hit a snag — please try again in a moment.
            </p>
          )}

          {/* Social icons */}
          <div className="flex items-center gap-6 mt-12 text-gray-400">
            {SOCIALS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noreferrer"
                className="hover:text-white transition-colors"
                aria-label={s.label}
              >
                {s.icon}
              </a>
            ))}
          </div>
        </div>

        {/* --- BASE FOOTER ROW --- */}
        <Flex
          direction="col-reverse"
          justify="between"
          align="center"
          className="gap-4 py-4 text-sm font-light sm:py-5 md:py-6 border-t sm:flex-row lg:py-8 text-[#E5E7EB]/80 border-gray-800 lg:text-base"
        >
          <Text className="py-0.5">
            &copy; {new Date().getFullYear()}{' '}
            <Link
              href="https://redq.io"
              target="_blank"
              rel="noreferrer"
              className="font-bold text-[#E5E7EB]"
            >
              The Spy Agency
            </Link>
            . All rights reserved.
          </Text>

          <Flex
            justify="between"
            align="start"
            className="sm:w-[unset] w-full [@media(min-width:375px)]:gap-6 [@media(min-width:375px)]:justify-center"
          >
            {menuItems.map((item) => (
              <Link
                key={`key-${item.label}`}
                href={item.href}
                {...(item.target ? { target: item.target, rel: 'noreferrer' } : {})}
                className="duration-200 text-[#E5E7EB]/80 hover:text-[#E5E7EB]"
              >
                {item.label}
              </Link>
            ))}
          </Flex>
        </Flex>
      </Box>
    </footer>
  );
};
