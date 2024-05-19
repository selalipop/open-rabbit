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
    const [prompt, setPrompt] = useState<string>('');
    const [makeInstrumental, setMakeInstrumental] = useState<boolean>(false);
    const [waitAudio, setWaitAudio] = useState<boolean>(false);
    const [duration, setDuration] = useState<number>(30); // Default duration in seconds
    const [audioData, setAudioData] = useState<AudioInfo[] | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setAudioData(null);

        try {
            const response = await axios.post('/api/generate-audio', {
                prompt,
                make_instrumental: makeInstrumental,
                wait_audio: waitAudio,
                duration
            });

            setAudioData(response.data);
        } catch (err) {
            setError('Failed to generate audio');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Generate Audio</h1>
            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formGroup}>
                    <label className={styles.label}>Prompt:</label>
                    <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} required className={styles.textarea} />
                </div>
                <div className={styles.formGroup}>
                    <label className={styles.label}>Duration (seconds):</label>
                    <input 
                        type="number" 
                        value={duration} 
                        onChange={(e) => setDuration(Number(e.target.value))} 
                        className={styles.input} 
                        required 
                    />
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
            {audioData && (
                <div className={styles.result}>
                    <h2>Generated Audio</h2>
                    {audioData.map(audio => (
                        <div key={audio.id} className={styles.audioPlayer}>
                            <img src={audio.image_url} alt="Cover Image" />
                            <audio controls>
                                <source src={audio.audio_url} type="audio/mp3" />
                                Your browser does not support the audio element.
                            </audio>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Home;
