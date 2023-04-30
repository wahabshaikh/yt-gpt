import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { User, useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import Layout from "~/components/Layout";
import Link from "next/link";
import Image from "next/image";

type Video = {
  video_id: string;
  title: string;
  thumbnail: string;
  added_on: string;
};

export default function HistoryPage() {
  const supabaseClient = useSupabaseClient();
  const user = useUser();

  const [videos, setVideos] = useState<Video[]>([]);

  useEffect(() => {
    if (!user) {
      return;
    }

    fetchVideos(user);
  }, [user]);

  const fetchVideos = async (user: User) => {
    const { data, error } = await supabaseClient
      .from("user_data")
      .select("created_at, videos (video_id, title, thumbnail)")
      .eq("user_id", user.id);

    if (error) {
      toast.error(error.message);
      return;
    }

    if (!data || data.length === 0) {
      toast.error(`No data found!`);
      return;
    }

    const videos = data.map((item) => ({
      ...item.videos,
      added_on: item.created_at,
    })) as unknown as Video[];

    setVideos(videos);
  };

  return (
    <Layout title="History">
      <main className="mx-auto max-w-7xl px-4 py-12 w-full">
        <h1 className="text-3xl font-bold">History</h1>
        <ul className="mt-8 grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {videos.map((video) => (
            <li
              key={video.video_id}
              // className="bg-neutral text-neutral-content p-4 rounded-md hover:bg-neutral-focus"
            >
              <div className="card w-full md:h-64 lg:h-80 bg-base-100 shadow-xl image-full">
                <figure className="relative">
                  <Image src={video.thumbnail} alt={video.title} fill />
                </figure>
                <div className="card-body">
                  <h2 className="card-title">{video.title}</h2>
                  <p>
                    Added on {new Date(video.added_on).toLocaleDateString()}
                  </p>
                  <div className="card-actions justify-end">
                    <Link
                      href={`videos/${video.video_id}`}
                      className="btn btn-primary"
                    >
                      See notes
                    </Link>
                  </div>
                </div>
              </div>
              {/*               
              <Link href={`/videos/${video.video_id}`}>
                <div className="flex gap-4 items-center">
                  <Image
                    src={video.thumbnail}
                    alt={video.title}
                    height={120}
                    width={120}
                  />
                  <div>
                    <h3 className="font-bold">{video.title}</h3>
                    <a href={video.url} target="_blank" className="link">
                      See on YouTube
                    </a>
                  </div>
                </div>
              </Link> */}
            </li>
          ))}
        </ul>
      </main>
    </Layout>
  );
}
