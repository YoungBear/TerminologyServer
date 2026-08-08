import axios from 'axios';
import type {
  Term,
  TermCreateRequest,
  TermUpdateRequest,
  TermListResponse,
  TermQueryParams,
} from '../types/term';

const api = axios.create({ baseURL: '/api' });

export async function createTerm(data: TermCreateRequest): Promise<Term> {
  const res = await api.post<Term>('/terms', data);
  return res.data;
}

export async function getTerms(params: TermQueryParams): Promise<TermListResponse> {
  const res = await api.get<TermListResponse>('/terms', { params });
  return res.data;
}

export async function getTerm(id: number): Promise<Term> {
  const res = await api.get<Term>(`/terms/${id}`);
  return res.data;
}

export async function updateTerm(id: number, data: TermUpdateRequest): Promise<Term> {
  const res = await api.put<Term>(`/terms/${id}`, data);
  return res.data;
}

export async function deleteTerm(id: number): Promise<void> {
  await api.delete(`/terms/${id}`);
}

export async function searchTerms(
  q: string,
  language?: string,
  domain?: string,
  status?: string,
  page = 1,
  page_size = 20,
): Promise<TermListResponse> {
  const res = await api.get<TermListResponse>('/terms/search', {
    params: { q, language, domain, status, page, page_size },
  });
  return res.data;
}
