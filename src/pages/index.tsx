// pages/index.js
import Link from "next/link";
import { useEffect, useRef } from "react";
import getSpotifyToken from "../spotifyAuthClient";

function Home() {
  let SpotifyAccessToken = useRef<string>();
  useEffect(() => {
    const init = async () => {
      SpotifyAccessToken.current = await getSpotifyToken();
      // console.log("SpotifyAccessToken=", SpotifyAccessToken?.current);
    };
    init();
  }, []);

  const get_genres = () => {
    const s = "";
    // the application calls this function
  };

  return (
    <div>
      <h1>Welcome to Open Rabbit!</h1>
      {/* <Link href="/api/auth/spotify">Authorize</Link> */}
    </div>
  );
}

export default Home;
