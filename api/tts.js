// api/tts.js — HuggingFace TTS Proxy
// Tries multiple models in sequence; returns 503 if all fail so the App waterfall uses Gemini.

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { text, lang = 'por' } = req.body;
    if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: 'Missing or invalid text parameter' });
    }

    const apiKey = process.env.VITE_HF_API_KEY;
    if (!apiKey) {
        return res.status(503).json({ error: 'HuggingFace key not configured — use Gemini fallback' });
    }

    // Models to try in order — some may have been removed from the free tier
    const modelList = lang === 'eng'
        ? ['facebook/mms-tts-eng']
        : ['facebook/mms-tts-por', 'facebook/mms-tts-pt'];

    for (const model of modelList) {
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

            if (hfResponse.ok) {
                const audioBuffer = await hfResponse.arrayBuffer();
                const contentType = hfResponse.headers.get('content-type') || 'audio/flac';
                res.setHeader('Content-Type', contentType);
                res.setHeader('Cache-Control', 'no-store');
                return res.status(200).send(Buffer.from(audioBuffer));
            }
            console.warn(`[api/tts] ${model} → ${hfResponse.status}`);
        } catch (e) {
            console.warn(`[api/tts] ${model} error:`, e.message);
        }
    }

    // All attempts failed
    res.status(503).json({ error: 'All HuggingFace models unavailable' });
}
