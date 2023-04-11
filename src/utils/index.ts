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
