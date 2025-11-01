import React, { useState } from 'react';
import { SummaryData } from '../types';
import { DownloadIcon, LoadingSpinner, ClipboardListIcon } from './icons';

// Inform TypeScript about the libs attached to the window object
declare global {
  interface Window {
    jspdf: any;
  }
}

interface SummaryDisplayProps {
  summary: SummaryData | null;
  isLoading: boolean;
}

const SummaryDisplay: React.FC<SummaryDisplayProps> = ({ summary, isLoading }) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPDF = () => {
    if (!summary || !window.jspdf) {
      console.error("PDF export dependencies not loaded or no summary data.");
      alert("Não foi possível exportar o PDF. Carregue um arquivo primeiro.");
      return;
    }

    setIsExporting(true);

    try {
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 15;
      const contentWidth = pageWidth - margin * 2;
      let yPos = 20;

      const checkPageBreak = (neededHeight: number) => {
        if (yPos + neededHeight > pdf.internal.pageSize.getHeight() - margin) {
          pdf.addPage();
          yPos = margin;
        }
      };

      const addSectionTitle = (title: string) => {
        checkPageBreak(15);
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text(title, margin, yPos);
        yPos += 7;
        pdf.setDrawColor(200, 200, 200);
        pdf.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 8;
      };
      
      const addInfo = (label: string, value: string | undefined | null) => {
        if (!value) return;
        pdf.setFontSize(11);
        
        const fixedIndent = 40; // mm for the value part
        const valueLines = pdf.splitTextToSize(value, contentWidth - fixedIndent);
        checkPageBreak(valueLines.length * 5 + 3);

        pdf.setFont('helvetica', 'bold');
        pdf.text(`${label}:`, margin, yPos);
        
        pdf.setFont('helvetica', 'normal');
        pdf.text(valueLines, margin + fixedIndent, yPos);
        
        yPos += valueLines.length * 5 + 3;
      };

      const addList = (title: string, items: string[] | undefined) => {
           if (!items || items.length === 0) return;
           addSectionTitle(title);
           pdf.setFontSize(11);
           pdf.setFont('helvetica', 'normal');
           items.forEach(item => {
               const lines = pdf.splitTextToSize(item, contentWidth - 5);
               checkPageBreak(lines.length * 5 + 2);
               pdf.text('•', margin, yPos + 4);
               pdf.text(lines, margin + 5, yPos + 4);
               yPos += lines.length * 5 + 2;
           });
           yPos += 5;
      };

      // --- PDF Content Generation ---

      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Resumo do Edital de Licitação', pageWidth / 2, yPos, { align: 'center' });
      yPos += 15;

      addSectionTitle('Informações Gerais');
      addInfo('Objeto da Licitação', summary.objetoLicitacao);
      addInfo('Número do Processo', summary.numeroProcesso);
      addInfo('Modalidade', summary.tipoDisputa);
      addInfo('Portal', summary.portal);
      addInfo('Critério de Julgamento', summary.criterioJulgamento);
      yPos += 5;

      addSectionTitle('Datas e Prazos');
      addInfo('Abertura', summary.dataAbertura);
      addInfo('Disputa', summary.dataDisputa);
      addInfo('Entrega', summary.dataEntrega);
      addInfo('Pagamento', summary.dataPagamento);
      addInfo('Validade da Proposta', summary.validadeProposta);
      yPos += 5;

      addSectionTitle('Licitante');
      addInfo('Nome', summary.licitante.nome);
      addInfo('CNPJ', summary.licitante.cnpj);
      addInfo('Endereço', summary.licitante.endereco);
      addInfo('Telefone', summary.licitante.telefone);
      addInfo('Email', summary.licitante.email);
      addInfo('Responsável', summary.licitante.responsavel);
      yPos += 5;

      addList('Documentação Necessária para Habilitação', summary.requisitosHabilitacao);
      addList('Outros Dados Relevantes', summary.outrosDados);
      
      if (summary.itensLicitados && summary.itensLicitados.length > 0) {
          addSectionTitle('Itens Licitados');
          summary.itensLicitados.forEach(item => {
              const itemHeader = `Item ${item.item || 'N/A'}: ${item.descricao || ''}`;
              const itemDetails = `Quantidade: ${item.quantidade || 'N/A'} ${item.unidade || ''}`;
              
              const headerLines = pdf.splitTextToSize(itemHeader, contentWidth);
              const detailLines = pdf.splitTextToSize(itemDetails, contentWidth - 5);
              
              checkPageBreak((headerLines.length + detailLines.length) * 5 + 5);

              pdf.setFontSize(11);
              pdf.setFont('helvetica', 'bold');
              pdf.text(headerLines, margin, yPos);
              yPos += headerLines.length * 5;

              pdf.setFont('helvetica', 'normal');
              pdf.text(detailLines, margin + 5, yPos);
              yPos += detailLines.length * 5 + 5;
          });
      }
      
      pdf.save('resumo-edital.pdf');

    } catch (error) {
      console.error("Failed to export PDF:", error);
      alert("Ocorreu um erro ao gerar o PDF.");
    } finally {
      setIsExporting(false);
    }
  };


  if (isLoading) {
    return (
      <div className="w-full bg-white rounded-lg p-6 shadow-lg animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-4">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="w-full bg-white rounded-lg p-6 shadow-lg">
        <h2 className="text-xl font-bold text-gray-900 mb-2">📄 Resumo do Edital</h2>
        <p className="text-gray-500">O resumo será exibido aqui após o upload de um arquivo.</p>
      </div>
    );
  }
  
  const renderInfo = (label: string, value: string | undefined | null) => (
    value ? <p><strong className="font-semibold text-gray-700">{label}:</strong> {value}</p> : null
  );

  const renderList = (label: string, items: string[] | undefined) => (
    items && items.length > 0 && (
        <div className="mt-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-2">{label}</h3>
            <ul className="list-disc list-inside ml-4 space-y-1 text-gray-600">
                {items.map((item, index) => <li key={index}>{item}</li>)}
            </ul>
        </div>
    )
  );

  return (
    <div className="w-full bg-white rounded-lg p-6 shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-900">📄 Resumo do Edital</h2>
         {summary && (
            <button
                onClick={handleExportPDF}
                disabled={isExporting}
                className="flex items-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300 disabled:opacity-50 disabled:cursor-wait"
            >
                {isExporting ? (
                    <>
                        <LoadingSpinner className="w-5 h-5 mr-2" />
                        <span>Exportando...</span>
                    </>
                ) : (
                    <>
                        <DownloadIcon className="w-5 h-5 mr-2" />
                        <span>Exportar PDF</span>
                    </>
                )}
            </button>
        )}
      </div>
      
      <div id="summary-content">
        <div className="space-y-2 text-gray-600">
          <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-2">Informações Gerais</h3>
          {renderInfo('Objeto da Licitação', summary.objetoLicitacao)}
          {renderInfo('Número do Processo', summary.numeroProcesso)}
          {renderInfo('Modalidade', summary.tipoDisputa)}
          {renderInfo('Portal', summary.portal)}
          {renderInfo('Critério de Julgamento', summary.criterioJulgamento)}

          <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mt-4 mb-2">Datas e Prazos</h3>
          {renderInfo('Abertura', summary.dataAbertura)}
          {renderInfo('Disputa', summary.dataDisputa)}
          {renderInfo('Entrega', summary.dataEntrega)}
          {renderInfo('Pagamento', summary.dataPagamento)}
          {renderInfo('Validade da Proposta', summary.validadeProposta)}

          <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mt-4 mb-2">Licitante</h3>
          {renderInfo('Nome', summary.licitante.nome)}
          {renderInfo('CNPJ', summary.licitante.cnpj)}
          {renderInfo('Endereço', summary.licitante.endereco)}
          {renderInfo('Telefone', summary.licitante.telefone)}
          {renderInfo('Email', summary.licitante.email)}
          {renderInfo('Responsável', summary.licitante.responsavel)}
          
          {summary.requisitosHabilitacao && summary.requisitosHabilitacao.length > 0 && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
                <ClipboardListIcon className="w-6 h-6 mr-3 text-blue-600" />
                Documentação Necessária para Habilitação
              </h3>
              <ul className="list-disc list-inside ml-4 space-y-1 text-gray-700">
                {summary.requisitosHabilitacao.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {renderList('Outros Dados Relevantes', summary.outrosDados)}

          {summary.itensLicitados && summary.itensLicitados.length > 0 && (
              <div className="mt-4">
                  <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-2">Itens Licitados</h3>
                  <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                              <tr>
                                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qtd.</th>
                                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Un.</th>
                              </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                          {summary.itensLicitados.map((item, index) => (
                              <tr key={index}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.item}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.descricao}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.quantidade}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.unidade}</td>
                              </tr>
                          ))}
                          </tbody>
                      </table>
                  </div>
              </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SummaryDisplay;