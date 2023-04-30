import "~/styles/globals.css";
import type { AppProps } from "next/app";
import { Inter } from "next/font/google";
import { createBrowserSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { SessionContextProvider } from "@supabase/auth-helpers-react";
import NextProgress from "next-progress";
import { Toaster } from "react-hot-toast";
import { useState } from "react";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export default function App({ Component, pageProps }: AppProps) {
  const [supabaseClient] = useState(() => createBrowserSupabaseClient());

  return (
    <SessionContextProvider
      supabaseClient={supabaseClient}
      initialSession={pageProps.initialSession}
    >
      <div className={`${inter.variable} font-sans`}>
        <Component {...pageProps} />
        <Toaster />
        <NextProgress delay={300} options={{ showSpinner: false }} />
      </div>
    </SessionContextProvider>
  );
}
