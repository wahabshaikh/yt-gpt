import React from "react";
import { useUser } from "@supabase/auth-helpers-react";
import Login from "./Login";
import Head from "next/head";
import Nav from "./Nav";
import Banner from "./Banner";

interface LayoutProps {
  title?: string;
  children: React.ReactNode;
}

const Layout = ({ title, children }: LayoutProps) => {
  const user = useUser();

  if (!user) {
    return <Login />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Head>
        <title>{title ? `${title} | YTJarvis` : "YTJarvis"}</title>
      </Head>

      <Banner />

      <Nav />

      {children}
    </div>
  );
};

export default Layout;
