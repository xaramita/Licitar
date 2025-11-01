import React, { useRef } from 'react';
import { FileUploadIcon } from './icons';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  disabled: boolean;
  selectedFile: File | null;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, disabled, selectedFile }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleReset = () => {
     if(fileInputRef.current) {
         fileInputRef.current.value = "";
     }
     onFileSelect(null as any);
  }

  return (
    <div className="w-full bg-white rounded-lg p-6 shadow-lg">
      <h2 className="text-xl font-bold text-gray-900 mb-4">📁 Upload do Edital</h2>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".pdf,.doc,.docx"
        disabled={disabled}
      />
      
      {!selectedFile ? (
        <button
            onClick={handleButtonClick}
            disabled={disabled}
            className="w-full flex flex-col items-center justify-center border-2 border-dashed border-gray-300 hover:border-blue-500 rounded-lg p-8 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
            <FileUploadIcon className="w-12 h-12 text-gray-400 mb-2" />
            <span className="text-blue-600 font-semibold">Clique para carregar o arquivo</span>
            <span className="text-gray-500 text-sm mt-1">PDF, DOC, ou DOCX (Max: 50MB)</span>
        </button>
      ) : (
        <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
            <div>
                <p className="text-gray-800 font-medium">{selectedFile.name}</p>
                <p className="text-gray-500 text-sm">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <button
                onClick={handleReset}
                disabled={disabled}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300 disabled:opacity-50"
            >
                Substituir
            </button>
        </div>
      )}
    </div>
  );
};

export default FileUpload;