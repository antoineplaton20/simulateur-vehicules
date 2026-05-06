export const PRIX = {
  essence: 2.03,
  diesel: 1.78,
  elec_hc: 0.1579,
  elec_borne: 0.45,
}

export const TAUX_CREDIT_DEFAUT = 5.5

export const VALEURS_DEFAUT = {
  filtreSegment: '',
  filtreEnergie: '',
  prixMax: 50000,
  kmAnnuel: 15000,
  dureeGarde: 5,
  aBorne: true,
  modePaiement: 'comptant',
  apport: 5000,
  dureeCreditAns: 5,
  tauxCredit: TAUX_CREDIT_DEFAUT,
}

export const LIBELLE_ENERGIE = {
  essence: 'Essence',
  diesel: 'Diesel',
  hybride: 'Hybride',
  hybride_rechargeable: 'Hybride rechargeable',
  electrique: 'Électrique',
}

export const LIBELLE_SEGMENT = {
  citadine: 'Citadine',
  compacte: 'Compacte',
  berline: 'Berline',
  SUV: 'SUV',
  break: 'Break',
  monospace: 'Monospace',
  coupe: 'Coupé',
  cabriolet: 'Cabriolet',
}

export const SEGMENTS = [
  { value: '', label: 'Tous les types' },
  { value: 'citadine', label: 'Citadine — petite, pour la ville' },
  { value: 'compacte', label: 'Compacte — polyvalente' },
  { value: 'berline', label: 'Berline — confort routier' },
  { value: 'SUV', label: 'SUV — surélevé, familial' },
  { value: 'break', label: 'Break — gros coffre' },
  { value: 'monospace', label: 'Monospace — famille nombreuse' },
  { value: 'coupe', label: 'Coupé' },
  { value: 'cabriolet', label: 'Cabriolet' },
]

export const ENERGIES = [
  { value: '', label: 'Toutes' },
  { value: 'essence', label: 'Essence' },
  { value: 'diesel', label: 'Diesel' },
  { value: 'hybride', label: 'Hybride (essence + élec.)' },
  { value: 'hybride_rechargeable', label: 'Hybride rechargeable' },
  { value: 'electrique', label: '100 % électrique' },
]
