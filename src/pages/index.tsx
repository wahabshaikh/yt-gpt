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
    <main className="flex  flex-col items-center justify-center h-fit ">
      <Head>
        <title>YT-GPT</title>
      </Head>

      <Link href="/">
      <h3 className="landingHeading">Video GPT</h3>
        {/* <Image src="/logo.png" alt="YT-GPT" height={120} width={120} /> */}
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
          <div className="text-center">
            <p className="landingIntro ">Enter the YouTube Video URL :</p>
          {/* <label className="label">
            <span className="label-text">Enter the YouTube Video URL</span>
          </label> */}
          </div>
          
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
         <footer className="footer">
        <svg
          width="24"
          height="20"
          viewBox="0 0 24 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M23 1.01006C22.0424 1.68553 20.9821 2.20217 19.86 2.54006C19.2577 1.84757 18.4573 1.35675 17.567 1.13398C16.6767 0.911216 15.7395 0.967251 14.8821 1.29451C14.0247 1.62177 13.2884 2.20446 12.773 2.96377C12.2575 3.72309 11.9877 4.62239 12 5.54006V6.54006C10.2426 6.58562 8.50127 6.19587 6.93101 5.4055C5.36074 4.61513 4.01032 3.44869 3 2.01006C3 2.01006 -1 11.0101 8 15.0101C5.94053 16.408 3.48716 17.109 1 17.0101C10 22.0101 21 17.0101 21 5.51006C20.9991 5.23151 20.9723 4.95365 20.92 4.68006C21.9406 3.67355 22.6608 2.40277 23 1.01006Z"
            fill="#334155"
            stroke="#334155"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </footer>
    </main>
  );
}
