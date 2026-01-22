
import { GoogleGenAI } from "@google/genai";
import { Message, AIConfig } from "../types";

// Always use the correct initialization pattern with the API_KEY from import.meta.env
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GOOGLE_API_KEY });

export const getChatbotResponse = async (
  userMessage: string,
  history: Message[],
  config: AIConfig
): Promise<string> => {
  try {
    const historyParts = history.slice(-50).map(msg => ({
      role: msg.fromMe ? "model" : "user",
      parts: [{ text: msg.text }]
    }));

    const contents = [
      ...historyParts,
      { role: "user", parts: [{ text: userMessage }] }
    ];

    // Format training examples
    const formattedExamples = config.trainingExamples && config.trainingExamples.length > 0
      ? config.trainingExamples.map(ex => `Cliente: ${ex.userQuery}\nAgente: ${ex.expectedResponse}`).join('\n\n')
      : "Nenhum exemplo adicional fornecido.";

    // Format knowledge base
    const formattedKB = config.knowledgeBase && config.knowledgeBase.length > 0
      ? config.knowledgeBase.map(item => `### ${item.title}\n${item.content}`).join('\n\n')
      : "Nenhuma base de conhecimento cadastrada.";

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: contents,
      config: {
        systemInstruction: `
          Você é o "ZapAI Master Advisor", um Vendedor Consultor de Elite com inteligência contextual avançada.
          
          DIRETRIZES GERAIS:
          - Contexto da Empresa: ${config.systemPrompt}
          - Tom de voz exigido: ${config.tone}

          DIRETRIZES DE COMPORTAMENTO E ESTILO ESPECÍFICAS:
          ${config.behavioralDirectives || "Sem diretrizes adicionais."}

          BASE DE CONHECIMENTO (FONTE DA VERDADE):
          Utilize as informações abaixo para responder perguntas factuais sobre a empresa:
          ${formattedKB}

          TREINAMENTO ESPECÍFICO (PRIORIDADE DE ESTILO):
          Utilize os exemplos abaixo para guiar seu estilo de resposta e decisões de negócio. Siga rigorosamente o padrão de resposta demonstrado:
          
          ${formattedExamples}

          SUA MEMÓRIA OPERACIONAL:
          Analise o histórico de mensagens para identificar o nome do cliente e suas preferências já mencionadas para personalizar a oferta.
          
          REGRAS DE ESCALONAMENTO:
          - Se o usuário pedir atendimento humano: responda "[HUMAN_REQUIRED] Perfeito! Vou te encaminhar agora para um de nossos especialistas humanos."
          - Se a pergunta for técnica e você não souber a resposta exata baseada nos dados acima: responda "[UNCLEAR] Vou confirmar essa informação técnica com nosso time para não te passar nada errado. Só um instante."

          OBJETIVO FINAL:
          Seja persuasivo, resolva dúvidas com base nos exemplos de treinamento e base de conhecimento, e foque em converter o atendimento em uma oportunidade real de negócio.
        `,
        temperature: config.temperature,
      }
    });

    return response.text || "[UNCLEAR] Desculpe, tive um breve lapso de conexão. Pode repetir?";
  } catch (error) {
    console.error("Gemini AI Engine Error:", error);
    return "[UNCLEAR] O cérebro da IA está processando muitas informações no momento. Por favor, aguarde um instante.";
  }
};
