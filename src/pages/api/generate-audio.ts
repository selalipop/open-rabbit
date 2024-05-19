import { NextApiRequest, NextApiResponse } from 'next';
import { SunoApi } from '@/lib/sunoApi'; // Ensure the path is correct


const generateAudio = async (req: NextApiRequest, res: NextApiResponse) => {
    if (req.method !== 'POST') {
        return res.status(405).end(); // Method Not Allowed
    }

    const { prompt, make_instrumental, wait_audio, duration } = req.body;

    try {
        const sunoApi = await new SunoApi(process.env.SUNO_COOKIE || '').init();
        const audios = await sunoApi.generate(prompt, make_instrumental, wait_audio);
        
        res.status(200).json(audios);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export default generateAudio;
