// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { OpenAI } from "langchain/llms/openai";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { loadQAMapReduceChain } from "langchain/chains";
import { NextRequest } from "next/server";

export const config = {
  runtime: "edge",
};

export default async function handler(req: NextRequest) {
  try {
    const { question, text, videoId } = (await req.json()) as {
      question?: string;
      text?: string;
      videoId?: string;
    };
    if (!question) throw new Error("No question found in req.body");
    if (!text) throw new Error("No text found in req.body");
    if (!videoId) throw new Error("No videoId found in req.body");

    const model = new OpenAI({ temperature: 0, maxConcurrency: 10 });
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 2000,
      chunkOverlap: 100,
    });
    const docs = await textSplitter.createDocuments([text]);
    const chain = loadQAMapReduceChain(model);

    const answerResponse = await chain.call({
      input_documents: docs,
      question,
    });

    const answer = answerResponse.text;

    return new Response(JSON.stringify({ answer }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (error: any) {
    console.error(error);
    return new Response(error.message, {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }
}
