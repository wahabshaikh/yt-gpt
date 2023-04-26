// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { OpenAI } from "langchain/llms/openai";
import { PromptTemplate } from "langchain/prompts";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { LLMChain } from "langchain/chains";
import { supabaseClient } from "~/lib/supabase";
import { convertToText } from "~/utils";
import { NextRequest } from "next/server";

export const config = {
  runtime: "edge",
};

export default async function handler(req: NextRequest) {
  try {
    const { question, videoId } = (await req.json()) as {
      question?: string;
      videoId?: string;
    };
    if (!question) throw new Error("No question found in req.body");
    if (!videoId) throw new Error("No videoId found in req.body");

    const { data, error } = await supabaseClient
      .from("videos")
      .select("transcript")
      .eq("video_id", videoId)
      .single();

    if (error) throw error;

    if (!data || !data.transcript) throw new Error("No transcript found");

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
        "Answer the question based on the following context:\n\n{context}\n\nAlso consider the previous incomplete answer: {answer}\n\nquestion: {question}";
      const prompt = new PromptTemplate({
        template,
        inputVariables: ["context", "answer", "question"],
      });
      const chain = new LLMChain({ llm: model, prompt });
      const answerResponse = await chain.call({ context, answer, question });

      answer = answerResponse.text;
    }

    return new Response(JSON.stringify({ answer }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (error) {
    console.error(error);
    return new Response("Something went wrong!", {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }
}
