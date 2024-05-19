import { useState, FormEvent } from 'react';
import axios from 'axios';
import styles from './index.module.css';

interface AudioInfo {
    id: string;
    title: string;
    image_url: string;
    lyric: string;
    audio_url: string;
    video_url: string;
    created_at: string;
    model_name: string;
    status: string;
    gpt_description_prompt: string;
    prompt: string;
    type: string;
    tags: string;
    duration: string;
}

const Home = () => {
    const [file, setFile] = useState<File | null>(null);
    const [description, setDescription] = useState<string>('');
    const [makeInstrumental, setMakeInstrumental] = useState<boolean>(false);
    const [waitAudio, setWaitAudio] = useState<boolean>(false);
    const [audioData, setAudioData] = useState<AudioInfo[] | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!file) {
            setError('Please upload a file');
            return;
        }

        setLoading(true);
        setError(null);
        setAudioData(null);

        try {
            // Step 1: Upload the image and get the description
            const formData = new FormData();
            formData.append('file', file);
            console.log(file);

            const interpretResponse = await axios.post('/api/interpret-image', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            const { description } = interpretResponse.data;
            setDescription(description);

            // Step 2: Generate music based on the description
            const generateResponse = await axios.post('/api/generate-music', {
                description,
                make_instrumental: makeInstrumental,
                wait_audio: waitAudio,
            });

            setAudioData(generateResponse.data);
        } catch (err) {
            if (err.response && err.response.status === 429) {
                setError('Rate limit exceeded, please try again later');
            } else {
                setError('Failed to process image or generate audio');
            }
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>Generate Music from Image</div>
            <h1 className={styles.title}>Generate Music from Image</h1>
            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formGroup}>
                    <label className={styles.label}>Upload Image:</label>
                    <input type="file" onChange={handleFileChange} className={styles.input} required />
                </div>
                <div className={styles.formGroup}>
                    <label className={styles.checkboxLabel}>
                        <input
                            type="checkbox"
                            checked={makeInstrumental}
                            onChange={(e) => setMakeInstrumental(e.target.checked)}
                            className={styles.checkbox}
                        />
                        Make Instrumental
                    </label>
                </div>
                <div className={styles.formGroup}>
                    <label className={styles.checkboxLabel}>
                        <input
                            type="checkbox"
                            checked={waitAudio}
                            onChange={(e) => setWaitAudio(e.target.checked)}
                            className={styles.checkbox}
                        />
                        Wait for Audio
                    </label>
                </div>
                <button type="submit" disabled={loading} className={styles.button}>Generate</button>
            </form>
            {loading && <p>Generating...</p>}
            {error && <p className={styles.error}>{error}</p>}
            {description && <p>Description: {description}</p>}
            {audioData && (
                <div className={styles.result}>
                    <h2>Generated Audio</h2>
                    <div className={styles.audioSet}>
                        {audioData.map(audio => (
                            <div key={audio.id} className={styles.audioPlayer}>
                                <img src={audio.image_url} alt="Cover Image" />
                                <audio controls>
                                    <source src={audio.audio_url} type="audio/mpeg" />
                                    Your browser does not support the audio element.
                                </audio>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Home;
