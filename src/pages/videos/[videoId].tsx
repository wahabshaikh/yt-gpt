import Head from "next/head";
import { useState } from "react";
import { toast } from "react-hot-toast";
import clsx from "clsx";
import Image from "next/image";
import { GetStaticPaths, GetStaticProps } from "next";
import { supabaseClient } from "~/lib/supabase";
import Link from "next/link";

type Video = {
  video_id: string;
  url: string;
  title: string;
  thumbnail: string;
  summary: string;
};

export default function Home({ video }: { video: Video }) {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const fetchResult = async (query: string) => {
    setIsLoading(true);

    try {
      console.log(query);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <Head>
        <title>{video.title} | YT-GPT</title>
      </Head>

      <Link href="/">
        <Image src="/logo.png" alt="YT-GPT" height={120} width={120} />
      </Link>

      <section className="mt-8 flex items-center gap-4">
        <Image
          src={video.thumbnail}
          alt={video.title}
          height={120}
          width={120}
        />

        <div>
          <h2 className="text-3xl font-bold">{video.title}</h2>
          <a href={video.url} className="mt-4 link">
            Watch Video
          </a>
        </div>
      </section>

      <div className="mt-8 border shadow-md p-8 rounded-md bg-base-200">
        <h3 className="text-xl font-bold">Summary</h3>
        <p className="mt-4">{video.summary}</p>
      </div>

      <form
        className="mt-8 max-w-3xl w-full"
        onSubmit={(e) => {
          e.preventDefault();

          if (query) {
            fetchResult(query);
          } else {
            toast.error("Please provide a query!");
          }
        }}
      >
        <div className="form-control">
          <div className="input-group">
            <input
              type="text"
              className="input input-bordered w-full"
              placeholder="Enter your query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              required
            />
            <button
              type="submit"
              className={clsx("btn btn-square", isLoading && "loading")}
              disabled={isLoading}
            >
              {!isLoading && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </form>
    </main>
  );
}

export const getStaticProps: GetStaticProps = async (context) => {
  const videoId = context.params?.videoId;

  const { data: video, error } = await supabaseClient
    .from("videos")
    .select("*")
    .eq("video_id", videoId)
    .single();

  if (error) throw error;

  return {
    props: {
      video,
    },
    // Next.js will attempt to re-generate the page:
    // - When a request comes in
    // - At most once every 60 seconds
    revalidate: 60, // In seconds
  };
};

// This function gets called at build time on server-side.
// It may be called again, on a serverless function, if
// the path has not been generated.
export const getStaticPaths: GetStaticPaths = async () => {
  const { data: videos, error } = await supabaseClient
    .from("videos")
    .select("video_id");

  if (error) throw error;

  if (!videos) throw new Error("No videos found!");

  // Get the paths we want to pre-render based on videos
  const paths = videos.map((video) => ({
    params: { videoId: video.video_id },
  }));

  // We'll pre-render only these paths at build time.
  // { fallback: 'blocking' } will server-render pages
  // on-demand if the path doesn't exist.
  return { paths, fallback: "blocking" };
};
