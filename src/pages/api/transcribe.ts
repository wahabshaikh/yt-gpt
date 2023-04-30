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
    if (!videoId) throw new Error("No videoId found in req.body!");

    const transcript = await YoutubeTranscript.fetchTranscript(videoId);

    const { error } = await supabaseClient
      .from("videos")
      .update({
        transcript,
      })
      .eq("video_id", videoId);

    if (error) throw error;

    res
      .status(200)
      .json({ transcript, message: "Transcribed video successfully!" });
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ message: "Please enter a video with CC enabled!" });
  }
}
