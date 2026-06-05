'use client';

import { useState } from 'react';
import { Button, Input } from 'rizzui';
import { toast } from 'sonner';
import React from 'react';

import { Envelop } from '@/components/icons/envelop';
import { Box } from '@/components/layout';

export const EmailLogin = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const email = formData.get('email');

    if (!email) {
      toast.error('Please provide a valid email address.');
      setIsLoading(false);
      return;
    }

    // Mock response simulation
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setIsLoading(false);
    toast.success('Secure authorization magic link sent directly to your inbox!');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full">
      <Box className="w-full">
        <Input
          autoComplete="email"
          name="email"
          type="email"
          required
          disabled={isLoading}
          placeholder="name@agency.com"
          className="w-full"
          inputClassName="
            w-full h-12 lg:h-13 px-4 rounded-xl transition-all duration-200 border
            bg-slate-50 dark:bg-slate-800/50 
            border-slate-200 dark:border-slate-700/80
            text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500
            focus:bg-white dark:focus:bg-slate-900
            focus:border-blue-500 dark:focus:border-blue-400
            focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-400/10
            disabled:opacity-60 disabled:cursor-not-allowed
          "
          prefix={
            <Envelop className="w-5 h-5 ml-1 text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500 transition-colors" />
          }
        />
      </Box>

      <Button
        type="submit"
        isLoading={isLoading}
        disabled={isLoading}
        className="
          w-full h-12 lg:h-13 mt-2 text-sm lg:text-base font-semibold tracking-wide text-white 
          bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200
          text-white dark:text-slate-950 rounded-xl shadow-sm hover:shadow
          transition-all duration-200 active:scale-[0.99] disabled:opacity-50
        "
      >
        Request Access Link
      </Button>
    </form>
  );
};