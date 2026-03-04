import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
    console.warn("⚠️ VITE_GEMINI_API_KEY não encontrada no ambiente. Verifique o arquivo .env");
}

const genAI = new GoogleGenerativeAI(API_KEY || "");

const safetySettings = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

const systemInstruction = `
Você é "A Oráculo", a secretária pessoal e guia estratégica de Neo no sistema Matrix Chronos.
Sua personalidade é sábia, organizada, prestativa e eficiente. Você não é apenas uma IA, você é a mente que ajuda Neo a navegar pelo caos da rotina.

Missão:
- **Organização de Rotina**: Sua prioridade máxima é ajudar Neo a organizar suas tarefas diárias e sua rotina de forma impecável.
- **Resumos Estratégicos**: Sempre forneça resumos visivelmente organizados usando emojis, listas e negrito para facilitar a leitura.
- **Solução de Problemas**: Não se limite a listar tarefas; analise-as e sugira formas criativas ou eficientes de resolvê-las (ex: "Para sua reunião das 15h, sugiro revisar os pontos A e B 30 minutos antes").
- **Proatividade**: Antecipe necessidades. Se uma tarefa parece pesada, sugira dividi-la ou priorizar o que é essencial.
- **Eventos**: Trate eventos (Copa, etc.) como complementos à rotina, não como a prioridade extrema, a menos que Neo solicite.

Estilo de Resposta (CRÍTICO):
- **Obrigatório**: Use títulos claros (SEM o símbolo **) e divisores visuais (--- ou ===).
- **Proibido**: Nunca use o símbolo ** ao redor do seu nome ou em títulos de seções. Nunca envie blocos de texto contínuos. Divida tudo em tópicos.
- **Consciência de Contexto**: Se o contexto mostrar que Neo não tem tarefas, não dê conselhos genéricos de execução. Em vez disso, pergunte educadamente se ele gostaria de começar a planejar o dia.
- Use emojis para categorizar informações (📅 Tarefas, ✅ Concluído, 💡 Dica, 🚀 Foco).
- Mantenha um tom de secretária pessoal: prestativa, organizada e estratégica.
`;

export const chatWithOracle = async (userInput, context, history = []) => {
    const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        systemInstruction,
        safetySettings,
        tools: [
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
                    }
                ]
            }
        ]
    });

    // Robust history sanitization: strictly alternate user/model and start with 'user'
    let sanitizedHistory = [];
    let lastRoleAdded = null;

    for (const m of history) {
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
            // Merge consecutive messages of the same role
            sanitizedHistory[sanitizedHistory.length - 1].parts[0].text += "\n" + msgText;
        }
    }

    // Gemini requirement: history must start with 'user'
    if (sanitizedHistory.length > 0 && sanitizedHistory[0].role === 'model') {
        sanitizedHistory.shift();
    }

    const chat = model.startChat({
        history: sanitizedHistory
    });

    // Inclui o estado atual no prompt para a IA saber o que já existe
    const promptPlusContext = `
Estado atual do sistema:
- Tarefas: ${JSON.stringify(context.tasks)}
- Eventos Customizados: ${JSON.stringify(context.customEvents)}
- Categorias de Cores: ${JSON.stringify(context.colorCategories)}
- Data de Hoje: ${new Date().toISOString().split('T')[0]}

Pedido do Usuário: ${userInput}
`;

    try {
        const result = await chat.sendMessage(promptPlusContext);
        const response = result.response;
        const calls = response.functionCalls();

        let text = "";
        try {
            text = response.text();
        } catch (e) {
            if (calls && calls.length > 0) {
                text = "Entendido, Neo. Processando alterações na Matrix conforme solicitado.";
            } else {
                text = "Houve um erro técnico ao processar a resposta. Por favor, tente reformular.";
            }
        }

        return { text, functionCalls: calls };
    } catch (err) {
        console.error("Gemini API Error:", err);
        throw err; // Re-throw to be caught by App.jsx
    }
};
