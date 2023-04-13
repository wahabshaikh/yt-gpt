import Head from "next/head";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";
import { supabaseClient } from "~/lib/supabase";
import { useRouter } from "next/router";
import getYouTubeID from "get-youtube-id";

export default function Home() {
  const router = useRouter();

  const [url, setUrl] = useState("");
  const [recentVideos, setRecentVideos] = useState<
    { video_id: string; title: string; thumbnail: string; url: string }[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchRecentVideos();
  }, []);

  const fetchRecentVideos = async () => {
    const { data, error } = await supabaseClient
      .from("videos")
      .select("video_id, title, thumbnail, url")
      .limit(5);

    if (error) {
      toast.error(error.message);
      return;
    }

    if (!data || !data.length) {
      toast.error(`No videos found!`);
      return;
    }

    setRecentVideos(data);
  };

  const saveVideo = async (url: string) => {
    setIsLoading(true);

    try {
      await toast.promise(
        fetch("/api/save-video-details", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        }),
        {
          loading: "Fetching video details...",
          success: "Fetched video details successfully!",
          error: "Something went wrong while fetching video details!",
        }
      );

      await toast.promise(
        fetch("/api/save-video-summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        }),
        {
          loading: "Fetching video summary...",
          success: "Fetched video summary successfully!",
          error: "Something went wrong while fetching video summary!",
        }
      );

      const videoId = getYouTubeID(url, { fuzzy: false });

      router.push(`/videos/${videoId}`);
    } catch (error) {
      toast.error("Something went wrong!");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <Head>
        <title>YT-GPT</title>
      </Head>

      <Link href="/">
        <Image src="/logo.png" alt="YT-GPT" height={120} width={120} />
      </Link>

      <form
        className="mt-8 max-w-3xl w-full"
        onSubmit={(e) => {
          e.preventDefault();

          if (url) {
            saveVideo(url);
          } else {
            toast.error("Please provide a url!");
          }
        }}
      >
        <div className="form-control">
          <label className="label">
            <span className="label-text">Enter the YouTube Video URL</span>
          </label>
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

      <section className="mt-8">
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
      </section>
    </main>
  );
}
