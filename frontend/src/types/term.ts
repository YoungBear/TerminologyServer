export interface Term {
  id: number;
  domain: string;
  status: string;
  name_zh: string;
  abbr_zh: string;
  def_zh: string;
  name_en: string;
  abbr_en: string;
  def_en: string;
  created_at: string;
  updated_at: string;
}

export interface TermCreateRequest {
  domain: string;
  status: string;
  name_zh: string;
  abbr_zh: string;
  def_zh: string;
  name_en: string;
  abbr_en: string;
  def_en: string;
}

export type TermUpdateRequest = TermCreateRequest;

export interface TermListResponse {
  total: number;
  page: number;
  page_size: number;
  items: Term[];
}

export interface TermQueryParams {
  page?: number;
  page_size?: number;
  domain?: string;
  status?: string;
  language?: string;
}

export const STATUS_LABELS: Record<string, string> = {
  draft: '草稿',
  approved: '已审核',
  deprecated: '已废弃',
};
