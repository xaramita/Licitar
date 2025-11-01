import React, { useState, useCallback } from 'react';
import { SummaryData, ChatMessage } from './types';
import { summarizeDocument, askQuestion } from './services/geminiService';
import FileUpload from './components/FileUpload';
import SummaryDisplay from './components/SummaryDisplay';
import Chat from './components/Chat';
import { LoadingSpinner, InfoIcon } from './components/icons';

const App: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [fileContent, setFileContent] = useState<string | null>(null);
    const [mimeType, setMimeType] = useState<string | null>(null);
    const [summary, setSummary] = useState<SummaryData | null>(null);
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    
    const [isLoadingSummary, setIsLoadingSummary] = useState(false);
    const [isLoadingChat, setIsLoadingChat] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const resetState = () => {
        setFile(null);
        setFileContent(null);
        setMimeType(null);
        setSummary(null);
        setChatHistory([]);
        setError(null);
        setIsLoadingSummary(false);
        setIsLoadingChat(false);
    };
    
    const handleFileSelect = useCallback((selectedFile: File | null) => {
        if (!selectedFile) {
            resetState();
            return;
        }

        resetState();
        setFile(selectedFile);
        setError(null);

        if (selectedFile.size > 50 * 1024 * 1024) {
            setError("O arquivo excede o limite de 50MB.");
            return;
        }

        const allowedTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
        if (!allowedTypes.includes(selectedFile.type)) {
            setError("Tipo de arquivo inválido. Por favor, carregue um PDF, DOC ou DOCX.");
            return;
        }
        
        setIsLoadingSummary(true);
        const reader = new FileReader();
        reader.onloadend = async () => {
            try {
                const dataUrl = reader.result as string;
                const base64Content = dataUrl.split(',')[1];
                setFileContent(base64Content);
                setMimeType(selectedFile.type);
                
                const generatedSummary = await summarizeDocument(base64Content, selectedFile.type);
                setSummary(generatedSummary);
            } catch (e: any) {
                setError(e.message || "Ocorreu um erro ao processar o arquivo.");
            } finally {
                setIsLoadingSummary(false);
            }
        };
        reader.onerror = () => {
            setError("Falha ao ler o arquivo.");
            setIsLoadingSummary(false);
        };
        reader.readAsDataURL(selectedFile);
    }, []);

    const handleSendMessage = async (message: string) => {
        if (!fileContent || !mimeType) return;
        
        const newHistory: ChatMessage[] = [...chatHistory, { sender: 'user', text: message }];
        setChatHistory(newHistory);
        setIsLoadingChat(true);
        setError(null);
        
        try {
            const aiResponse = await askQuestion(fileContent, mimeType, message, newHistory);
            setChatHistory(prev => [...prev, { sender: 'ai', text: aiResponse }]);
        } catch (e: any) {
             setError(e.message || "Erro ao comunicar com a IA.");
             setChatHistory(prev => [...prev.slice(0, -1)]);
        } finally {
            setIsLoadingChat(false);
        }
    };
    
    return (
        <div className="min-h-screen bg-gray-100 text-gray-800 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="text-center mb-8 no-print">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                        Leitor Inteligente de Editais
                    </h1>
                    <p className="mt-2 text-lg text-gray-600">
                        Carregue um edital, receba um resumo e converse com a IA.
                    </p>
                </header>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-6 no-print" role="alert">
                        <strong className="font-bold">Erro: </strong>
                        <span className="block sm:inline">{error}</span>
                    </div>
                )}
                
                <main className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start printable-container">
                    <div className="space-y-8">
                        <div className="no-print">
                          <FileUpload onFileSelect={handleFileSelect} disabled={isLoadingSummary} selectedFile={file} />
                        </div>
                        {isLoadingSummary && (
                            <div className="bg-white rounded-lg p-6 shadow-lg flex flex-col items-center justify-center h-64 no-print">
                                <LoadingSpinner className="w-16 h-16 text-blue-500" />
                                <p className="mt-4 text-lg text-gray-600 animate-pulse">Analisando o edital... Isso pode levar um momento.</p>
                            </div>
                        )}
                        {!isLoadingSummary && !summary && file && !error && (
                             <div className="bg-white rounded-lg p-6 shadow-lg flex items-center justify-center h-64 no-print">
                                <p className="text-gray-500">Aguardando geração do resumo...</p>
                            </div>
                        )}
                        {!isLoadingSummary && !summary && !file && (
                             <div className="bg-white rounded-lg p-6 shadow-lg text-gray-600 flex items-start space-x-3 no-print">
                                <InfoIcon className="w-6 h-6 text-blue-500 flex-shrink-0 mt-1"/>
                                <div>
                                    <h3 className="font-bold text-gray-900">Como funciona?</h3>
                                    <p className="mt-1">1. Clique em "Clique para carregar o arquivo" para selecionar um edital do seu computador.</p>
                                    <p className="mt-1">2. A IA irá analisar o documento e gerar um resumo técnico automaticamente.</p>
                                    <p className="mt-1">3. Utilize o chat para fazer perguntas específicas sobre o conteúdo do edital.</p>
                                </div>
                            </div>
                        )}
                        {!isLoadingSummary && summary && (
                            <SummaryDisplay summary={summary} />
                        )}
                    </div>
                    
                    <div className="lg:sticky lg:top-8 no-print">
                       <Chat 
                         messages={chatHistory} 
                         onSendMessage={handleSendMessage} 
                         isLoading={isLoadingChat}
                         disabled={!summary || isLoadingSummary}
                       />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default App;