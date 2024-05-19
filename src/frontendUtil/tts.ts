async function fetchTTS(text: string, voiceId: string): Promise<string> {
    const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            text: text,
            voiceId: voiceId,
        }),
    });

    const data = await response.json();
    if (!response.ok || !data.audio) {
        throw new Error('Failed to fetch TTS audio');
    }

    return data.audio;
}

export async function playTextToSpeech(text: string, voiceId: string) {
    try {
        const base64Audio = await fetchTTS(text, voiceId);

        // Convert Base64 to Blob
        const byteString = atob(base64Audio);
        const arrayBuffer = new ArrayBuffer(byteString.length);
        const bufferView = new Uint8Array(arrayBuffer);
        for (let i = 0; i < byteString.length; i++) {
          bufferView[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([arrayBuffer], { type: 'audio/wav' });
    
        // Create a URL from the Blob
        const audioUrl = URL.createObjectURL(blob);
        console.log('Playing TTS:', audioUrl);
        const audio = new Audio(audioUrl);
        audio.play();
    } catch (error) {
        console.error('Error playing TTS:', error);
    }
}
