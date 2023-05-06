import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import Layout from "~/components/Layout";
import Link from "next/link";
import Image from "next/image";
import { Thumbnails, Video } from "youtubei";

type History = {
  id: string;
  title: string;
  thumbnails: Thumbnails;
  added_on: string;
}[];

export default function HistoryPage() {
  const supabaseClient = useSupabaseClient();
  const user = useUser();

  const [history, setHistory] = useState<History>([]);

  useEffect(() => {
    fetchHistory();
  }, [user]);

  const fetchHistory = async () => {
    if (!user) {
      toast.error("Unauthenticated user... please login to continue!");
      return;
    }

    try {
      const { data, error } = await supabaseClient
        .from("user_videos")
        .select("created_at, videos (id, title, thumbnails)")
        .eq("userId", user.id);

      if (error) {
        toast.error("Something went wrong while fetching history!");
        return;
      }

      if (!data || data.length === 0) {
        // toast.error("No history found!");
        return;
      }

      const history = data.map((item) => ({
        ...item.videos,
        added_on: item.created_at,
      })) as unknown as History;

      setHistory(history);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message);
    }
  };

  return (
    <Layout title="History">
      <main className="mx-auto max-w-7xl px-4 py-12 w-full">
        <h1 className="text-3xl font-bold">History</h1>
        <ul className="mt-8 grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {history.map((video) => (
            <li key={video.id}>
              <div className="card w-full md:h-64 lg:h-80 bg-base-100 shadow-xl image-full">
                <figure className="relative">
                  <Image
                    src={video.thumbnails[video.thumbnails.length - 1].url}
                    alt={video.title}
                    fill
                  />
                </figure>
                <div className="card-body">
                  <h2 className="card-title">{video.title}</h2>
                  <p>
                    Added on {new Date(video.added_on).toLocaleDateString()}
                  </p>
                  <div className="card-actions justify-end">
                    <Link
                      href={`videos/${video.id}`}
                      className="btn btn-primary"
                    >
                      See notes
                    </Link>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </main>
    </Layout>
  );
}
