export interface Setting {
  id: number;
  key: string;
  value: string;
  dataType: string;
  category: string | null;
  description: string | null;
}
