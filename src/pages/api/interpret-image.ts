import { NextApiRequest, NextApiResponse } from 'next';
import formidable, { File, Files } from 'formidable';
import fs from 'fs';
import path from 'path';
import axios from 'axios';

// Function to encode image to base64
const encodeImage = (filePath: string): string => {
    const imageBuffer = fs.readFileSync(filePath);
    return imageBuffer.toString('base64');
};

// Ensure Next.js doesn't parse the body
export const config = {
    api: {
        bodyParser: false,
    },
};

const uploadDir = path.join(process.cwd(), 'uploads');

// Ensure the upload directory exists
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const interpretImageHandler = async (req: NextApiRequest, res: NextApiResponse) => {
    if (req.method !== 'POST') {
        return res.status(405).end(); // Method Not Allowed
    }

    const form = formidable({
        multiples: false, // We are only uploading one file
        keepExtensions: true,
        uploadDir: uploadDir,
    });

    form.parse(req, async (err, fields, files: Files) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        console.log(files);
        const fileArray = files.file as File[];
        const file = fileArray[0];

        if (!file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const filePath = file.filepath;

        try {
            const base64Image = encodeImage(filePath);

            const apiKey = process.env.OPENAI_API_KEY; // Make sure to set this in your environment variables
            const headers = {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            };

            const payload = {
                "model": "gpt-4o",
                "messages": [
                    {
                      "role": "user",
                      "content": [
                        {
                          "type": "text",
                          "text": "What’s in this image?"
                        },
                        {
                          "type": "image_url",
                          "image_url": {
                            "url": `data:image/jpeg;base64,${base64Image}`
                          }
                        }
                      ]
                    }
                  ],
                "max_tokens": 300
            };

            const response = await axios.post("https://api.openai.com/v1/chat/completions", payload, { headers });
            const description = response.data.choices[0].message.content;

            res.status(200).json({ description });
        } catch (error) {
            if (error.response) {
                console.error(`Error status: ${error.response.status}`);
                console.error(`Error data: ${JSON.stringify(error.response.data)}`);
            } else {
                console.error(`Error message: ${error.message}`);
            }

            if (error.response && error.response.status === 429) {
                res.status(429).json({ error: 'Rate limit exceeded, please try again later' });
            } else if (error.response && error.response.status === 400) {
                res.status(400).json({ error: 'Bad request, please check your input' });
            } else {
                res.status(500).json({ error: 'Failed to interpret image' });
            }
        }
    });
};

export default interpretImageHandler;
