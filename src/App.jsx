import React, { useState, useEffect, useMemo } from 'react'
import { fetchVehicules, fetchStats } from './supabase'

// ============================================================
// CONSTANTES PRIX 2026
// ============================================================
const PRIX = {
  essence: 2.03,
  diesel: 1.78,
  elec_hc: 0.1579,
  elec_borne: 0.45,
}

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================
export default function App() {
  const [vehicules, setVehicules] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filtres
  const [filtreSegment, setFiltreSegment] = useState('')
  const [filtreEnergie, setFiltreEnergie] = useState('')
  const [prixMax, setPrixMax] = useState(50000)

  // Profil utilisateur
  const [kmAnnuel, setKmAnnuel] = useState(15000)
  const [dureeGarde, setDureeGarde] = useState(5)
  const [aBorne, setABorne] = useState(true)

  // Charger les véhicules au démarrage et à chaque changement de filtre
  useEffect(() => {
    setLoading(true)
    setError(null)

    Promise.all([
      fetchVehicules({
        segment: filtreSegment || null,
        energie: filtreEnergie || null,
        prixMax: prixMax,
        limit: 30,
      }),
      fetchStats(),
    ])
      .then(([data, statsData]) => {
        setVehicules(data)
        setStats(statsData)
        setLoading(false)
      })
      .catch((err) => {
        console.error(err)
        setError(err.message || 'Erreur de chargement')
        setLoading(false)
      })
  }, [filtreSegment, filtreEnergie, prixMax])

  // Calcul TCO pour chaque véhicule
  const vehiculesAvecTCO = useMemo(() => {
    return vehicules.map((v) => {
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

      const tco =
        prix +
        coutEnergieAnnuel * dureeGarde +
        entretienAnnuel * dureeGarde +
        assuranceAnnuelle * dureeGarde -
        valeurRevente

      const coutAuKm = kmAnnuel > 0 ? tco / (kmAnnuel * dureeGarde) : 0

      return {
        ...v,
        tco,
        coutEnergieAnnuel,
        coutAuKm,
        valeurRevente,
      }
    }).sort((a, b) => a.tco - b.tco)
  }, [vehicules, kmAnnuel, dureeGarde, aBorne])

  const fmt = (n) => Math.round(n).toLocaleString('fr-FR')
  const couleurType = {
    essence: '#8B6F47',
    diesel: '#5C4033',
    hybride: '#5B7C99',
    hybride_rechargeable: '#2E5C7E',
    electrique: '#4A7C59',
  }

  // ============================================================
  // RENDU
  // ============================================================
  return (
    <div style={S.container}>
      <header style={S.header}>
        <div style={S.kicker}>SIMULATEUR · COÛT TOTAL DE POSSESSION · 2026</div>
        <h1 style={S.title}>
          Quel véhicule est<br />
          <em style={S.titleItalic}>vraiment fait pour vous&nbsp;?</em>
        </h1>
        {stats && (
          <p style={S.subtitle}>
            Base de données ouverte — <strong>{fmt(stats.totalVehicules)}</strong> véhicules
            disponibles à la comparaison, source ADEME.
          </p>
        )}
      </header>

      <div style={S.layout}>
        {/* SIDEBAR FILTRES */}
        <aside style={S.sidebar}>
          <div style={S.section}>
            <div style={S.sectionLabel}>01 — Recherche</div>

            <label style={S.label}>Segment</label>
            <select value={filtreSegment} onChange={e => setFiltreSegment(e.target.value)} style={S.select}>
              <option value="">Tous</option>
              <option value="citadine">Citadine</option>
              <option value="compacte">Compacte</option>
              <option value="berline">Berline</option>
              <option value="SUV">SUV</option>
              <option value="break">Break</option>
              <option value="monospace">Monospace</option>
              <option value="coupe">Coupé</option>
              <option value="cabriolet">Cabriolet</option>
            </select>

            <label style={S.label}>Énergie</label>
            <select value={filtreEnergie} onChange={e => setFiltreEnergie(e.target.value)} style={S.select}>
              <option value="">Toutes</option>
              <option value="essence">Essence</option>
              <option value="diesel">Diesel</option>
              <option value="hybride">Hybride</option>
              <option value="hybride_rechargeable">Hybride rechargeable</option>
              <option value="electrique">Électrique</option>
            </select>

            <label style={S.label}>
              Prix max <span style={S.labelVal}>{fmt(prixMax)} €</span>
            </label>
            <input type="range" min="10000" max="100000" step="2500"
              value={prixMax} onChange={e => setPrixMax(+e.target.value)} style={S.slider}/>
          </div>

          <div style={S.section}>
            <div style={S.sectionLabel}>02 — Votre usage</div>

            <label style={S.label}>
              Km/an <span style={S.labelVal}>{fmt(kmAnnuel)} km</span>
            </label>
            <input type="range" min="5000" max="40000" step="1000"
              value={kmAnnuel} onChange={e => setKmAnnuel(+e.target.value)} style={S.slider}/>

            <label style={S.label}>
              Durée de garde <span style={S.labelVal}>{dureeGarde} ans</span>
            </label>
            <input type="range" min="2" max="10"
              value={dureeGarde} onChange={e => setDureeGarde(+e.target.value)} style={S.slider}/>

            <label style={S.checkbox}>
              <input type="checkbox" checked={aBorne} onChange={e => setABorne(e.target.checked)}/>
              <span>Borne à domicile (pour VE)</span>
            </label>
          </div>
        </aside>

        {/* RESULTATS */}
        <main style={S.results}>
          {loading && (
            <div style={S.loading}>Chargement de la base véhicules...</div>
          )}

          {error && (
            <div style={S.error}>
              <strong>Erreur :</strong> {error}
              <br/><br/>
              Vérifie tes variables d'environnement Supabase dans Vercel
              (VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY).
            </div>
          )}

          {!loading && !error && vehiculesAvecTCO.length === 0 && (
            <div style={S.empty}>
              Aucun véhicule ne correspond à ces critères.
              <br/>Essaie d'élargir tes filtres.
            </div>
          )}

          {!loading && !error && vehiculesAvecTCO.length > 0 && (
            <>
              <div style={S.kicker}>
                {vehiculesAvecTCO.length} véhicules · classés par TCO sur {dureeGarde} ans
              </div>
              <h2 style={S.h2}>Résultats</h2>

              {vehiculesAvecTCO.map((v, i) => (
                <article key={v.vehicule_id} style={{
                  ...S.card,
                  borderLeft: `4px solid ${couleurType[v.energie] || '#888'}`,
                  background: i === 0 ? '#FAF8F2' : '#FFF',
                }}>
                  <div style={S.cardHead}>
                    <div style={{flex: 1}}>
                      <div style={S.cardRank}>
                        {i === 0 && <span style={S.bestBadge}>MEILLEUR TCO</span>}
                        <span style={S.rankNum}>#{i + 1}</span>
                        {v.critair && (
                          <span style={{
                            ...S.critair,
                            background: v.critair === 'E' ? '#4A7C59' : '#F0EBE0',
                            color: v.critair === 'E' ? '#FFF' : '#666',
                          }}>Crit'Air {v.critair}</span>
                        )}
                      </div>
                      <h3 style={S.cardTitle}>{v.marque} {v.modele}</h3>
                      <div style={S.cardMeta}>
                        {v.finition && <span>{v.finition} · </span>}
                        {v.energie} · {v.puissance_max_ch || '?'} ch
                        {v.segment && ` · ${v.segment}`}
                      </div>
                    </div>
                    <div style={S.cardTco}>
                      <div style={S.tcoLabel}>TCO {dureeGarde} ans</div>
                      <div style={S.tcoValue}>{fmt(v.tco)} €</div>
                      <div style={S.tcoPerKm}>{v.coutAuKm.toFixed(2)} €/km</div>
                    </div>
                  </div>

                  <div style={S.breakdown}>
                    {v.prix_min_eur && (
                      <div><div style={S.bdL}>Prix</div><div style={S.bdV}>{fmt(v.prix_min_eur)} €</div></div>
                    )}
                    <div><div style={S.bdL}>Énergie/an</div><div style={S.bdV}>{fmt(v.coutEnergieAnnuel)} €</div></div>
                    {v.conso_mixte && (
                      <div><div style={S.bdL}>Conso</div><div style={S.bdV}>{v.conso_mixte} L/100</div></div>
                    )}
                    {v.conso_elec_mixte && (
                      <div><div style={S.bdL}>Conso élec</div><div style={S.bdV}>{v.conso_elec_mixte} kWh/100</div></div>
                    )}
                    {v.co2_g_km !== null && v.co2_g_km !== undefined && (
                      <div><div style={S.bdL}>CO₂</div><div style={S.bdV}>{v.co2_g_km} g/km</div></div>
                    )}
                    <div><div style={S.bdL}>Revente</div><div style={S.bdV}>{fmt(v.valeurRevente)} €</div></div>
                  </div>
                </article>
              ))}
            </>
          )}

          <footer style={S.footer}>
            <p style={S.footerNote}>
              <strong>Source des données :</strong> ADEME Carlabelling sous Licence Ouverte 2.0 (Etalab).
              Les données techniques (consommation, CO₂, puissance) sont issues du cycle WLTP officiel.
              Les calculs TCO incluent prix d'achat, énergie, entretien, assurance et déduisent la valeur de revente estimée.
              Cette simulation est indicative et ne constitue pas un conseil financier.
            </p>
          </footer>
        </main>
      </div>
    </div>
  )
}

