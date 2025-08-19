export interface Tournament {
  id: string;
  name: string;
  description?: string;
  entry_fee: number;
  max_players: number;
  status: 'scheduled' | 'active' | 'paused' | 'finished';
  scheduled_start_time: string;
  start_time?: string;
  end_time?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  season_id?: number;
  rebuy_chips?: number;
  addon_chips?: number;
  max_rebuys?: number;
  max_addons?: number;
  blind_structure?: any;
  point_system?: any;
}

