// api/tts.js — Vercel Serverless Function
// Proxies HuggingFace MMS TTS calls from the server to bypass browser CORS restrictions.

export default async function handler(req, res) {
    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { text, lang = 'por' } = req.body;

    if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: 'Missing or invalid text parameter' });
    }

    const apiKey = process.env.VITE_HF_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'HuggingFace API key not configured on server' });
    }

    // Select model based on language
    const MODEL_MAP = {
        por: 'facebook/mms-tts-por',  // Portuguese (Brazil)
        eng: 'facebook/mms-tts-eng',  // English
    };
    const model = MODEL_MAP[lang] || MODEL_MAP.por;

    try {
        const hfResponse = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'Accept': 'audio/flac',
            },
            body: JSON.stringify({ inputs: text }),
        });

        if (!hfResponse.ok) {
            const errText = await hfResponse.text();
            console.error('[api/tts] HuggingFace error:', hfResponse.status, errText);
            return res.status(hfResponse.status).json({ error: `HuggingFace error: ${errText}` });
        }

        const audioBuffer = await hfResponse.arrayBuffer();
        const contentType = hfResponse.headers.get('content-type') || 'audio/flac';

        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'no-store');
        res.status(200).send(Buffer.from(audioBuffer));

    } catch (err) {
        console.error('[api/tts] Unexpected error:', err.message);
        res.status(500).json({ error: err.message });
    }
}
