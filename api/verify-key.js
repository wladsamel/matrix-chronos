// api/verify-key.js - Vercel Serverless Function
// Simples endpoint para testar se a chave mestra (Master Password) inserida pelo usuário é válida
// antes de destravar a interface da Matrix Chronos.

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { key } = req.body;
    const serverKey = process.env.MATRIX_MASTER_KEY;

    if (!serverKey) {
        // Se a chave não estiver configurada no servidor, avisamos
        return res.status(500).json({ error: 'MATRIX_MASTER_KEY não configurada no servidor.' });
    }

    // Validação
    if (key === serverKey) {
        return res.status(200).json({ success: true, message: 'Interface Destravada.' });
    } else {
        return res.status(401).json({ error: 'Acesso Negado. Chave Mestra Incorreta.' });
    }
}
