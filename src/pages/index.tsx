import Head from "next/head";
import { useState } from "react";
import { toast } from "react-hot-toast";
import clsx from "clsx";

export default function Home() {
  const [transcription, setTranscription] = useState("");
  const [summary, setSummary] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const fetchResult = async (transcription: string) => {
    setSummary("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transcription,
        }),
      });

      if (!response.ok) {
        toast.error(response.statusText);
        throw new Error(response.statusText);
      }

      const data = await response.json();

      if (!data) {
        toast.error("No data in response!");
        throw new Error("No data in response!");
      }

      setSummary(data.summary);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <Head>
        <title>YT-GPT</title>
      </Head>

      <h1 className="font-bold text-3xl">📽️ YT-GPT</h1>
      <form
        className="mt-8 space-y-4 w-full"
        onSubmit={(e) => {
          e.preventDefault();

          if (transcription) {
            fetchResult(transcription);
          } else {
            toast.error("Please provide a transcription!");
          }
        }}
      >
        <div className="form-control">
          <label className="label">
            <span className="label-text">Transcription</span>
          </label>
          <textarea
            className="textarea textarea-bordered h-24"
            placeholder="Enter the transcription"
            value={transcription}
            onChange={(e) => setTranscription(e.target.value)}
          />
        </div>
        <button
          type="submit"
          className={clsx("btn btn-primary", isLoading && "loading")}
          disabled={isLoading}
        >
          Submit
        </button>
      </form>
      <div className="mt-8">
        {summary && (
          <>
            <h2 className="text-xl font-bold">Summary</h2>
            <p className="mt-4">{summary}</p>
          </>
        )}
      </div>
    </main>
  );
}
