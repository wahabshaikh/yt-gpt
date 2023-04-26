import Head from "next/head";
import { useState } from "react";
import { toast } from "react-hot-toast";
import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import getYouTubeID from "get-youtube-id";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import Login from "~/components/Login";

export default function Home() {
  const router = useRouter();
  const supabaseClient = useSupabaseClient();
  const user = useUser();

  const [url, setUrl] = useState("");
  // const [recentVideos, setRecentVideos] = useState<
  //   { video_id: string; title: string; thumbnail: string; url: string }[]
  // >([]);
  const [isLoading, setIsLoading] = useState(false);

  // useEffect(() => {
  //   fetchRecentVideos();
  // }, []);

  // const fetchRecentVideos = async () => {
  //   const { data, error } = await supabaseClient
  //     .from("videos")
  //     .select("video_id, title, thumbnail, url")
  //     .limit(5);

  //   if (error) {
  //     toast.error(error.message);
  //     return;
  //   }

  //   if (!data || !data.length) {
  //     toast.error(`No videos found!`);
  //     return;
  //   }

  //   setRecentVideos(data);
  // };

  const fetchVideo = async (url: string) => {
    setIsLoading(true);

    try {
      const videoId = getYouTubeID(url, { fuzzy: false });
      if (!videoId) {
        toast.error(`Invalid URL`);
        return;
      }

      const { data } = await supabaseClient
        .from("videos")
        .select("*")
        .eq("video_id", videoId);

      if (!data || data.length === 0) {
        const request = await fetch("/api/save-video-details", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videoId }),
        });

        if (!request.ok) throw new Error(`Couldn't save video details`);
      }

      // await toast.promise(
      //   fetch("/api/save-video-details", {
      //     method: "POST",
      //     headers: { "Content-Type": "application/json" },
      //     body: JSON.stringify({ url }),
      //   }),
      //   {
      //     loading: "Fetching video details...",
      //     success: "Fetched video details successfully!",
      //     error: "Something went wrong while fetching video details!",
      //   }
      // );

      // await toast.promise(
      //   fetch("/api/save-video-summary", {
      //     method: "POST",
      //     headers: { "Content-Type": "application/json" },
      //     body: JSON.stringify({ url }),
      //   }),
      //   {
      //     loading: "Fetching video summary...",
      //     success: "Fetched video summary successfully!",
      //     error: "Something went wrong while fetching video summary!",
      //   }
      // );

      router.push(`/videos/${videoId}`);
    } catch (error) {
      toast.error("Something went wrong!");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return <Login />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Head>
        <title>YTJarvis</title>
      </Head>

      <nav className="navbar bg-base-100">
        <div className="ml-auto">
          <ul className="menu menu-horizontal px-1">
            <li>
              <button onClick={() => supabaseClient.auth.signOut()}>
                Sign out
              </button>
            </li>
          </ul>
        </div>
      </nav>

      <main className="mx-auto max-w-3xl px-4 py-12 flex flex-col items-center justify-center flex-1">
        <Link href="/">
          <Image src="/logo.svg" alt="YTJarvis" height={120} width={240} />
        </Link>

        <p className="mt-4 text-center">
          Connect with your favorite YouTube videos. Paste the URL below to
          start chatting.
        </p>

        <form
          className="mt-12 max-w-3xl w-full"
          onSubmit={(e) => {
            e.preventDefault();

            if (url) {
              fetchVideo(url);
            } else {
              toast.error("Please provide a url!");
            }
          }}
        >
          <div className="form-control">
            <div className="input-group">
              <input
                type="url"
                className="input input-bordered w-full"
                placeholder="https://www.youtube.com/watch?v="
                value={url}
                onChange={(e) => setUrl(e.target.value)}
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

        {/* <section className="mt-8">
        <h2 className="text-3xl font-bold">Recent Videos</h2>
        <ul className="mt-8 space-y-4">
        {recentVideos.map((video) => (
          <li key={video.video_id}>
          <Link href={`/videos/${video.video_id}`}>
          <div className="flex gap-4 items-center">
                  <Image
                    src={video.thumbnail}
                    alt={video.title}
                    height={120}
                    width={120}
                    />
                    <div>
                    <h3 className="font-bold">{video.title}</h3>
                    <a href={video.url} target="_blank" className="link">
                      Watch Video
                    </a>
                    </div>
                </div>
              </Link>
            </li>
            ))}
        </ul>
      </section> */}
      </main>

      <footer className="mx-auto py-8">
        <a
          href="http://twitter.com/iwahabshaikh"
          target="_blank"
          rel="noopener noreferrer"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            className="fill-current"
          >
            <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"></path>
          </svg>
        </a>
      </footer>
    </div>
  );
}
