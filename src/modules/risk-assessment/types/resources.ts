export interface Template {
  id: string;
  name: string;
  category: string;
  riskTier: 'ALL' | 'BASIC' | 'MODERATE' | 'HIGH';
  description: string;
  fileUrl: string;
}
