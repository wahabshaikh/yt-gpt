import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import React from "react";

const Nav = () => {
  const router = useRouter();
  const supabaseClient = useSupabaseClient();
  const user = useUser();

  if (!user) return null;

  return (
    <nav className="navbar bg-base-100">
      <div className="flex-1">
        {router.pathname !== "/" ? (
          <Link href="/" className="btn btn-ghost">
            <Image src="/logo.svg" alt="YTJarvis" height={40} width={120} />
          </Link>
        ) : null}
      </div>
      <div className="dropdown dropdown-end">
        <label tabIndex={0} className="btn btn-ghost btn-circle avatar">
          <div className="w-10 rounded-full">
            <Image
              src={user.user_metadata.avatar_url}
              alt={user.user_metadata.full_name}
              height={40}
              width={40}
            />
          </div>
        </label>
        <ul
          tabIndex={0}
          className="mt-3 p-2 shadow menu menu-compact dropdown-content bg-base-100 rounded-box w-52"
        >
          <li>
            <button onClick={() => supabaseClient.auth.signOut()}>
              Logout
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Nav;
