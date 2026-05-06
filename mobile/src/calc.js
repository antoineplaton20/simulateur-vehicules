import { PRIX } from './constants'

export function calculerCredit({ montant, apport, dureeMois, tauxAnnuel }) {
  const principal = Math.max(0, montant - apport)
  if (principal === 0 || dureeMois === 0) {
    return { mensualite: 0, totalRembourse: 0, interets: 0, principal }
  }
  const r = tauxAnnuel / 100 / 12
  const mensualite = r === 0
    ? principal / dureeMois
    : (principal * r) / (1 - Math.pow(1 + r, -dureeMois))
  const totalRembourse = mensualite * dureeMois
  const interets = totalRembourse - principal
  return { mensualite, totalRembourse, interets, principal }
}

export function calculerTCO(v, params) {
  const { kmAnnuel, dureeGarde, aBorne, modePaiement, apport, dureeCreditAns, tauxCredit } = params
  const conso = v.conso_mixte || v.conso_elec_mixte || 0
  let coutEnergieAnnuel = 0

  if (v.energie === 'electrique') {
    const kwhAnnuel = (conso * kmAnnuel) / 100
    const partDom = aBorne ? 0.8 : 0
    coutEnergieAnnuel =
      kwhAnnuel * partDom * PRIX.elec_hc +
      kwhAnnuel * (1 - partDom) * PRIX.elec_borne
  } else if (v.energie === 'diesel') {
    coutEnergieAnnuel = (conso * kmAnnuel * PRIX.diesel) / 100
  } else {
    coutEnergieAnnuel = (conso * kmAnnuel * PRIX.essence) / 100
  }

  const prix = v.prix_min_eur || 0
  const entretienAnnuel =
    v.energie === 'electrique' ? 250 :
    v.energie === 'hybride' ? 400 : 500
  const assuranceAnnuelle = 650
  const decoteAnnuelle = v.energie === 'electrique' ? 0.16 : 0.13
  const valeurRevente = prix * Math.pow(1 - decoteAnnuelle, dureeGarde)

  let interetsCredit = 0
  let mensualite = 0
  if (modePaiement === 'credit' && prix > 0) {
    const c = calculerCredit({
      montant: prix,
      apport: Math.min(apport, prix),
      dureeMois: dureeCreditAns * 12,
      tauxAnnuel: tauxCredit,
    })
    interetsCredit = c.interets
    mensualite = c.mensualite
  }

  const tco =
    prix +
    interetsCredit +
    coutEnergieAnnuel * dureeGarde +
    entretienAnnuel * dureeGarde +
    assuranceAnnuelle * dureeGarde -
    valeurRevente

  const coutAuKm = kmAnnuel > 0 ? tco / (kmAnnuel * dureeGarde) : 0
  const coutMensuelMoyen = tco / (dureeGarde * 12)

  return {
    ...v,
    tco,
    coutEnergieAnnuel,
    coutAuKm,
    coutMensuelMoyen,
    valeurRevente,
    interetsCredit,
    mensualite,
  }
}

export function appliquerFiltres(vehicules, { segment, energie, prixMax }) {
  return vehicules.filter((v) => {
    if (segment && v.segment !== segment) return false
    if (energie && v.energie !== energie) return false
    if (prixMax && (v.prix_min_eur || 0) > prixMax) return false
    return true
  })
}
