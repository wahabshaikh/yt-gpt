// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { OpenAI } from "langchain/llms/openai";
import { AnalyzeDocumentChain, loadSummarizationChain } from "langchain/chains";
import { supabaseClient } from "~/lib/supabase";
import { NextRequest } from "next/server";

export const config = {
  runtime: "edge",
};

export default async function handler(
  // req: NextApiRequest,
  // res: NextApiResponse
  req: NextRequest
) {
  try {
    // const { videoId, text } = (await req.body) as {
    //   videoId?: string;
    //   text?: string;
    // };
    const { videoId, text } = (await req.json()) as {
      videoId?: string;
      text?: string;
    };
    if (!videoId) throw new Error("No videoId found in req.body");
    if (!text) throw new Error("No text found in req.body");

    const model = new OpenAI({ temperature: 0 });
    const combineDocsChain = loadSummarizationChain(model);
    const chain = new AnalyzeDocumentChain({
      combineDocumentsChain: combineDocsChain,
    });
    const summarizeResponse = await chain.call({
      input_document: text,
    });
    const summary = summarizeResponse.text;

    const { error: updateError } = await supabaseClient
      .from("user_data")
      .update({
        summary,
      })
      .eq("video_id", videoId);

    if (updateError) throw updateError;

    // res.status(200).json({ summary });
    return new Response(JSON.stringify({ summary }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (error) {
    console.error(error);
    return new Response("Something went wrong!", {
      status: 400,
      headers: { "content-type": "application/json" },
    });
    // res.status(400).end();
  }
}
