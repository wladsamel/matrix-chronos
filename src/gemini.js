// src/gemini.js
// As chamadas para a IA agora são feitas pelo backend (Vercel) por questões de segurança.
// Se estiver rodando localmente (dev), o proxy da Vercel Vite ainda apontará para a api local (se configurada),
// ou precisará da mesma apiKey para a chamada direta (fallback para dev).

export const chatWithOracle = async (userInput, context, history = []) => {
    const isDeployed = !window.location.hostname.includes('localhost');

    // Mapeamento simplificado do histórico para enviar para a API (limitamos tokens/peso)
    const apiHistory = history.map(m => ({ role: m.role, text: m.text }));

    if (isDeployed) {
        // PRODUCTION: Usa a função serverless da Vercel, chave segura no back-end
        const response = await fetch('/api/gemini-chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('matrix_master_key')}`
            },
            body: JSON.stringify({ userInput, context, apiHistory })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erro no servidor: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        return { text: data.text, functionCalls: data.functionCalls };
    } else {
        // LOCAL DEV (Fallback): Se rodando localhost, pode cair aqui ou bater na Vercel se /api tiver proxy.
        try {
            const response = await fetch('/api/gemini-chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('matrix_master_key')}`
                },
                body: JSON.stringify({ userInput, context, apiHistory })
            });

            if (response.ok) {
                const data = await response.json();
                return { text: data.text, functionCalls: data.functionCalls };
            }
        } catch (e) {
            console.warn("Rota /api não encontrada localmente, prosseguindo para o fallback local.");
        }

        // --- LOCAL FALLBACK SE A ROTA DE API FALHAR --- //
        // Importação dinâmica para não quebrar no build de produção
        const { GoogleGenerativeAI } = await import('@google/generative-ai');
        const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

        if (!API_KEY) {
            throw new Error("API_KEY_INVALID: Chave local não encontrada em dev");
        }

        const genAI = new GoogleGenerativeAI(API_KEY);
        // Minimal setup for local dev fallback...
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            tools: [
                {
                    functionDeclarations: [
                        { name: "add_task", description: "Adiciona uma nova tarefa ao calendário. Pode ser para um único dia ou um intervalo.", parameters: { type: "object", properties: { title: { type: "string", description: "Título da tarefa" }, time: { type: "string", description: "Horário (HH:MM)" }, type: { type: "string", enum: ["work", "rest", "matrix"], description: "Tipo da tarefa" }, date: { type: "string", description: "Data de início YYYY-MM-DD" }, endDate: { type: "string", description: "Data de término opcional YYYY-MM-DD" }, note: { type: "string", description: "Nota" } }, required: ["title", "time", "date"] } },
                        { name: "delete_task", description: "Remove uma tarefa existente.", parameters: { type: "object", properties: { id: { type: "number", description: "ID da tarefa a ser removida" } }, required: ["id"] } },
                        { name: "add_custom_event", description: "Cria um novo evento personalizado no calendário.", parameters: { type: "object", properties: { name: { type: "string", description: "Nome do evento" }, date: { type: "string", description: "Data de início YYYY-MM-DD" }, category: { type: "string", description: "Categoria (Pessoal, Trabalho, Esporte, Cultura)" }, borderColor: { type: "string", description: "Cor da borda em HEX (opcional)" } }, required: ["name", "date"] } },
                        { name: "set_day_color", description: "Atribui uma categoria de cor a um dia específico.", parameters: { type: "object", properties: { date: { type: "string", description: "Data YYYY-MM-DD" }, categoryId: { type: "number", description: "ID da categoria de cor" } }, required: ["date", "categoryId"] } },
                        { name: "change_page", description: "Navega o aplicativo para outra tela ou aba visível para o Neo.", parameters: { type: "object", properties: { page: { type: "string", enum: ["overview", "calendar", "events", "tasks", "advisor", "settings"], description: "Aba destino" } }, required: ["page"] } },
                        { name: "update_user_preferences", description: "Salva as preferências, gostos ou hábitos de Neo de forma persistente (ex: 'Neo gosta de F1', 'Acorda às 7h').", parameters: { type: "object", properties: { key: { type: "string", description: "Chave identificadora ou categoria (ex: 'sports', 'routine', 'interests')" }, value: { type: "string", description: "O valor detalhado do hábito ou gosto de Neo" } }, required: ["key", "value"] } },
                        { name: "search_web_for_info", description: "Pesquisa na internet em tempo real por notícias, clima, cotações, dados atualizados ou fatos que você desconhece. Use sempre que o usuário pedir algo sobre o mundo real externo.", parameters: { type: "object", properties: { query: { type: "string", description: "A consulta otimizada para o mecanismo do Google Search" } }, required: ["query"] } }
                    ]
                }
            ]
        });

        let sanitizedHistory = [];
        let lastRoleAdded = null;
        for (const m of history) {
            const role = m.role === 'ai' ? 'model' : 'user';
            const msgText = (m.text || "").trim();
            if (!msgText) continue;
            if (role !== lastRoleAdded) {
                sanitizedHistory.push({ role: role, parts: [{ text: msgText }] });
                lastRoleAdded = role;
            } else {
                sanitizedHistory[sanitizedHistory.length - 1].parts[0].text += "\n" + msgText;
            }
        }
        if (sanitizedHistory.length > 0 && sanitizedHistory[0].role === 'model') {
            sanitizedHistory.shift();
        }

        const chat = model.startChat({ history: sanitizedHistory });
        const result = await chat.sendMessage(`Estado: ${JSON.stringify(context)}. User Preferences: ${JSON.stringify(context.userPreferences || {})}. Pedido: ${userInput}`);
        const response = result.response;
        const calls = response.functionCalls();

        let finalResponseText = "";

        if (calls && calls.length > 0) {
            const searchCall = calls.find(c => c.name === 'search_web_for_info');
            if (searchCall) {
                console.log("[dev-proxy] Oráculo acionando busca web:", searchCall.args.query);
                try {
                    const systemInstructionSearch = `Você tem integração com o Google Search Ativada. OBRIGATÓRIO: Pesquise informações sobre: "${searchCall.args.query}". Extraia apenas FATOS BRUTOS MAIS IMPORTANTES.`;
                    const searchModel = genAI.getGenerativeModel({
                        model: "gemini-2.5-flash",
                        systemInstruction: systemInstructionSearch,
                        tools: [{ googleSearch: {} }]
                    });

                    const sResult = await searchModel.generateContent(
                        `Faça a pesquisa crua e retorne os fatos. Sem enrolação.`
                    );

                    const searchCallText = sResult.response.text();

                    const synthesisResult = await chat.sendMessage(
                        `[RESULTADOS DA BUSCA AUTOMÁTICA NO GOOGLE]:\n${searchCallText}\n\n-> INSTRUÇÃO: Leia estes fatos. Agora, converse comigo (Neo), seja extrovertida e simpática, resuma em 1-2 frases os TÓPICOS principais que acho e me pergunte qual deles eu quero ouvir os detalhes.`
                    );
                    finalResponseText = synthesisResult.response.text();
                } catch (searchErr) {
                    console.error("[dev-proxy] Erro na busca secundária:", searchErr);
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

        const serializedCalls = calls ? calls
            .filter(c => c.name !== 'search_web_for_info')
            .map(call => ({
                name: call.name,
                args: call.args
            })) : [];

        return {
            text,
            functionCalls: serializedCalls
        };
    }
};
