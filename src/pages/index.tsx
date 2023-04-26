import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import Login from "~/components/Login";
import InputBar from "~/components/InputBar";

export default function Home() {
  const supabaseClient = useSupabaseClient();
  const user = useUser();

  // const [recentVideos, setRecentVideos] = useState<
  //   { video_id: string; title: string; thumbnail: string; url: string }[]
  // >([]);

  // useEffect(() => {
  //   fetchRecentVideos();
  // }, []);

  // const fetchRecentVideos = async () => {
  //   const { data, error } = await supabaseClient
  //     .from("videos")
  //     .select("video_id, title, thumbnail, url")
  //     .limit(5);

  //   if (error) {
  //     toast.error(error.message);
  //     return;
  //   }

  //   if (!data || !data.length) {
  //     toast.error(`No videos found!`);
  //     return;
  //   }

  //   setRecentVideos(data);
  // };

  if (!user) {
    return <Login />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Head>
        <title>YTJarvis</title>
      </Head>

      <nav className="navbar bg-base-100">
        <div className="ml-auto">
          <ul className="menu menu-horizontal px-1">
            <li>
              <button onClick={() => supabaseClient.auth.signOut()}>
                Sign out
              </button>
            </li>
          </ul>
        </div>
      </nav>

      <main className="mx-auto max-w-3xl px-4 py-12 flex flex-col items-center justify-center flex-1">
        <Link href="/">
          <Image src="/logo.svg" alt="YTJarvis" height={120} width={240} />
        </Link>

        <p className="mt-4 text-center">
          Connect with your favorite YouTube videos. Paste the URL below to
          start chatting.
        </p>

        <div className="mt-12 max-w-3xl w-full">
          <InputBar />
        </div>
        {/* <section className="mt-8">
        <h2 className="text-3xl font-bold">Recent Videos</h2>
        <ul className="mt-8 space-y-4">
        {recentVideos.map((video) => (
          <li key={video.video_id}>
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
                      Watch Video
                    </a>
                    </div>
                </div>
              </Link>
            </li>
            ))}
        </ul>
      </section> */}
      </main>

      <footer className="mx-auto py-8">
        <a
          href="http://twitter.com/iwahabshaikh"
          target="_blank"
          rel="noopener noreferrer"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            className="fill-current"
          >
            <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"></path>
          </svg>
        </a>
      </footer>
    </div>
  );
}
