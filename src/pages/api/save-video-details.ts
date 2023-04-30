// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { Client } from "youtubei";
// import { YoutubeTranscript } from "youtube-transcript";
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

    const video = await youtube.getVideo(videoId);
    if (!video) throw new Error("No video details found!");

    const { title, thumbnails, channel, uploadDate } = video;
    const thumbnail = thumbnails[thumbnails.length - 1].url;
    const duration = (video as any).duration || 0;
    const chapters = (video as any).chapters || [];

    // Duration check
    if (duration >= 3600)
      return res.status(400).json({
        message: "Please enter a video no longer than 1 hour!",
      });

    // const transcript = await YoutubeTranscript.fetchTranscript(videoId);

    const { error } = await supabaseClient.from("videos").insert({
      url: `https://youtu.be/${videoId}`,
      video_id: videoId,
      title,
      thumbnail,
      duration,
      upload_date: uploadDate,
      channel_id: channel.id,
      chapters,
      // transcript,
    });

    if (error) throw error;

    res.status(200).json({ message: "Saved video details successfully!" });
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
}
