import axios from 'axios';
import querystring from 'querystring';
import cookie from 'cookie';

const stateKey = 'spotify_auth_state';

export default async function handler(req, res) {
    const { code, state } = req.query;
    const cookies = cookie.parse(req.headers.cookie || '');

    if (!state || state !== cookies[stateKey]) {
        res.redirect('/?' + querystring.stringify({ error: 'state_mismatch' }));
        return;
    }

    res.setHeader('Set-Cookie', cookie.serialize(stateKey, '', {
        maxAge: -1,
        path: '/'
    }));

    try {
        const response = await axios.post('https://accounts.spotify.com/api/token', querystring.stringify({
            code: code,
            redirect_uri: process.env.REDIRECT_URI,
            grant_type: 'authorization_code'
        }), {
            headers: {
                'Authorization': 'Basic ' + Buffer.from(process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET).toString('base64'),
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        const { access_token, refresh_token } = response.data;
        res.redirect('/?' + querystring.stringify({
            access_token: access_token,
            refresh_token: refresh_token
        }));
    } catch (error) {
        res.redirect('/?' + querystring.stringify({ error: 'invalid_token' }));
    }
}
