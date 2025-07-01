export interface Publicacao {
  id?: number;
  numero_processo?: string;
  data_disponibilizacao?: Date;
  autores?: string;
  advogados?: string;
  reu: string;
  conteudo_completo?: string;
  valor_principal_bruto?: number;
  valor_juros_moratorios?: number;
  honorarios_advocaticios?: number;
  status: 'nova' | 'lida' | 'processada';
  data_extracao?: Date;
  url_publicacao?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface PublicacaoCreate {
  numero_processo?: string;
  data_disponibilizacao?: Date;
  autores?: string;
  advogados?: string;
  conteudo_completo?: string;
  valor_principal_bruto?: number;
  valor_juros_moratorios?: number;
  honorarios_advocaticios?: number;
  url_publicacao?: string;
}

export interface PublicacaoFilters {
  status?: string;
  numero_processo?: string;
  data_inicio?: string;
  data_fim?: string;
  autor?: string;
  search?: string;
  page?: string;
  limit?: string;
}