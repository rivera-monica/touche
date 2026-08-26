import type { Candle } from '../types';

type CandleInsert = Partial<Candle> &
  Pick<Candle, 'number' | 'name' | 'sort_order' | 'primary_status'>;
type CandleUpdate = Partial<Candle>;

export type Database = {
  public: {
    Tables: {
      candles: {
        Row: Candle;
        Insert: CandleInsert;
        Update: CandleUpdate;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};
