export const colors = {
  bg: '#F4F1EA',
  card: '#FFFFFF',
  cardHighlight: '#FAF8F2',
  cardBorder: '#E5E0D5',
  text: '#1A1A1A',
  textMuted: '#555555',
  textLight: '#777777',
  accent: '#8B6F47',
  dark: '#1A1A1A',
  light: '#F4F1EA',
  energie: {
    essence: '#8B6F47',
    diesel: '#5C4033',
    hybride: '#5B7C99',
    hybride_rechargeable: '#2E5C7E',
    electrique: '#4A7C59',
  },
}

export const sizes = {
  base: 17,
  small: 14,
  tiny: 12,
  h1: 28,
  h2: 22,
  h3: 19,
  big: 30,
}

export const radius = {
  none: 0,
  sm: 4,
  md: 8,
}

export const fmt = (n) => Math.round(n).toLocaleString('fr-FR')
