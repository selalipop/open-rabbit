// pages/index.js
import Link from "next/link";
import { useEffect, useRef } from "react";
import { getSpotifyToken, getTokenCachedStatus } from "../spotifyAuthClient";

function Home() {
  // let SpotifyAccessToken = useRef<string>();

  useEffect(() => {
    const init = async () => {
      // find if token cached
      const isTokenCached = await getTokenCachedStatus();
      if (isTokenCached) {
        console.log("Home(): token is cached");
      } else {
        console.log("Home(): token is NOT cached");
        //  get token and send to server
        const token = await getSpotifyToken();
        if (!token) {
          console.error("Home(): token send FAILED");
        } else {
          console.log("Home(): token send Success!");
        }
      }
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
      <Link href="/api/isTokenCached">Authorize</Link>
    </div>
  );
}

export default Home;
