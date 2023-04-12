// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import getYouTubeID from "get-youtube-id";
import { Client } from "youtubei";
import { YoutubeTranscript } from "youtube-transcript";
import { supabaseClient } from "~/lib/supabase";

const youtube = new Client();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { url } = (await req.body) as {
      url?: string;
    };
    if (!url) throw new Error("No url found in req.body");

    const videoId = getYouTubeID(url, { fuzzy: false });
    if (!videoId) throw new Error("No videoId found");

    const video = await youtube.getVideo(videoId);
    if (!video) throw new Error("No video found");

    const { title, thumbnails, channel } = video;

    const transcript = await YoutubeTranscript.fetchTranscript(videoId);

    const { error } = await supabaseClient.from("videos").upsert(
      {
        url,
        video_id: videoId,
        title,
        thumbnail: thumbnails[thumbnails.length - 1].url,
        channel_id: channel.id,
        transcript,
      },
      { onConflict: "video_id" }
    );

    if (error) throw error;

    res.status(200).json({});
  } catch (error) {
    console.error(error);
    res.status(400).json({});
  }
}
