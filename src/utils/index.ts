import { Transcript } from "youtubei";

export const extractTextFromTranscription = (transcription: string) => {
  return transcription
    .split("\n")
    .map((row) => {
      const [timestamp, text] = row.split("  ");

      return { timestamp, text };
    })
    .map((row) => row.text)
    .join(" ");
};

export const convertToText = (transcript: Transcript[]) => {
  let text = "";

  for (let i = 0; i < transcript.length; i++) {
    text += `${transcript[i].text} `;
  }

  return text.trim();
};

export const convertToSRT = (
  transcript: {
    text: string;
    offset: number;
    duration: number;
  }[]
) => {
  let srt = "";
  let index = 1;

  for (let i = 0; i < transcript.length; i++) {
    srt += `${index}\n`;
    srt += `${formatTime(transcript[i].offset)} --> ${formatTime(
      transcript[i].offset + transcript[i].duration
    )}\n`;
    srt += `${transcript[i].text}\n\n`;
    index++;
  }

  return srt;
};

const formatTime = (milliseconds: number) => {
  const date = new Date(milliseconds);
  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  const seconds = date.getUTCSeconds();
  const millisecondsFormatted = (milliseconds % 1000)
    .toString()
    .padStart(3, "0");

  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")},${millisecondsFormatted}`;
};
