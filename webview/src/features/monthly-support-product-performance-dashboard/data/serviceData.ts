import type { DomainFilter, MonthlyServiceRecord } from '../types';

export const domainOptions: DomainFilter[] = ['Tous', 'Helpdesk', 'Produit', 'Support'];

export const initialServiceData: MonthlyServiceRecord[] = [
  {
    domaine: 'Helpdesk',
    serviceProduit: 'Services',
    volumeTickets: 3065,
    disponibilite: 0.972,
    respectOLA: 0.997,
    firstTimeFix: 0.5769,
    faitsMarquants: 'NPS Appels: 89 / Satis: 97.19%',
  },
  {
    domaine: 'Helpdesk',
    serviceProduit: 'Retail',
    volumeTickets: 10507,
    disponibilite: 0.9206,
    respectOLA: 0.9368,
    firstTimeFix: 0.5163,
    faitsMarquants: 'NPS Appels: 80 / Satis: 94.94%',
  },
  {
    domaine: 'Produit',
    serviceProduit: 'DRING',
    volumeTickets: 0,
    disponibilite: 0,
    respectOLA: 0.815,
    firstTimeFix: 0,
    faitsMarquants: 'Déploiement RingCx 58.9% (159 sites)',
  },
  {
    domaine: 'Support',
    serviceProduit: 'WORLDLINE',
    volumeTickets: 0,
    disponibilite: 0,
    respectOLA: 1,
    firstTimeFix: 0,
    faitsMarquants: 'Test DCC + temps de transactions',
  },
  {
    domaine: 'Support',
    serviceProduit: 'TELECOM-FR',
    volumeTickets: 0,
    disponibilite: 0,
    respectOLA: 1,
    firstTimeFix: 0,
    faitsMarquants: '',
  },
  {
    domaine: 'Support',
    serviceProduit: 'NETWORK',
    volumeTickets: 0,
    disponibilite: 0,
    respectOLA: 1,
    firstTimeFix: 0,
    faitsMarquants: 'Lignes fibres ouverture FRST3510 Rennes',
  },
  {
    domaine: 'Support',
    serviceProduit: 'Android_iOS',
    volumeTickets: 0,
    disponibilite: 0,
    respectOLA: 0,
    firstTimeFix: 0,
    faitsMarquants: 'Alerte S34 : Hausse tickets enrôlement',
  },
];
