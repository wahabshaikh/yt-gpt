import { GetStaticPaths, GetStaticProps } from "next";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import YouTube from "react-youtube";
import { User, useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import clsx from "clsx";
import URLBar from "~/components/URLBar";
import Card from "~/components/Card";
import Layout from "~/components/Layout";
import { supabaseClient } from "~/lib/supabase";
import { convertToText } from "~/utils";

type Video = {
  video_id: string;
  url: string;
  title: string;
  transcript: { text: string; offset: number; duration: number }[];
};

type QnA = { question: string; answer: string };

export default function Home({ video }: { video: Video }) {
  const supabaseClient = useSupabaseClient();
  const user = useUser();

  const [question, setQuestion] = useState("Summarize");
  const [history, setHistory] = useState<QnA[]>([]);
  const [notes, setNotes] = useState<QnA[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      return;
    }

    fetchNotes(user);
  }, [user]);

  const summarizeVideo = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabaseClient
        .from("user_data")
        .select("summary")
        .eq("user_id", user?.id)
        .eq("video_id", video.video_id)
        .single();

      if (error) {
        toast.error("Error fetching summary");
        return;
      }

      if (!data || !data.summary) {
        const text = convertToText(video.transcript);

        const response = await toast.promise(
          fetch("/api/save-video-summary", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ videoId: video.video_id, text }),
          }),
          {
            loading: "Summarizing the video...",
            success: "Successfully summarized the video!",
            error: "Something went wrong while summarizing the video!",
          }
        );

        if (!response.ok) {
          toast.error("Something went wrong while summarizing the video!");
          return;
        }

        const data = await response.json();

        setHistory([{ question: "Summary", answer: data.summary }]);
      } else {
        setHistory([{ question: "Summary", answer: data.summary }]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setQuestion("");
      setIsLoading(false);
    }
  };

  const fetchNotes = async (user: User) => {
    const { data, error } = await supabaseClient
      .from("user_data")
      .select("notes")
      .eq("user_id", user.id)
      .eq("video_id", video.video_id)
      .single();

    if (error) {
      toast.error("Couldn't fetch notes");
      return;
    }

    setNotes(data?.notes || []);
  };

  const addToNotes = async (question: string, answer: string) => {
    const updatedNotes = [...notes, { question, answer }];

    const { error } = await supabaseClient
      .from("user_data")
      .update({ notes: updatedNotes })
      .eq("user_id", user?.id)
      .eq("video_id", video.video_id);

    if (error) {
      toast.error("Something went wrong while adding to your notes!");
      return;
    }

    setNotes(updatedNotes);
  };

  const removeFromNotes = async (index: number) => {
    const updatedNotes = [...notes];
    updatedNotes.splice(index, 1);

    const { error } = await supabaseClient
      .from("user_data")
      .update({ notes: updatedNotes })
      .eq("user_id", user?.id)
      .eq("video_id", video.video_id);

    if (error) {
      toast.error("Something went wrong while removing from your notes!");
      return;
    }

    setNotes(updatedNotes);
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

  return (
    <Layout title={video.title}>
      <main className="mx-auto max-w-7xl px-4 py-12 grid md:grid-cols-2 gap-16 w-full">
        <div>
          {/* Video Title */}
          <h1 className="font-bold">{video.title}</h1>

          {/* YouTube Embed */}
          <div className="mt-8 rounded-md overflow-hidden">
            <YouTube
              videoId={video.video_id}
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
                  handleClick={() => removeFromNotes(index)}
                />
              ))}
            </ul>
          </section>
        </div>

        <div className=" flex flex-col">
          <URLBar initialUrl={video.url} />

          <div className="divider uppercase">Ask your question below</div>

          <form
            onSubmit={(e) => {
              e.preventDefault();

              if (question) {
                if (question === "Summarize") {
                  summarizeVideo();
                } else {
                  fetchAnswer(question);
                }
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
