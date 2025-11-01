import React from 'react';
import { SummaryData } from '../types';

interface SummaryDisplayProps {
  summary: SummaryData;
}

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-gray-50 p-4 rounded-lg mb-4">
        <h3 className="text-lg font-bold text-blue-700 mb-3">{title}</h3>
        <div className="space-y-2 text-gray-700">{children}</div>
    </div>
);

const InfoItem: React.FC<{ label: string; value?: string | null }> = ({ label, value }) => (
    value ? <p><span className="font-semibold text-gray-900">{label}:</span> {value}</p> : null
);

const SummaryDisplay: React.FC<SummaryDisplayProps> = ({ summary }) => {
    if (!summary) return null;

    return (
        <div className="w-full bg-white rounded-lg p-6 shadow-lg">
            <h2 className="text-xl font-bold text-gray-900 mb-4">📋 Resumo do Edital</h2>
            
            <div className="space-y-6">
                <Section title="🏢 Dados do Órgão Licitante">
                    <InfoItem label="Nome" value={summary.licitante.nome} />
                    <InfoItem label="CNPJ" value={summary.licitante.cnpj} />
                    <InfoItem label="Endereço" value={summary.licitante.endereco} />
                    <InfoItem label="Telefone" value={summary.licitante.telefone} />
                    <InfoItem label="Email" value={summary.licitante.email} />
                    <InfoItem label="Responsável" value={summary.licitante.responsavel} />
                </Section>

                <Section title="🎯 Informações Gerais">
                    <InfoItem label="Objeto da Licitação" value={summary.objetoLicitacao} />
                    <InfoItem label="Tipo de Disputa" value={summary.tipoDisputa} />
                    <InfoItem label="Portal" value={summary.portal} />
                    <InfoItem label="Número do Processo" value={summary.numeroProcesso} />
                    <InfoItem label="Critério de Julgamento" value={summary.criterioJulgamento} />
                </section>

                <Section title="🗓️ Datas Principais">
                    <InfoItem label="Abertura" value={summary.dataAbertura} />
                    <InfoItem label="Disputa" value={summary.dataDisputa} />
                    <InfoItem label="Entrega" value={summary.dataEntrega} />
                    <InfoItem label="Pagamento" value={summary.dataPagamento} />
                    <InfoItem label="Validade da Proposta" value={summary.validadeProposta} />
                </Section>
                
                {summary.requisitosHabilitacao && summary.requisitosHabilitacao.length > 0 && (
                    <Section title="📜 Requisitos de Habilitação">
                        <ul className="list-disc list-inside space-y-1">
                            {summary.requisitosHabilitacao.map((req, index) => <li key={index}>{req}</li>)}
                        </ul>
                    </Section>
                )}

                {summary.itensLicitados && summary.itensLicitados.length > 0 && (
                    <Section title="📦 Principais Itens Licitados">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="text-gray-500">
                                    <tr>
                                        <th className="p-2">Item</th>
                                        <th className="p-2">Descrição</th>
                                        <th className="p-2">Qtd.</th>
                                        <th className="p-2">Un.</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {summary.itensLicitados.map((item, index) => (
                                        <tr key={index} className="border-t border-gray-200">
                                            <td className="p-2">{item.item}</td>
                                            <td className="p-2">{item.descricao}</td>
                                            <td className="p-2">{item.quantidade}</td>
                                            <td className="p-2">{item.unidade}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Section>
                )}

                {summary.outrosDados && summary.outrosDados.length > 0 && (
                     <Section title="📎 Outros Dados Relevantes">
                        <ul className="list-disc list-inside space-y-1">
                            {summary.outrosDados.map((data, index) => <li key={index}>{data}</li>)}
                        </ul>
                    </Section>
                )}

            </div>
        </div>
    );
};

export default SummaryDisplay;