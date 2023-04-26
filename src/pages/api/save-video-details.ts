// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { Client } from "youtubei";
import { YoutubeTranscript } from "youtube-transcript";
import { OpenAI } from "langchain/llms/openai";
import { loadSummarizationChain } from "langchain/chains";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { convertToText } from "~/utils";
import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";

const youtube = new Client();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const supabaseClient = createServerSupabaseClient({ req, res });
    const { data } = await supabaseClient.auth.getUser();

    const { videoId } = (await req.body) as {
      videoId?: string;
    };
    if (!videoId) throw new Error("No videoId found in req.body");

    const video = await youtube.getVideo(videoId);
    if (!video) throw new Error("No video found");

    const { title, thumbnails } = video;

    const transcript = await YoutubeTranscript.fetchTranscript(videoId);

    const text = convertToText(transcript);

    const model = new OpenAI({ temperature: 0 });
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 3000,
    });
    const docs = await textSplitter.createDocuments([text]);

    const chain = loadSummarizationChain(model);
    const summarizeResponse = await chain.call({
      input_documents: docs,
    });
    const summary = summarizeResponse.text;

    const { error } = await supabaseClient.from("videos").insert({
      url: `https://youtu.be/${videoId}`,
      video_id: videoId,
      title,
      thumbnail: thumbnails[thumbnails.length - 1].url,
      transcript,
      summary,
    });

    if (error) throw error;

    await supabaseClient.from("history").insert({
      user_id: data.user?.id,
      video_id: videoId,
    });

    res.status(200).end();
  } catch (error) {
    console.error(error);
    res.status(400).end();
  }
}
