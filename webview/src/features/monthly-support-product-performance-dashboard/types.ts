export type DomainFilter = 'Tous' | 'Helpdesk' | 'Produit' | 'Support';

export interface MonthlyServiceRecord {
  domaine: string;
  serviceProduit: string;
  volumeTickets: number;
  disponibilite: number;
  respectOLA: number;
  firstTimeFix: number;
  faitsMarquants: string;
}

export interface KpiMetric {
  label: string;
  value: string;
  context: string;
  accent: string;
}

export interface OlaChartItem {
  label: string;
  value: number;
  domain: string;
}
