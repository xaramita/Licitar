
export interface Licitante {
  nome: string;
  cnpj: string;
  endereco: string;
  telefone: string;
  email: string;
  responsavel: string;
}

export interface ItemLicitado {
  item: string;
  descricao: string;
  quantidade: string;
  unidade: string;
}

export interface SummaryData {
  licitante: Licitante;
  objetoLicitacao: string;
  tipoDisputa: string;
  portal: string;
  numeroProcesso: string;
  dataAbertura: string;
  dataDisputa: string;
  dataEntrega: string;
  dataPagamento: string;
  validadeProposta: string;
  requisitosHabilitacao: string[];
  criterioJulgamento: string;
  itensLicitados: ItemLicitado[];
  outrosDados: string[];
}

export interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
}
