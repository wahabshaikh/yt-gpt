import Head from "next/head";
import { useState } from "react";
import { toast } from "react-hot-toast";
import clsx from "clsx";

export default function Home() {
  const [url, setUrl] = useState("");
  const [summary, setSummary] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const fetchResult = async (url: string) => {
    setSummary("");
    setIsLoading(true);

    try {
      const saveVideoDetailsResponse = await fetch("/api/save-video-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (!saveVideoDetailsResponse.ok) {
        toast.error("Something went wrong while saving video details!");
        throw new Error(saveVideoDetailsResponse.statusText);
      }

      const saveVideoSummaryResponse = await fetch("/api/save-video-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (!saveVideoSummaryResponse.ok) {
        toast.error("Something went wrong while saving video summary!");
        throw new Error(saveVideoSummaryResponse.statusText);
      }

      const data = await saveVideoSummaryResponse.json();

      // if (!data) {
      //   toast.error("No data in response!");
      //   throw new Error("No data in response!");
      // }

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
        className="mt-8"
        onSubmit={(e) => {
          e.preventDefault();

          if (url) {
            fetchResult(url);
          } else {
            toast.error("Please provide a url!");
          }
        }}
      >
        <div className="form-control">
          <label className="label">
            <span className="label-text">Enter the YouTube video link</span>
          </label>
          <div className="input-group">
            <input
              type="text"
              className="input input-bordered"
              placeholder="https://www.youtube.com/"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <button
              type="submit"
              className={clsx("btn btn-square", isLoading && "loading")}
              disabled={isLoading}
            >
              {!isLoading && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
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
