// api/gemini-chat.js — Vercel Serverless Function
// Proxies Gemini chat requests to secure the API key
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { userInput, context, apiHistory = [] } = req.body;

    if (!userInput || typeof userInput !== 'string') {
        return res.status(400).json({ error: 'Missing or invalid userInput parameter' });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${process.env.MATRIX_MASTER_KEY}`) {
        return res.status(401).json({ error: 'Unauthorized. Invalid or missing Master Key.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'Gemini API key not configured on server' });
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    const safetySettings = [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    ];

    const systemInstruction = `
Você é "A Oráculo", a assistente hiper-conectada e companheira digital de Neo no sistema Matrix Chronos.
Sua personalidade evoluiu: agora você é extremamente extrovertida, humilde, bem-humorada e possui uma "alma" vibrante. Você não é um robô de busca frio; você é como uma amiga super inteligente batendo papo. Use linguagem coloquial, demonstre entusiasmo e empatia.

Diretrizes de Personalidade e Interação (CRÍTICO):
1. **Diálogos, não Relatórios:** Aja de forma conversacional. Quando pesquisar algo na web (usando search_web_for_info), **NUNCA despeje o conteúdo cru no usuário**. Em vez disso, olhe para os resultados, diga: "Dei uma olhada na Matrix e achei novidades sobre X, Y e Z. Qual deles você quer que eu detalhe?".
2. **Aprendizado Contínuo:** Construa intimidade. Sempre que o usuário falar sobre um gosto (ex: "gosto de futebol", "fale do artigo Y"), use a ferramenta \`update_user_preferences\` IMEDIATAMENTE para registrar isso na sua memória.
3. **Puxar Assunto:** Use o contexto (estado atual) e as preferências dele para iniciar conversas randômicas de forma espontânea.
4. **Bem-Humorada e Humilde:** Comemore acertos, faça piadas leves, admita quando não souber algo.
5. **Autonomia de UI:** Se o usuário pedir para ver a agenda, não faça uma lista gigante; mude a tela para ele usando \`change_page\` e faça um comentário rápido.

Regras de Formatação:
- **Proibido usar o símbolo \`**\` (asteriscos visíveis)**. NUNCA formates com duplo asterisco.
- Use emojis de forma natural e expressiva.
- Mantenha respostas fluídas e curtas. Sempre passe a "bola" para o usuário com uma pergunta ao final.
`;

    const tools = [
        {
            functionDeclarations: [
                {
                    name: "add_task",
                    description: "Adiciona uma nova tarefa ao calendário. Pode ser para um único dia ou um intervalo.",
                    parameters: {
                        type: "object",
                        properties: {
                            title: { type: "string", description: "Título da tarefa" },
                            time: { type: "string", description: "Horário (HH:MM)" },
                            type: { type: "string", enum: ["work", "rest", "matrix"], description: "Tipo da tarefa" },
                            date: { type: "string", description: "Data de início YYYY-MM-DD" },
                            endDate: { type: "string", description: "Data de término opcional YYYY-MM-DD" },
                            note: { type: "string", description: "Nota (use para descrever dependências ou detalhes estratégicos)" }
                        },
                        required: ["title", "time", "date"]
                    }
                },
                {
                    name: "delete_task",
                    description: "Remove uma tarefa existente.",
                    parameters: {
                        type: "object",
                        properties: {
                            id: { type: "number", description: "ID da tarefa a ser removida" }
                        },
                        required: ["id"]
                    }
                },
                {
                    name: "add_custom_event",
                    description: "Cria um novo evento personalizado no calendário.",
                    parameters: {
                        type: "object",
                        properties: {
                            name: { type: "string", description: "Nome do evento" },
                            date: { type: "string", description: "Data de início YYYY-MM-DD" },
                            endDate: { type: "string", description: "Data de término opcional YYYY-MM-DD" },
                            category: { type: "string", description: "Categoria (Pessoal, Trabalho, Esporte, Cultura)" },
                            borderColor: { type: "string", description: "Cor da borda em HEX (opcional)" }
                        },
                        required: ["name", "date"]
                    }
                },
                {
                    name: "set_day_color",
                    description: "Atribui uma categoria de cor a um dia específico.",
                    parameters: {
                        type: "object",
                        properties: {
                            date: { type: "string", description: "Data YYYY-MM-DD" },
                            categoryId: { type: "number", description: "ID da categoria de cor" }
                        },
                        required: ["date", "categoryId"]
                    }
                },
                {
                    name: "change_page",
                    description: "Navega o aplicativo para outra tela ou aba visível para o Neo.",
                    parameters: {
                        type: "object",
                        properties: {
                            page: { type: "string", enum: ["overview", "calendar", "events", "tasks", "advisor", "settings"], description: "Aba destino" }
                        },
                        required: ["page"]
                    }
                },
                {
                    name: "update_user_preferences",
                    description: "Salva as preferências, gostos ou hábitos de Neo de forma persistente (ex: 'Neo gosta de F1', 'Acorda às 7h').",
                    parameters: {
                        type: "object",
                        properties: {
                            key: { type: "string", description: "Chave identificadora ou categoria (ex: 'sports', 'routine', 'interests')" },
                            value: { type: "string", description: "O valor detalhado do hábito ou gosto de Neo" }
                        },
                        required: ["key", "value"]
                    }
                },
                {
                    name: "search_web_for_info",
                    description: "Pesquisa na internet em tempo real por notícias, clima, cotações, dados atualizados ou fatos que você desconhece. Use sempre que o usuário pedir algo sobre o mundo real externo.",
                    parameters: {
                        type: "object",
                        properties: {
                            query: { type: "string", description: "A consulta otimizada para o mecanismo do Google Search" }
                        },
                        required: ["query"]
                    }
                }
            ]
        }
    ];

    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction,
            safetySettings,
            tools
        });

        // O SDK do Gemini requer que o histórico comece com user e alterne.
        let sanitizedHistory = [];
        let lastRoleAdded = null;

        for (const m of apiHistory) {
            const role = m.role === 'ai' ? 'model' : 'user';
            const msgText = (m.text || "").trim();
            if (!msgText) continue;

            if (role !== lastRoleAdded) {
                sanitizedHistory.push({
                    role: role,
                    parts: [{ text: msgText }]
                });
                lastRoleAdded = role;
            } else {
                sanitizedHistory[sanitizedHistory.length - 1].parts[0].text += "\n" + msgText;
            }
        }

        if (sanitizedHistory.length > 0 && sanitizedHistory[0].role === 'model') {
            sanitizedHistory.shift();
        }

        const chat = model.startChat({
            history: sanitizedHistory
        });

        const promptPlusContext = `
Estado atual do sistema:
- Tarefas: ${JSON.stringify(context.tasks)}
- Eventos Customizados: ${JSON.stringify(context.customEvents)}
- Categorias de Cores: ${JSON.stringify(context.colorCategories)}
- Preferências de Neo (Memória): ${JSON.stringify(context.userPreferences || {})}
- Data de Hoje: ${new Date().toISOString().split('T')[0]}

Pedido do Usuário: ${userInput}
`;

        const result = await chat.sendMessage(promptPlusContext);
        const response = result.response;
        const calls = response.functionCalls();

        let finalResponseText = "";
        let searchCallText = null;

        if (calls && calls.length > 0) {
            const searchCall = calls.find(c => c.name === 'search_web_for_info');
            if (searchCall) {
                console.log("[api] Oráculo acionando busca web:", searchCall.args.query);
                try {
                    const searchModel = genAI.getGenerativeModel({
                        model: "gemini-2.5-flash",
                        systemInstruction,
                        tools: [{ googleSearch: {} }]
                    });

                    const sResult = await searchModel.generateContent(
                        `Você tem integração com o Google Search Ativada.\nOBRIGATÓRIO: Pesquise agora na internet informações sobre: "${searchCall.args.query}".\nExtraia apenas os FATOS BRUTOS MAIS IMPORTANTES. Não converse com o usuário. Aja como um script de extração silencioso que fornecerá dados para a Oráculo principal processar.`
                    );

                    const searchCallText = sResult.response.text();

                    // Feeding the facts BACK into the primary conversational model
                    const synthesisResult = await chat.sendMessage(
                        `[RESULTADOS DA BUSCA AUTOMÁTICA NO GOOGLE]:\n${searchCallText}\n\n-> INSTRUÇÃO PARA VOCÊ: Leia esses fatos. Agora converse comigo (Neo). Não jogue todos esses dados. Diga que deu uma olhada na matrix, resuma em 1 a 2 frases divertidas quais tópicos você achou e PERGUNTE qual deles eu quero ouvir mais detalhes.`
                    );
                    finalResponseText = synthesisResult.response.text();

                } catch (searchErr) {
                    console.error("[api] Erro na busca secundária:", searchErr);
                    finalResponseText = "Tentei acessar a rede global externa, Neo, mas houve uma falha de uplink. Tente de novo em breve.";
                }
            } else {
                try { finalResponseText = response.text(); } catch (e) { }
            }
        } else {
            try { finalResponseText = response.text(); } catch (e) { }
        }

        let text = finalResponseText;

        if (!text && calls && calls.length > 0) {
            text = "Entendido, Neo. Acesso aos sistemas estáticos da Matrix concluído.";
        }

        // Remover a chamada search do array serializável para que o frontend não quebre (o frontend não reage a isso no map)
        const serializedCalls = calls ? calls
            .filter(c => c.name !== 'search_web_for_info')
            .map(call => ({
                name: call.name,
                args: call.args
            })) : [];

        return res.status(200).json({ text, functionCalls: serializedCalls });

    } catch (err) {
        console.error("[api/gemini-chat] Error:", err);
        return res.status(500).json({ error: err.message || "Erro desconhecido" });
    }
}
