// api/gemini-tts.js — Vercel Serverless Function
// Proxies Gemini 2.5 Flash TTS calls server-side, handles PCM→WAV conversion,
// and returns a playable WAV audio blob to the browser.

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { text, voiceName = 'Aoede' } = req.body;

    if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: 'Missing or invalid text parameter' });
    }

    const apiKey = process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'Gemini API key not configured on server' });
    }

    const VALID_VOICES = ['Aoede', 'Charon', 'Fenrir', 'Kore', 'Puck'];
    const voice = VALID_VOICES.includes(voiceName) ? voiceName : 'Aoede';

    try {
        const geminiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text }] }],
                    generationConfig: {
                        response_modalities: ['AUDIO'],
                        speech_config: {
                            voice_config: { prebuilt_voice_config: { voice_name: voice } }
                        }
                    }
                }),
            }
        );

        if (!geminiResponse.ok) {
            const errText = await geminiResponse.text();
            console.error('[api/gemini-tts] Gemini error:', geminiResponse.status, errText);
            return res.status(geminiResponse.status).json({ error: errText });
        }

        const data = await geminiResponse.json();
        const audioB64 = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        const mimeType = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.mimeType || 'audio/pcm';

        if (!audioB64) {
            return res.status(500).json({ error: 'No audio data in Gemini response' });
        }

        const pcmBuffer = Buffer.from(audioB64, 'base64');

        // Build WAV header for raw PCM data (Gemini returns 24kHz 16-bit mono)
        if (mimeType.includes('pcm') || mimeType.includes('L16')) {
            const sampleRate = 24000;
            const numChannels = 1;
            const bitsPerSample = 16;
            const pcmLength = pcmBuffer.length;
            const wavHeader = Buffer.alloc(44);

            wavHeader.write('RIFF', 0);
            wavHeader.writeUInt32LE(36 + pcmLength, 4);
            wavHeader.write('WAVE', 8);
            wavHeader.write('fmt ', 12);
            wavHeader.writeUInt32LE(16, 16);
            wavHeader.writeUInt16LE(1, 20);  // PCM
            wavHeader.writeUInt16LE(numChannels, 22);
            wavHeader.writeUInt32LE(sampleRate, 24);
            wavHeader.writeUInt32LE(sampleRate * numChannels * bitsPerSample / 8, 28);
            wavHeader.writeUInt16LE(numChannels * bitsPerSample / 8, 32);
            wavHeader.writeUInt16LE(bitsPerSample, 34);
            wavHeader.write('data', 36);
            wavHeader.writeUInt32LE(pcmLength, 40);

            const wavFile = Buffer.concat([wavHeader, pcmBuffer]);
            res.setHeader('Content-Type', 'audio/wav');
            res.setHeader('Cache-Control', 'no-store');
            return res.status(200).send(wavFile);
        }

        // Non-PCM format — pass through as-is
        res.setHeader('Content-Type', mimeType);
        res.setHeader('Cache-Control', 'no-store');
        res.status(200).send(pcmBuffer);

    } catch (err) {
        console.error('[api/gemini-tts] Unexpected error:', err.message);
        res.status(500).json({ error: err.message });
    }
}
