import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import clsx from "clsx";
import getYouTubeID from "get-youtube-id";
import { useRouter } from "next/router";
import React, { useState } from "react";
import { toast } from "react-hot-toast";

interface URLBarProps {
  initialUrl?: string;
}

const URLBar = ({ initialUrl }: URLBarProps) => {
  const router = useRouter();
  const supabaseClient = useSupabaseClient();
  const user = useUser();

  const [url, setUrl] = useState(initialUrl || "");
  const [isLoading, setIsLoading] = useState(false);

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

      await supabaseClient.from("history").insert({
        user_id: user?.id,
        video_id: videoId,
      });

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

  return (
    <form
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
  );
};

export default URLBar;
