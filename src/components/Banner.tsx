import Link from "next/link";
import React from "react";

const Banner = () => {
  return (
    <Link
      href="https://thebuilderstudio.gumroad.com/l/ytjarvis"
      className="text-center bg-accent text-accent-content text-sm p-1 font-bold"
      target="_blank"
    >
      Become an early supporter and get lifetime access to all features for $99
    </Link>
  );
};

export default Banner;
