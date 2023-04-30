import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import clsx from "clsx";
import getYouTubeID from "get-youtube-id";
import { useRouter } from "next/router";
import React, { useState } from "react";
import { toast } from "react-hot-toast";
import { convertToText } from "~/utils";

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
    // Auth check
    if (!user) {
      toast.error("Unauthenticated user... please login to continue!");
      return;
    }

    setIsLoading(true);

    try {
      // Extract ID from URL
      const videoId = getYouTubeID(url, { fuzzy: false });
      if (!videoId) {
        toast.error("Invalid URL!");
        return;
      }

      // Check if video exists already
      const { data, error } = await supabaseClient
        .from("videos")
        .select("transcript, summary")
        .eq("video_id", videoId);

      if (error) {
        toast.error("Something went wrong while fetching videos!");
        throw error;
      }

      // If video does not exist, save video details
      if (!data || data.length === 0) {
        const response = await fetch("/api/save-video-details", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videoId }),
        });
        const data = await response.json();

        if (!response.ok) throw new Error(data.message);
        toast.success(data.message);

        const transcribeResponse = await fetch("/api/transcribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videoId }),
        });
        const transcribeData = await transcribeResponse.json();

        if (!transcribeResponse.ok) throw new Error(transcribeData.message);
        toast.success(transcribeData.message);

        const text = convertToText(transcribeData.transcript);
        const summarizeResponse = await fetch("/api/summarize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videoId, text }),
        });

        if (!summarizeResponse.ok)
          throw new Error("Something went wrong while summarizing the video!");
        toast.success("Summarized the video successfully!");
      }

      // No transcription
      if (!data[0].transcript) {
        const transcribeResponse = await fetch("/api/transcribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videoId }),
        });
        const transcribeData = await transcribeResponse.json();

        if (!transcribeResponse.ok) throw new Error(transcribeData.message);
        toast.success(transcribeData.message);

        const text = convertToText(data[0].summary);
        const summarizeResponse = await fetch("/api/summarize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videoId, text }),
        });

        if (!summarizeResponse.ok)
          throw new Error("Something went wrong while summarizing the video!");
        toast.success("Summarized the video successfully!");
      }

      // There is transcript, but no summary
      if (data[0].transcript && !data[0].summary) {
        const text = convertToText(data[0].transcript);
        const summarizeResponse = await fetch("/api/summarize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videoId, text }),
        });

        if (!summarizeResponse.ok)
          throw new Error("Something went wrong while summarizing the video!");
        toast.success("Summarized the video successfully!");
      }

      // Check if history exists already
      const { data: history, error: historyError } = await supabaseClient
        .from("history")
        .select()
        .eq("user_id", user.id)
        .eq("video_id", videoId);

      if (historyError) {
        toast.error("Something went wrong while fetching history!");
        throw historyError;
      }

      // If history does not exist, save history
      if (!history || history.length === 0) {
        const { error } = await supabaseClient.from("history").insert({
          user_id: user.id,
          video_id: videoId,
        });

        if (error) {
          toast.error("Something went wrong while saving history!");
          throw error;
        }
      }

      router.push(`/videos/${videoId}`);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();

        if (!url) {
          toast.error("Please provide a url!");
          return;
        }

        fetchVideo(url);
      }}
    >
      <div className="form-control">
        <div className="input-group">
          <input
            type="url"
            className="input input-bordered border-neutral border-r-0 w-full"
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
