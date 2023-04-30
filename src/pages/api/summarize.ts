// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { OpenAI } from "langchain/llms/openai";
import { loadSummarizationChain } from "langchain/chains";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { supabaseClient } from "~/lib/supabase";
import { NextRequest } from "next/server";

export const config = {
  runtime: "edge",
};

export default async function handler(req: NextRequest) {
  try {
    const { videoId, text } = (await req.json()) as {
      videoId?: string;
      text?: string;
    };
    if (!videoId) throw new Error("No videoId found in req.body");
    if (!text) throw new Error("No text found in req.body");

    const model = new OpenAI({ temperature: 0 });
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 2000,
      chunkOverlap: 100,
    });
    const docs = await textSplitter.createDocuments([text]);

    const chain = loadSummarizationChain(model);
    const summarizeResponse = await chain.call({
      input_documents: docs,
    });
    const summary = summarizeResponse.text;

    const { error: updateError } = await supabaseClient
      .from("user_data")
      .update({
        summary,
      })
      .eq("video_id", videoId);

    if (updateError) throw updateError;

    return new Response(JSON.stringify({ summary }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (error: any) {
    console.error(error);
    return new Response(error.messsage, {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }
}
