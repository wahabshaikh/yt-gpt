// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { Client, Video } from "youtubei";
import { supabaseClient } from "~/lib/supabase";

const youtube = new Client();

export default async function saveVideoDetails(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { videoId } = req.body as { videoId?: string };
    if (!videoId) {
      throw new Error(
        "We require a video ID to perform this action. Please provide a valid video ID and try again."
      );
    }

    const video = await youtube.getVideo(videoId);
    if (!video) {
      throw new Error(
        "Sorry, we could not find any details for the requested video. Please ensure that the video ID is correct and try again."
      );
    }

    if (video.isLiveContent) {
      throw new Error(
        "Sorry, but the video you're trying to access is currently not supported as it is a live video stream. Please try again with a different video that is not a live stream."
      );
    }

    const {
      id,
      title,
      thumbnails,
      description,
      duration,
      uploadDate,
      chapters,
      tags,
      isLiveContent,
      channel,
    } = video as Video;

    // Duration check
    if (duration >= 3600) {
      throw new Error(
        "Please make sure to enter a video with a duration less than 1 hour. Videos with a duration longer than 1 hour are currently not supported."
      );
    }

    const transcript = await youtube.getVideoTranscript(videoId);

    if (!transcript) {
      throw new Error(
        "Sorry, it looks like we are currently unable to support this video as it has no transcript available. Please make sure to enter a video URL with CC enabled."
      );
    }

    const { error } = await supabaseClient.from("videos").insert({
      id,
      title,
      thumbnails,
      description,
      duration,
      uploadDate,
      chapters,
      tags,
      isLiveContent,
      channelId: channel.id,
      transcript,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      throw error;
    }

    res.status(200).json({
      message: "Your requested video details have been saved successfully.",
      transcript,
    });
  } catch (error: unknown) {
    console.error(error);
    res.status(400).json({ message: (error as Error).message });
  }
}
