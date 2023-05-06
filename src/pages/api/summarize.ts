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
    if (!videoId) {
      throw new Error(
        "We require a video ID to perform this action. Please provide a valid video ID and try again."
      );
    }
    if (!text) {
      throw new Error(
        "We require the transcript text to perform this action. Please provide a valid transcript text and try again."
      );
    }

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

    const { error } = await supabaseClient
      .from("videos")
      .update({
        summary,
        updated_at: new Date().toISOString(),
      })
      .eq("id", videoId);

    if (error) throw error;

    return new Response(JSON.stringify({ summary }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (error: unknown) {
    console.error(error);
    return new Response((error as Error).message, {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