// ============================================================
// STYLES
// ============================================================
const S = {
  container: {
    minHeight: '100vh', padding: '40px 24px',
    fontFamily: '-apple-system, BlinkMacSystemFont, Inter, sans-serif',
  },
  header: { maxWidth: 1200, margin: '0 auto 40px' },
  kicker: { fontSize: 11, letterSpacing: '0.2em', fontWeight: 600, color: '#666', marginBottom: 12 },
  title: {
    fontFamily: 'Georgia, "Tiempos Headline", serif',
    fontSize: 'clamp(32px, 5vw, 56px)', lineHeight: 1.05, fontWeight: 400,
    margin: 0, letterSpacing: '-0.02em',
  },
  titleItalic: { fontStyle: 'italic', color: '#8B6F47' },
  subtitle: { fontSize: 16, color: '#444', maxWidth: 600, marginTop: 16 },
  layout: {
    display: 'grid', gridTemplateColumns: 'minmax(260px, 320px) 1fr',
    gap: 40, maxWidth: 1200, margin: '0 auto',
  },
  sidebar: { display: 'flex', flexDirection: 'column', gap: 28, position: 'sticky', top: 24, alignSelf: 'start' },
  section: { borderTop: '1px solid #1A1A1A', paddingTop: 18 },
  sectionLabel: { fontSize: 10, letterSpacing: '0.18em', fontWeight: 700, marginBottom: 14 },
  label: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
    fontSize: 13, fontWeight: 500, marginBottom: 6, marginTop: 14, color: '#333',
  },
  labelVal: { fontFamily: 'monospace', fontWeight: 600 },
  slider: { width: '100%', accentColor: '#1A1A1A' },
  select: {
    width: '100%', padding: '10px 12px', fontSize: 13,
    border: '1px solid #1A1A1A', background: '#FFF', borderRadius: 0,
  },
  checkbox: {
    display: 'flex', alignItems: 'center', gap: 10,
    fontSize: 13, padding: '10px 0', cursor: 'pointer',
  },
  results: { display: 'flex', flexDirection: 'column', gap: 16 },
  h2: {
    fontFamily: 'Georgia, serif', fontSize: 26, fontWeight: 400,
    margin: '8px 0 16px', letterSpacing: '-0.01em',
  },
  loading: { padding: 40, textAlign: 'center', color: '#666', fontSize: 16 },
  error: {
    padding: 24, background: '#FFF4E6', border: '1px solid #C44',
    color: '#8B4513', fontSize: 14, lineHeight: 1.6,
  },
  empty: { padding: 40, textAlign: 'center', color: '#888', background: '#FFF', border: '1px dashed #CCC' },
  card: { background: '#FFF', padding: '24px 28px', border: '1px solid #E5E0D5' },
  cardHead: {
    display: 'flex', justifyContent: 'space-between', gap: 20,
    marginBottom: 16, flexWrap: 'wrap',
  },
  cardRank: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' },
  bestBadge: {
    fontSize: 9, letterSpacing: '0.18em', fontWeight: 700,
    background: '#1A1A1A', color: '#F4F1EA', padding: '4px 8px',
  },
  rankNum: { fontSize: 11, fontFamily: 'monospace', fontWeight: 700, color: '#888' },
  critair: { fontSize: 10, fontWeight: 700, padding: '3px 7px', letterSpacing: '0.05em' },
  cardTitle: { fontFamily: 'Georgia, serif', fontSize: 22, fontWeight: 400, margin: '0 0 4px' },
  cardMeta: { fontSize: 13, color: '#666', textTransform: 'capitalize' },
  cardTco: { textAlign: 'right' },
  tcoLabel: { fontSize: 10, letterSpacing: '0.18em', fontWeight: 700, color: '#888', marginBottom: 4 },
  tcoValue: { fontFamily: 'Georgia, serif', fontSize: 28, fontWeight: 400, lineHeight: 1 },
  tcoPerKm: { fontFamily: 'monospace', fontSize: 12, color: '#666', marginTop: 4 },
  breakdown: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
    gap: 12, paddingTop: 14, borderTop: '1px solid #F0EBE0',
  },
  bdL: { fontSize: 10, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 },
  bdV: { fontFamily: 'monospace', fontSize: 13, fontWeight: 600 },
  footer: { marginTop: 24, paddingTop: 24, borderTop: '1px solid #1A1A1A' },
  footerNote: { fontSize: 12, lineHeight: 1.6, color: '#666', maxWidth: 760 },
}
