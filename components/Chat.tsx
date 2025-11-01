import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { SendIcon, LoadingSpinner } from './icons';

interface ChatProps {
    messages: ChatMessage[];
    onSendMessage: (message: string) => void;
    isLoading: boolean;
    disabled: boolean;
}

/**
 * Parses a text and highlights parts that match a given highlight string.
 * @param text The text to be rendered.
 * @param highlight The string containing keywords to highlight (e.g., user's question).
 * @returns A React.ReactNode with highlighted text.
 */
const getHighlightedText = (text: string, highlight: string): React.ReactNode => {
    if (!highlight.trim()) {
        return text;
    }

    // Common Portuguese stop words and question phrases to ignore for better matching.
    const stopWords = new Set([
        'a', 'o', 'e', 'é', 'de', 'do', 'da', 'em', 'um', 'uma', 'para', 'com', 'não',
        'os', 'as', 'dos', 'das', 'ao', 'aos', 'pelo', 'pela', 'qual', 'quais', 'quem',
        'onde', 'quando', 'como', 'por', 'que', 'se', 'me', 'fale', 'sobre', 'existe',
        'há', 'são', 'informe', 'diga', 'resumo', 'explique'
    ]);

    const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Extract significant keywords from the user's question.
    const keywords = highlight
        .toLowerCase()
        .split(/[\s,.;?]+/) // Split by various delimiters
        .filter(word => word.length > 2 && !stopWords.has(word));

    if (keywords.length === 0) {
        return text;
    }

    // Create a regex to find all occurrences of the keywords, case-insensitive, as whole words.
    const regex = new RegExp(`\\b(${keywords.map(escapeRegExp).join('|')})\\b`, 'gi');
    
    const parts = text.split(regex);
    const matches = text.match(regex) || []; // Ensure matches is not null if no match is found.

    // Interleave the non-matching parts with the highlighted matching parts.
    return (
        <span>
            {parts.map((part, i) => (
                <React.Fragment key={i}>
                    {part}
                    {i < matches.length && (
                        <strong className="bg-blue-100 text-blue-800 font-semibold px-1 rounded-md">
                            {matches[i]}
                        </strong>
                    )}
                </React.Fragment>
            ))}
        </span>
    );
};


const Chat: React.FC<ChatProps> = ({ messages, onSendMessage, isLoading, disabled }) => {
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages, isLoading]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() && !isLoading) {
            onSendMessage(input.trim());
            setInput('');
        }
    };

    return (
        <div className="w-full bg-white rounded-lg shadow-lg flex flex-col h-[70vh] max-h-[800px]">
            <div className="p-4 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">💬 Chat com a IA</h2>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {messages.map((msg, index) => {
                    let lastUserQuestion = '';
                    if (msg.sender === 'ai') {
                         // Find the last user message before this AI message to use for highlighting.
                        for (let i = index - 1; i >= 0; i--) {
                            if (messages[i].sender === 'user') {
                                lastUserQuestion = messages[i].text;
                                break;
                            }
                        }
                    }
                    
                    return (
                        <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-2xl ${msg.sender === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-200 text-gray-800 rounded-bl-none'}`}>
                                <div className="whitespace-pre-wrap">
                                    {msg.sender === 'ai' && lastUserQuestion ? getHighlightedText(msg.text, lastUserQuestion) : msg.text}
                                </div>
                            </div>
                        </div>
                    );
                })}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-gray-200 text-gray-800 rounded-2xl rounded-bl-none px-4 py-3 inline-flex items-center">
                            <LoadingSpinner className="w-5 h-5 mr-2" />
                            <span>Analisando...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-gray-200">
                <form onSubmit={handleSend} className="flex items-center space-x-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={disabled ? "Carregue um edital para começar" : "Faça uma pergunta..."}
                        className="flex-1 bg-gray-100 text-gray-900 rounded-full py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        disabled={disabled || isLoading}
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isLoading || disabled}
                        className="bg-blue-600 text-white rounded-full p-3 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                        <SendIcon className="w-5 h-5" />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Chat;