// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { OpenAI } from "langchain/llms/openai";
import { loadSummarizationChain } from "langchain/chains";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { extractTextFromTranscription } from "~/utils";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { transcription } = (await req.body) as {
    transcription?: string;
  };

  if (!transcription) throw new Error("No transcription found in req.body");

  const text = extractTextFromTranscription(transcription);

  const model = new OpenAI({ temperature: 0 });
  const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000 });
  const docs = await textSplitter.createDocuments([text]);

  const chain = loadSummarizationChain(model);
  const summarizeResponse = await chain.call({
    input_documents: docs,
  });

  res.status(200).json({ summary: summarizeResponse.text });
}
