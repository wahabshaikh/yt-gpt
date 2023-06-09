import { GetStaticPaths, GetStaticProps } from "next";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import YouTube from "react-youtube";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import clsx from "clsx";
import URLBar from "~/components/URLBar";
import Card from "~/components/Card";
import Layout from "~/components/Layout";
import { supabaseClient } from "~/lib/supabase";
import { convertToText } from "~/utils";
import { Transcript, Video } from "youtubei";

type QnA = { question: string; answer: string };

export default function VideoPage({
  video,
}: {
  video: Video & { transcript: Transcript[]; summary: string };
}) {
  const supabaseClient = useSupabaseClient();
  const user = useUser();

  const [question, setQuestion] = useState("");
  const [history, setHistory] = useState<QnA[]>(
    video.chapters && video.chapters.length !== 0
      ? video.summary
        ? [
            {
              question: "Chapters",
              answer: video.chapters
                .map((chapter, index) => `${index + 1}: ${chapter.title}`)
                .join("\n"),
            },
            {
              question: "Summary",
              answer: video.summary,
            },
          ]
        : [
            {
              question: "Chapters",
              answer: video.chapters
                .map((chapter, index) => `${index + 1}: ${chapter.title}`)
                .join("\n"),
            },
          ]
      : video.summary
      ? [
          {
            question: "Summary",
            answer: video.summary,
          },
        ]
      : []
  );
  const [notes, setNotes] = useState<QnA[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchNotes();
  }, [user]);

  const fetchNotes = async () => {
    if (!user) {
      toast.error("Unauthenticated user... please login to continue!");
      return;
    }

    try {
      const { data, error } = await supabaseClient
        .from("video_notes")
        .select("question, answer")
        .eq("userId", user.id)
        .eq("videoId", video.id);

      if (error) {
        toast.error("Something went wrong while fetching notes!");
        throw error;
      }

      if (!data || data.length === 0) {
        return;
      }

      setNotes(data.reverse());
    } catch (error: any) {
      console.error(error);
      toast.error(error.message);
    }
  };

  const addToNotes = async (question: string, answer: string) => {
    if (!user) {
      toast.error("Unauthenticated user... please login to continue!");
      return;
    }

    try {
      const { data, error } = await supabaseClient
        .from("video_notes")
        .select()
        .eq("userId", user.id)
        .eq("videoId", video.id)
        .eq("question", question)
        .eq("answer", answer);

      if (error) {
        toast.error("Something went wrong while fetching your note!");
        throw error;
      }

      if (!data || data.length === 0) {
        const { error } = await supabaseClient.from("video_notes").insert({
          question,
          answer,
          userId: user.id,
          videoId: video.id,
        });

        if (error) {
          toast.error("Something went wrong while adding to your notes!");
          throw error;
        }

        toast.success("Note saved successfully!");

        const updatedNotes = [...notes, { question, answer }];
        setNotes(updatedNotes.reverse());
      } else {
        toast.error("Note already saved!");
      }
    } catch (error: unknown) {
      console.error(error);
      toast.error((error as Error).message);
    }
  };

  const removeFromNotes = async (
    index: number,
    question: string,
    answer: string
  ) => {
    if (!user) {
      toast.error("Unauthenticated user... please login to continue!");
      return;
    }

    try {
      const { error } = await supabaseClient
        .from("video_notes")
        .delete()
        .eq("userId", user.id)
        .eq("videoId", video.id)
        .eq("question", question)
        .eq("answer", answer);

      if (error) {
        toast.error("Something went wrong while deleting your note!");
        throw error;
      }

      toast.success("Note removed successfully!");

      const updatedNotes = [...notes];
      updatedNotes.splice(index, 1);
      setNotes(updatedNotes.reverse());

      if (question === "Summary" || question === "Chapters") {
        return;
      }

      setHistory([{ question, answer }, ...history]);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message);
    }
  };

  const fetchAnswer = async (question: string) => {
    if (!user) {
      toast.error("Unauthenticated user... please login to continue!");
      return;
    }

    setIsLoading(true);

    try {
      const text = convertToText(video.transcript);

      const response = await fetch("/api/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question,
          text,
          videoId: video.id,
        }),
      });

      if (!response.ok) {
        toast.error(response.statusText);
        return;
      }

      const data = await response.json();

      if (!data || !data.answer) {
        toast.error("No answer in response!");
        return;
      }

      const updatedHistory = [...history, { question, answer: data.answer }];
      setHistory(updatedHistory.reverse());
    } catch (error: any) {
      console.error(error);
      toast.error(error.message);
    } finally {
      setQuestion("");
      setIsLoading(false);
    }
  };

  return (
    <Layout title={video.title}>
      <main className="mx-auto max-w-7xl px-4 py-12 grid md:grid-cols-2 gap-16 w-full">
        <div>
          {/* Video Title */}
          <h1 className="font-bold">{video.title}</h1>

          {/* YouTube Embed */}
          <div className="mt-8 rounded-md overflow-hidden">
            <YouTube
              videoId={video.id}
              opts={{
                height: "320",
                width: "100%",
              }}
            />
          </div>

          {/* Notes */}
          <section className="mt-8">
            <h2 className="font-semibold">My Notes</h2>
            <ul className="mt-8 space-y-4">
              {notes.length === 0 && (
                <p className="flex items-center gap-2">
                  <span>No notes yet... Click on</span>{" "}
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z"
                      stroke="#464646"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M12 8V16"
                      stroke="#464646"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M8 12H16"
                      stroke="#464646"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>{" "}
                  <span>to add a note!</span>
                </p>
              )}
              {notes.map((item, index) => (
                <Card
                  key={index}
                  action="remove"
                  title={`Question: ${item.question}`}
                  content={item.answer}
                  handleClick={() =>
                    removeFromNotes(index, item.question, item.answer)
                  }
                />
              ))}
            </ul>
          </section>
        </div>

        <div className=" flex flex-col">
          <URLBar initialUrl={`https://youtu.be/${video.id}`} />

          <div className="divider uppercase">Ask your question below</div>

          <form
            onSubmit={(e) => {
              e.preventDefault();

              if (!question) {
                toast.error("Please provide a question!");
                return;
              }

              fetchAnswer(question);
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

          <ul className="mt-8 space-y-4">
            {history.map((item, index) => (
              <Card
                key={index}
                action="add"
                title={`Question: ${item.question}`}
                content={item.answer}
                handleClick={() => addToNotes(item.question, item.answer)}
              />
            ))}
          </ul>
        </div>
      </main>
    </Layout>
  );
}

export const getStaticProps: GetStaticProps = async (context) => {
  const videoId = context.params?.videoId;

  const { data: video, error } = await supabaseClient
    .from("videos")
    .select("*")
    .eq("id", videoId)
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
    .select("id");

  if (error) throw error;

  if (!videos) throw new Error("No videos found!");

  // Get the paths we want to pre-render based on videos
  const paths = videos.map((video) => ({
    params: { videoId: video.id },
  }));

  // We'll pre-render only these paths at build time.
  // { fallback: 'blocking' } will server-render pages
  // on-demand if the path doesn't exist.
  return { paths, fallback: "blocking" };
};
