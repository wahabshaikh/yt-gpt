import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import React from "react";

const Login = () => {
  const supabaseClient = useSupabaseClient();

  return (
    <main className="mx-auto flex flex-col items-center justify-center px-4 min-h-screen max-w-3xl">
      <Head>
        <title>Login | YTJarvis</title>
      </Head>

      <Link href="/">
        <Image
          src="/logo-with-text.svg"
          alt="YTJarvis"
          height={120}
          width={240}
        />
      </Link>

      <div className="mt-12 w-full">
        <Auth
          redirectTo="/"
          appearance={{ theme: ThemeSupa }}
          supabaseClient={supabaseClient}
          providers={["google"]}
          socialLayout="vertical"
          onlyThirdPartyProviders
        />
      </div>
    </main>
  );
};

export default Login;
