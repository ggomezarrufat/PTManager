export interface Season {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface CreateSeasonRequest {
  name: string;
  start_date: string;
  end_date: string;
}

export interface UpdateSeasonRequest {
  name?: string;
  start_date?: string;
  end_date?: string;
}

export interface SeasonFormData {
  name: string;
  start_date: string;
  end_date: string;
}

