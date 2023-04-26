import Head from "next/head";
import { GetStaticPaths, GetStaticProps } from "next";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import YouTube from "react-youtube";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import Login from "~/components/Login";
import URLBar from "~/components/URLBar";
import { supabaseClient } from "~/lib/supabase";
import Card from "~/components/Card";
import clsx from "clsx";

type Video = {
  video_id: string;
  url: string;
  title: string;
  thumbnail: string;
  summary: string;
};

export default function Home({ video }: { video: Video }) {
  const supabaseClient = useSupabaseClient();
  const user = useUser();

  const [question, setQuestion] = useState("");
  const [history, setHistory] = useState<
    { question: string; answer: string }[]
  >([]);
  const [notes, setNotes] = useState<{ question: string; answer: string }[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchNotes();
    }
  }, [user]);

  const fetchNotes = async () => {
    const { data, error } = await supabaseClient
      .from("history")
      .select("notes")
      .eq("user_id", user?.id)
      .eq("video_id", video.video_id)
      .single();

    if (error) {
      toast.error("Couldn't fetch notes");
      return;
    }

    setNotes(data?.notes || []);
  };

  const fetchAnswer = async (question: string) => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question,
          videoId: video.video_id,
        }),
      });

      if (!response.ok) {
        toast.error(response.statusText);
        throw new Error(response.statusText);
      }

      const data = await response.json();

      if (!data || !data.answer) {
        toast.error("No answer in response!");
        throw new Error("No answer in response!");
      }

      const updatedHistory = [...history, { question, answer: data.answer }];
      setHistory(updatedHistory);
    } catch (error) {
      console.error(error);
    } finally {
      setQuestion("");
      setIsLoading(false);
    }
  };

  if (!user) {
    return <Login />;
  }

  return (
    <div className="flex flex-col h-screen">
      <Head>
        <title>{video.title} | YTJarvis</title>
      </Head>

      <nav className="navbar bg-base-100 max-w-7xl mx-auto">
        <div className="flex-1">
          <Link href="/" className="btn btn-ghost normal-case text-xl p-0">
            <Image src="/logo.svg" alt="YTJarvis" height={120} width={120} />
          </Link>
        </div>
        <div className="flex-none">
          <ul className="menu menu-horizontal px-1">
            <li>
              <button onClick={() => supabaseClient.auth.signOut()}>
                Sign out
              </button>
            </li>
          </ul>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-12 flex-1 grid grid-cols-2 gap-16">
        <div className="order-2">
          <h1 className="font-bold">{video.title}</h1>

          <div className="mt-8 rounded-md overflow-hidden">
            <YouTube
              videoId={video.video_id}
              opts={{
                height: "320",
                width: "100%",
              }}
            />
          </div>

          <div className="mt-8">
            <h2 className="font-semibold">My Notes</h2>
            <ul className="mt-8 space-y-4">
              {notes.map((item, index) => (
                <Card
                  key={index}
                  action="remove"
                  title={`Question: ${item.question}`}
                  content={item.answer}
                  handleClick={async () => {
                    const updatedNotes = [...notes];
                    updatedNotes.splice(index, 1);

                    const { error } = await supabaseClient
                      .from("history")
                      .update({ notes: updatedNotes })
                      .eq("user_id", user.id)
                      .eq("video_id", video.video_id);

                    if (error)
                      toast.error(
                        "Something went wrong while removing from your notes!"
                      );

                    setNotes(updatedNotes);
                  }}
                />
              ))}
            </ul>
          </div>
        </div>

        <div className="order-1 flex flex-col">
          <URLBar initialUrl={video.url} />

          <ul className="mt-8 space-y-4">
            <Card
              action="add"
              title="Summary"
              content={video.summary}
              handleClick={async () => {
                const updatedNotes = [
                  ...notes,
                  {
                    question: "Summary",
                    answer: video.summary,
                  },
                ];

                const { data, error } = await supabaseClient
                  .from("history")
                  .update({ notes: updatedNotes })
                  .eq("user_id", user.id)
                  .eq("video_id", video.video_id)
                  .select();

                if (error)
                  toast.error(
                    "Something went wrong while adding to your notes!"
                  );

                setNotes(updatedNotes);
              }}
            />
            {history.map((item, index) => (
              <Card
                key={index}
                action="add"
                title={`Question: ${item.question}`}
                content={item.answer}
                handleClick={async () => {
                  const updatedNotes = [
                    ...notes,
                    { question: item.question, answer: item.answer },
                  ];

                  const { data, error } = await supabaseClient
                    .from("history")
                    .update({ notes: updatedNotes })
                    .eq("user_id", user.id)
                    .eq("video_id", video.video_id)
                    .select();

                  if (error)
                    toast.error(
                      "Something went wrong while adding to your notes!"
                    );

                  setNotes(updatedNotes);
                }}
              />
            ))}
          </ul>

          <form
            className="mt-8"
            onSubmit={(e) => {
              e.preventDefault();

              if (question) {
                fetchAnswer(question);
              } else {
                toast.error("Please provide a question!");
              }
            }}
          >
            <div className="form-control">
              <div className="input-group">
                <input
                  type="text"
                  className="input input-bordered w-full"
                  placeholder="Type in to chat with the video content..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  required
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
        </div>
      </main>
    </div>
  );
}

export const getStaticProps: GetStaticProps = async (context) => {
  const videoId = context.params?.videoId;

  const { data: video, error } = await supabaseClient
    .from("videos")
    .select("*")
    .eq("video_id", videoId)
    .single();

  if (error) throw error;

  return {
    props: {
      video,
    },
    // Next.js will attempt to re-generate the page:
    // - When a request comes in
    // - At most once every 60 seconds
    revalidate: 60, // In seconds
  };
};

// This function gets called at build time on server-side.
// It may be called again, on a serverless function, if
// the path has not been generated.
export const getStaticPaths: GetStaticPaths = async () => {
  const { data: videos, error } = await supabaseClient
    .from("videos")
    .select("video_id");

  if (error) throw error;

  if (!videos) throw new Error("No videos found!");

  // Get the paths we want to pre-render based on videos
  const paths = videos.map((video) => ({
    params: { videoId: video.video_id },
  }));

  // We'll pre-render only these paths at build time.
  // { fallback: 'blocking' } will server-render pages
  // on-demand if the path doesn't exist.
  return { paths, fallback: "blocking" };
};
