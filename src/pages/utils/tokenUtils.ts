// import NodeCache from "node-cache";
// import axios from "axios";

// const tokenCache = new NodeCache({
//   stdTTL: 3599, // Token lifetime in seconds (just under 1 hour to be safe)
//   checkperiod: 60, // Check for expired keys every 60 seconds
// });

// async function getSpotifyAccessToken() {
//   // 1. Check Cache
//   let accessToken = tokenCache.get<string>('spotifyAccessToken');
//   if (accessToken) {
//       return accessToken;
//   }

//   // 2. If Not in Cache, Fetch
//   try {
//       const response:any = await axios.post('https://accounts.spotify.com/api/token', // ... (same as before)

//       accessToken = response.data.access_token;

//       // 3. Store in Cache
//       tokenCache.set('spotifyAccessToken', accessToken);

//       return accessToken;
//   } catch (error) {
//       // Error handling...
//   }
// }

// async function refreshSpotifyAccessToken() {
//   try {
//       // ... Logic to fetch a new access token using refresh token (if applicable)

//       const newAccessToken = response.data.access_token;

//       // Update cache with new token
//       tokenCache.set('spotifyAccessToken', newAccessToken);

//       return newAccessToken;
//   } catch (error) {
//       // Error handling...
//   }
// }

// // Call refreshSpotifyAccessToken when token is close to expiration (e.g., every 50 minutes)
