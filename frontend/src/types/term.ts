export interface TermName {
  id?: number;
  term_id?: number;
  language: string;
  name_type: string;
  name: string;
  definition: string | null;
}

export interface Term {
  id: number;
  domain: string;
  status: string;
  names: TermName[];
  created_at: string;
  updated_at: string;
}

export interface TermCreateRequest {
  domain: string;
  status: string;
  names: Omit<TermName, 'id' | 'term_id'>[]; // Must have at least 1
}

export interface TermUpdateRequest {
  domain: string;
  status: string;
  names: (Omit<TermName, 'term_id'> & { id?: number })[];
}

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

export const NAME_TYPE_LABELS: Record<string, string> = {
  full_name: '全称',
  abbreviation: '简写',
  synonym: '同义词',
};

export const STATUS_LABELS: Record<string, string> = {
  draft: '草稿',
  approved: '已审核',
  deprecated: '已废弃',
};
