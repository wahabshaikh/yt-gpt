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

      const { data, error } = await supabaseClient
        .from("videos")
        .select()
        .eq("video_id", videoId);

      if (error) {
        toast.error(error.message);
        return;
      }

      if (!data || data.length === 0) {
        const response = await fetch("/api/save-video-details", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videoId }),
        });

        const data = await response.json();

        if (!response.ok) throw new Error(data.message);
      }

      // For saving data
      const { data: userData, error: userDataError } = await supabaseClient
        .from("user_data")
        .select()
        .eq("user_id", user?.id)
        .eq("video_id", videoId);

      if (userDataError) {
        toast.error(userDataError.message);
        return;
      }

      if (!userData || userData.length === 0) {
        const { error } = await supabaseClient.from("user_data").insert({
          user_id: user?.id,
          video_id: videoId,
        });

        if (error) throw error;
      }

      router.push(`/videos/${videoId}`);
    } catch (error: any) {
      toast.error(error.message);
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
            className="input input-bordered border-neutral w-full"
            placeholder="https://www.youtube.com/watch?v="
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />
          <button
            type="submit"
            className={clsx(
              "btn btn-square btn-outline",
              isLoading && "loading"
            )}
            disabled={isLoading}
          >
            {!isLoading && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
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
