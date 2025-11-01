import { GoogleGenAI, Type } from "@google/genai";
import { SummaryData, ChatMessage } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const summarySchema: any = {
    type: Type.OBJECT,
    properties: {
        licitante: {
            type: Type.OBJECT,
            properties: {
                nome: { type: Type.STRING, description: 'Nome do órgão licitante.' },
                cnpj: { type: Type.STRING, description: 'CNPJ do órgão licitante.' },
                endereco: { type: Type.STRING, description: 'Endereço completo.' },
                telefone: { type: Type.STRING, description: 'Telefone de contato.' },
                email: { type: Type.STRING, description: 'Email de contato.' },
                responsavel: { type: Type.STRING, description: 'Nome do responsável ou pregoeiro.' },
            },
        },
        objetoLicitacao: { type: Type.STRING, description: 'Descrição completa do objeto da licitação.' },
        tipoDisputa: { type: Type.STRING, description: 'Modalidade da licitação (ex: Pregão Eletrônico).' },
        portal: { type: Type.STRING, description: 'Portal onde ocorre a licitação (ex: Comprasnet).' },
        numeroProcesso: { type: Type.STRING, description: 'Número do processo ou da licitação.' },
        dataAbertura: { type: Type.STRING, description: 'Data e hora de abertura das propostas.' },
        dataDisputa: { type: Type.STRING, description: 'Data e hora do início da disputa.' },
        dataEntrega: { type: Type.STRING, description: 'Prazo ou data para entrega do objeto.' },
        dataPagamento: { type: Type.STRING, description: 'Condições ou prazo para pagamento.' },
        validadeProposta: { type: Type.STRING, description: 'Prazo de validade da proposta.' },
        requisitosHabilitacao: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Lista dos principais documentos e requisitos para habilitação.'
        },
        criterioJulgamento: { type: Type.STRING, description: 'Critério de julgamento (ex: Menor Preço).' },
        itensLicitados: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    item: { type: Type.STRING, description: 'Número do item.' },
                    descricao: { type: Type.STRING, description: 'Descrição resumida do item.' },
                    quantidade: { type: Type.STRING, description: 'Quantidade do item.' },
                    unidade: { type: Type.STRING, description: 'Unidade de medida do item.' },
                },
            },
        },
        outrosDados: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Lista de outros dados relevantes como garantias, penalidades, local de execução, etc.'
        },
    },
};

export const summarizeDocument = async (fileContent: string, mimeType: string): Promise<SummaryData> => {
    try {
        // Create a deep copy of the schema to modify it for the API call without affecting the original object.
        const schemaForApi = JSON.parse(JSON.stringify(summarySchema));
        // Remove the 'itensLicitados' property as per the new requirement.
        delete schemaForApi.properties.itensLicitados;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { text: "Você é um especialista em análise de editais de licitação. Sua tarefa é extrair as informações chave do documento fornecido, conforme o schema JSON. É crucial que você detalhe **todos os requisitos de habilitação** encontrados. **Não extraia a lista de itens individuais da licitação**. Se uma informação não for encontrada, retorne uma string vazia ou um array vazio para o campo correspondente." },
                    {
                        inlineData: {
                            data: fileContent,
                            mimeType: mimeType
                        }
                    }
                ]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: schemaForApi,
            },
        });
        
        const jsonString = response.text.trim();
        const summary = JSON.parse(jsonString);
        return summary as SummaryData;

    } catch (error) {
        console.error("Error summarizing document:", error);
        throw new Error("Não foi possível gerar o resumo do edital.");
    }
};

export const askQuestion = async (fileContent: string, mimeType: string, question: string, chatHistory: ChatMessage[]): Promise<string> => {
    const historyParts = chatHistory.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
    }));

    const systemInstruction = "Você é um assistente de IA focado em responder perguntas sobre um edital de licitação. Responda APENAS com base no conteúdo do documento fornecido. Seja formal, técnico e claro. Se a informação solicitada não estiver presente no documento, responda EXATAMENTE com a frase: 'Essa informação não foi encontrada no edital enviado.' Não adicione nenhuma outra informação ou explicação se a resposta não for encontrada.";

    try {
        const chat = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction: systemInstruction,
            },
            history: historyParts
        });

        // The `sendMessage` method takes a `SendMessageRequest` object.
        // The `message` property of this object can be a string or an array of `Part` objects for multipart content.
        const response = await chat.sendMessage({
            message: [
                { text: `Contexto do edital fornecido como um anexo. Pergunta do usuário: "${question}"` },
                {
                    inlineData: {
                        data: fileContent,
                        mimeType: mimeType,
                    },
                },
            ]
        });

        return response.text;

    } catch (error) {
        console.error("Error asking question:", error);
        throw new Error("Ocorreu um erro ao processar sua pergunta.");
    }
};
