// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { OpenAI } from "langchain/llms/openai";
import { loadSummarizationChain } from "langchain/chains";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { supabaseClient } from "~/lib/supabase";
import { convertToText } from "~/utils";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { url } = (await req.body) as {
      url?: string;
    };
    if (!url) throw new Error("No url found in req.body");

    const { data, error } = await supabaseClient
      .from("videos")
      .select("transcript")
      .eq("url", url)
      .single();

    if (error) throw error;

    if (!data) throw new Error("No data found");

    const text = convertToText(data.transcript);

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

    const { error: updateError } = await supabaseClient
      .from("videos")
      .update({
        summary,
      })
      .eq("url", url);

    if (updateError) throw updateError;

    res.status(200).end();
  } catch (error) {
    console.error(error);
    res.status(400).end();
  }
}
