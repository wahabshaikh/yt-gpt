// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { OpenAI } from "langchain/llms/openai";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { loadQAMapReduceChain } from "langchain/chains";
import { NextApiRequest, NextApiResponse } from "next";
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
    // const { question, text, videoId } = (await req.body) as {
    //   question?: string;
    //   text?: string;
    //   videoId?: string;
    // };
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
    // let answer = "";
    // for (let i = 0; i < docs.length; i++) {
    //   const context = docs[i].pageContent;
    //   const template =
    //     "Answer the question based on the following context:\n\n{context}\n\nAlso consider the previous incomplete answer: {answer}\n\nquestion: {question}";
    //   const prompt = new PromptTemplate({
    //     template,
    //     inputVariables: ["context", "answer", "question"],
    //   });
    //   const chain = new LLMChain({ llm: model, prompt });
    //   const answerResponse = await chain.call({ context, answer, question });

    //   answer = answerResponse.text;
    // }

    // res.status(200).json({ answer });
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
    // res.status(400).json({});
  }
}
