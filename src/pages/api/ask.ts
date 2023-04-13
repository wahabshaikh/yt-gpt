// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { OpenAI } from "langchain/llms/openai";
import { PromptTemplate } from "langchain/prompts";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { LLMChain } from "langchain/chains";
import { supabaseClient } from "~/lib/supabase";
import { convertToText } from "~/utils";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { query, videoId } = (await req.body) as {
      query?: string;
      videoId?: string;
    };
    if (!query) throw new Error("No query found in req.body");
    if (!videoId) throw new Error("No videoId found in req.body");

    const { data, error } = await supabaseClient
      .from("videos")
      .select("transcript")
      .eq("video_id", videoId)
      .single();

    if (error) throw error;

    if (!data) throw new Error("No data found");

    const text = convertToText(data.transcript);

    const model = new OpenAI({ temperature: 0 });
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 3000,
    });
    const docs = await textSplitter.createDocuments([text]);

    let answer = "";
    for (let i = 0; i < docs.length; i++) {
      const context = docs[i].pageContent;
      const template =
        "Answer the query based on the following context:\n\n{context}\n\nAlso consider the previous incomplete answer: {answer}\n\nQuery: {query}";
      const prompt = new PromptTemplate({
        template,
        inputVariables: ["context", "answer", "query"],
      });
      const chain = new LLMChain({ llm: model, prompt });
      const answerResponse = await chain.call({ context, answer, query });

      answer = answerResponse.text;
      console.log(answer);
    }

    res.status(200).json({ answer });
  } catch (error) {
    console.error(error);
    res.status(400).end();
  }
}
