// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { Client } from "youtubei";
import { YoutubeTranscript } from "youtube-transcript";
import { supabaseClient } from "~/lib/supabase";

const youtube = new Client();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { videoId } = (await req.body) as {
      videoId?: string;
    };
    if (!videoId) throw new Error("No videoId found in req.body");

    const video = await youtube.getVideo(videoId);
    if (!video) throw new Error("No video found");

    const { title, thumbnails } = video;

    const transcript = await YoutubeTranscript.fetchTranscript(videoId);

    const { error } = await supabaseClient.from("videos").insert({
      url: `https://youtu.be/${videoId}`,
      video_id: videoId,
      title,
      thumbnail: thumbnails[thumbnails.length - 1].url,
      transcript,
    });

    if (error) throw error;

    res.status(200).end();
  } catch (error) {
    console.error(error);
    res.status(400).end();
  }
}
