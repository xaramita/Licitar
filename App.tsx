import React, { useState } from 'react';
import FileUpload from './components/FileUpload';
import SummaryDisplay from './components/SummaryDisplay';
import Chat from './components/Chat';
import { summarizeDocument, askQuestion } from './services/geminiService';
import { SummaryData, ChatMessage } from './types';
import { MagnifyingGlassIcon } from './components/icons';

function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<{ data: string; mimeType: string } | null>(null);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isAnswering, setIsAnswering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // remove "data:mime/type;base64," prefix
        resolve(result.split(',')[1]);
      };
      reader.onerror = (error) => reject(error);
    });

  const handleFileSelect = async (file: File | null) => {
    // Reset state
    setSelectedFile(null);
    setFileContent(null);
    setSummary(null);
    setChatMessages([]);
    setError(null);

    if (!file) {
      return;
    }
    
    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      setError("O arquivo excede o limite de 50MB.");
      return;
    }

    setSelectedFile(file);
    setIsSummarizing(true);
    
    try {
      const base64String = await fileToBase64(file);
      const content = { data: base64String, mimeType: file.type };
      setFileContent(content);

      const summaryData = await summarizeDocument(content.data, content.mimeType);
      setSummary(summaryData);

      setChatMessages([
        { sender: 'ai', text: 'Resumo do edital gerado. Agora você pode fazer perguntas sobre o documento.' }
      ]);

    } catch (e: any) {
      setError(e.message || "Ocorreu um erro ao processar o arquivo.");
      setFileContent(null);
      setSelectedFile(null);
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleSendMessage = async (message: string) => {
    if (!fileContent) {
      setError("Nenhum arquivo foi processado para o chat.");
      return;
    }
    
    const newUserMessage: ChatMessage = { sender: 'user', text: message };
    setChatMessages(prev => [...prev, newUserMessage]); // Add user message to UI

    setIsAnswering(true);
    setError(null);
    
    try {
        // Pass the history *before* this new user message to the API call.
        const aiResponse = await askQuestion(fileContent.data, fileContent.mimeType, message, chatMessages);
        const newAiMessage: ChatMessage = { sender: 'ai', text: aiResponse };
        setChatMessages(prev => [...prev, newAiMessage]); // Add AI response. `prev` now includes the user's message.
    } catch (e: any) {
        setError(e.message || "Ocorreu um erro ao obter a resposta da IA.");
        const errorMessage: ChatMessage = { sender: 'ai', text: 'Desculpe, não consegui processar sua pergunta.' };
        setChatMessages(prev => [...prev, errorMessage]); // Add error message.
    } finally {
        setIsAnswering(false);
    }
  };

  const isLoading = isSummarizing || isAnswering;

  return (
    <div className="bg-gray-100 min-h-screen p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="bg-white p-6 rounded-xl shadow-md mb-8 flex items-center space-x-4">
            <div className="bg-blue-600 p-3 rounded-full text-white">
                <MagnifyingGlassIcon className="w-8 h-8" />
            </div>
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Analisador de Editais com IA</h1>
                <p className="text-gray-600 mt-1">
                    Faça upload de um edital para gerar um resumo e conversar com uma IA.
                </p>
            </div>
        </header>

        {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-6" role="alert">
                <strong className="font-bold">Erro: </strong>
                <span className="block sm:inline">{error}</span>
            </div>
        )}

        <main className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-8">
            <FileUpload 
              onFileSelect={handleFileSelect} 
              disabled={isLoading}
              selectedFile={selectedFile}
            />
            <SummaryDisplay summary={summary} isLoading={isSummarizing} />
          </div>
          <div>
            <Chat
              messages={chatMessages}
              onSendMessage={handleSendMessage}
              isLoading={isAnswering}
              disabled={!summary || isLoading}
            />
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;