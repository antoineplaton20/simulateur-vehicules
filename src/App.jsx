import React, { useState, useEffect, useMemo } from 'react'
import { fetchVehicules, fetchStats } from './supabase'
import { PodiumComparison, TcoBreakdown, TcoEvolution } from './charts.jsx'

// ============================================================
// CONSTANTES PRIX 2026
// ============================================================
const PRIX = {
  essence: 2.03,
  diesel: 1.78,
  elec_hc: 0.1579,
  elec_borne: 0.45,
}

const TAUX_CREDIT_DEFAUT = 5.5 // % annuel, valeur indicative 2026

// ============================================================
// HELPERS
// ============================================================
function calculerCredit({ montant, apport, dureeMois, tauxAnnuel }) {
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

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================
export default function App() {
  const [vehicules, setVehicules] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expanded, setExpanded] = useState(() => new Set())

  // Filtres
  const [filtreSegment, setFiltreSegment] = useState('')
  const [filtreEnergie, setFiltreEnergie] = useState('')
  const [prixMax, setPrixMax] = useState(50000)

  // Profil utilisateur
  const [kmAnnuel, setKmAnnuel] = useState(15000)
  const [dureeGarde, setDureeGarde] = useState(5)
  const [aBorne, setABorne] = useState(true)

  // Mode de paiement
  const [modePaiement, setModePaiement] = useState('comptant') // 'comptant' | 'credit'
  const [apport, setApport] = useState(5000)
  const [dureeCreditAns, setDureeCreditAns] = useState(5)
  const [tauxCredit, setTauxCredit] = useState(TAUX_CREDIT_DEFAUT)

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

      // Coût du crédit (intérêts uniquement, le capital reste le prix)
      let credit = null
      let interetsCredit = 0
      let mensualite = 0
      if (modePaiement === 'credit' && prix > 0) {
        credit = calculerCredit({
          montant: prix,
          apport: Math.min(apport, prix),
          dureeMois: dureeCreditAns * 12,
          tauxAnnuel: tauxCredit,
        })
        interetsCredit = credit.interets
        mensualite = credit.mensualite
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
        credit,
      }
    }).sort((a, b) => a.tco - b.tco)
  }, [vehicules, kmAnnuel, dureeGarde, aBorne, modePaiement, apport, dureeCreditAns, tauxCredit])

  const top5 = vehiculesAvecTCO.slice(0, 5)

  const toggleExpand = (id) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const fmt = (n) => Math.round(n).toLocaleString('fr-FR')
  const couleurType = {
    essence: '#8B6F47',
    diesel: '#5C4033',
    hybride: '#5B7C99',
    hybride_rechargeable: '#2E5C7E',
    electrique: '#4A7C59',
  }

  return (
    <div style={S.container}>
      <header style={S.header}>
        <div style={S.kicker}>SIMULATEUR · COÛT D'UNE VOITURE · 2026</div>
        <h1 style={S.title}>
          Combien va vous coûter<br />
          <em style={S.titleItalic}>vraiment&nbsp;votre voiture&nbsp;?</em>
        </h1>
        <p style={S.subtitle}>
          Trois questions, une réponse claire.{' '}
          {stats && <>On compare <strong>{fmt(stats.totalVehicules)}</strong> modèles disponibles en France pour
          vous montrer ce que ça vous coûtera <em>chaque mois</em> — achat, essence, entretien, assurance compris.</>}
        </p>
      </header>

      <div style={S.layout}>
        {/* SIDEBAR — TROIS ÉTAPES */}
        <aside style={S.sidebar}>
          {/* ÉTAPE 1 — VOTRE USAGE */}
          <div style={S.section}>
            <div style={S.stepLabel}><span style={S.stepNum}>1</span> Votre usage</div>
            <p style={S.stepHelp}>Combien vous roulez et pendant combien de temps vous gardez la voiture.</p>

            <label style={S.label}>
              <span>Kilomètres par an</span>
              <span style={S.labelVal}>{fmt(kmAnnuel)} km</span>
            </label>
            <input type="range" min="5000" max="40000" step="1000"
              value={kmAnnuel} onChange={e => setKmAnnuel(+e.target.value)} style={S.slider}/>
            <div style={S.hint}>
              {kmAnnuel < 10000 && '🐢 Peu de trajets — surtout en ville'}
              {kmAnnuel >= 10000 && kmAnnuel < 20000 && '🚗 Usage moyen, mixte ville/route'}
              {kmAnnuel >= 20000 && '🛣️ Gros rouleur — beaucoup d\'autoroute'}
            </div>

            <label style={S.label}>
              <span>Vous la gardez combien de temps ?</span>
              <span style={S.labelVal}>{dureeGarde} ans</span>
            </label>
            <input type="range" min="2" max="10"
              value={dureeGarde} onChange={e => setDureeGarde(+e.target.value)} style={S.slider}/>
          </div>

          {/* ÉTAPE 2 — COMMENT VOUS PAYEZ */}
          <div style={S.section}>
            <div style={S.stepLabel}><span style={S.stepNum}>2</span> Comment vous payez ?</div>
            <p style={S.stepHelp}>Comptant si vous avez l'argent de côté, à crédit sinon.</p>

            <div style={S.toggleGroup} role="radiogroup">
              <button type="button" role="radio" aria-checked={modePaiement === 'comptant'}
                onClick={() => setModePaiement('comptant')}
                style={modePaiement === 'comptant' ? S.toggleActive : S.toggle}>
                💶 Comptant
              </button>
              <button type="button" role="radio" aria-checked={modePaiement === 'credit'}
                onClick={() => setModePaiement('credit')}
                style={modePaiement === 'credit' ? S.toggleActive : S.toggle}>
                🏦 À crédit
              </button>
            </div>

            {modePaiement === 'credit' && (
              <div style={S.creditBox}>
                <label style={S.label}>
                  <span>Apport personnel</span>
                  <span style={S.labelVal}>{fmt(apport)} €</span>
                </label>
                <input type="range" min="0" max="30000" step="500"
                  value={apport} onChange={e => setApport(+e.target.value)} style={S.slider}/>
                <div style={S.hint}>L'argent que vous mettez de votre poche au début.</div>

                <label style={S.label}>
                  <span>Durée du crédit</span>
                  <span style={S.labelVal}>{dureeCreditAns} ans</span>
                </label>
                <input type="range" min="1" max="7"
                  value={dureeCreditAns} onChange={e => setDureeCreditAns(+e.target.value)} style={S.slider}/>

                <label style={S.label}>
                  <span>Taux d'intérêt</span>
                  <span style={S.labelVal}>{tauxCredit.toFixed(1)} %</span>
                </label>
                <input type="range" min="0" max="10" step="0.1"
                  value={tauxCredit} onChange={e => setTauxCredit(+e.target.value)} style={S.slider}/>
                <div style={S.hint}>Taux moyen 2026 ≈ 5,5 %. Demandez à votre banque la valeur exacte.</div>
              </div>
            )}
          </div>

          {/* ÉTAPE 3 — RECHERCHE */}
          <div style={S.section}>
            <div style={S.stepLabel}><span style={S.stepNum}>3</span> Quelle voiture ?</div>
            <p style={S.stepHelp}>Filtrez par budget, type de voiture ou motorisation.</p>

            <label style={S.label}>
              <span>Budget maximum</span>
              <span style={S.labelVal}>{fmt(prixMax)} €</span>
            </label>
            <input type="range" min="10000" max="100000" step="2500"
              value={prixMax} onChange={e => setPrixMax(+e.target.value)} style={S.slider}/>

            <label style={S.label}><span>Type de voiture</span></label>
            <select value={filtreSegment} onChange={e => setFiltreSegment(e.target.value)} style={S.select}>
              <option value="">Tous les types</option>
              <option value="citadine">Citadine — petite, pour la ville</option>
              <option value="compacte">Compacte — polyvalente</option>
              <option value="berline">Berline — confort routier</option>
              <option value="SUV">SUV — surélevé, familial</option>
              <option value="break">Break — gros coffre</option>
              <option value="monospace">Monospace — famille nombreuse</option>
              <option value="coupe">Coupé</option>
              <option value="cabriolet">Cabriolet</option>
            </select>

            <label style={S.label}><span>Motorisation</span></label>
            <select value={filtreEnergie} onChange={e => setFiltreEnergie(e.target.value)} style={S.select}>
              <option value="">Toutes</option>
              <option value="essence">Essence</option>
              <option value="diesel">Diesel</option>
              <option value="hybride">Hybride (essence + élec.)</option>
              <option value="hybride_rechargeable">Hybride rechargeable</option>
              <option value="electrique">100 % électrique</option>
            </select>

            <label style={S.checkbox}>
              <input type="checkbox" checked={aBorne} onChange={e => setABorne(e.target.checked)}/>
              <span>J'ai (ou j'aurai) une borne à la maison</span>
            </label>
            <div style={S.hint}>Recharger chez soi coûte 3× moins cher qu'en borne publique.</div>
          </div>
        </aside>

        {/* RÉSULTATS */}
        <main style={S.results}>
          {loading && (
            <div style={S.loading}>Chargement des voitures…</div>
          )}

          {error && (
            <div style={S.error}>
              <strong>Petit souci technique :</strong> {error}
              <br/><br/>
              On n'arrive pas à charger la base de données. Si vous êtes l'administrateur,
              vérifiez les variables Supabase (VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY).
            </div>
          )}

          {!loading && !error && vehiculesAvecTCO.length === 0 && (
            <div style={S.empty}>
              <div style={{fontSize: 32, marginBottom: 8}}>🔍</div>
              Aucune voiture ne correspond à vos critères.
              <br/>Essayez d'augmenter votre budget ou d'élargir la recherche.
            </div>
          )}

          {!loading && !error && vehiculesAvecTCO.length > 0 && (
            <>
              {/* RÉSUMÉ EN HAUT — la réponse en une phrase */}
              {top5[0] && (
                <section style={S.heroAnswer}>
                  <div style={S.kicker}>La meilleure affaire pour vous</div>
                  <h2 style={S.heroTitle}>
                    {top5[0].marque} {top5[0].modele}
                  </h2>
                  <div style={S.heroLine}>
                    {modePaiement === 'credit' ? (
                      <>
                        <strong style={S.heroBig}>{fmt(top5[0].mensualite)} €/mois</strong>
                        <span style={S.heroSep}>de crédit, et</span>
                      </>
                    ) : null}
                    <strong style={S.heroBig}>{fmt(top5[0].coutMensuelMoyen)} €/mois</strong>
                    <span style={S.heroSep}>tout compris (essence, entretien, assurance, perte de valeur)</span>
                  </div>
                  <div style={S.heroSub}>
                    Soit <strong>{fmt(top5[0].tco)} €</strong> sur {dureeGarde} ans, ou {top5[0].coutAuKm.toFixed(2)} € par kilomètre parcouru.
                  </div>
                </section>
              )}

              {/* PODIUM */}
              {top5.length >= 2 && (
                <section style={S.podium}>
                  <div style={S.kicker}>Comparatif · Top {top5.length}</div>
                  <h2 style={S.h2}>Le classement en un coup d'œil</h2>
                  <p style={S.sectionIntro}>
                    Coût total estimé sur {dureeGarde} ans, du moins cher au plus cher.
                  </p>
                  <div style={S.podiumChart}>
                    <PodiumComparison vehicules={top5} dureeGarde={dureeGarde} />
                  </div>
                  <div style={S.legendRow}>
                    {Object.entries(couleurType).map(([k, c]) => (
                      <span key={k} style={S.legendItem}>
                        <span style={{...S.legendDot, background: c}} />
                        {k.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              <div style={S.kicker}>
                {vehiculesAvecTCO.length} voitures · de la moins chère à la plus chère sur {dureeGarde} ans
              </div>
              <h2 style={S.h2}>Toutes les voitures</h2>

              {vehiculesAvecTCO.map((v, i) => {
                const isOpen = expanded.has(v.vehicule_id)
                return (
                <article key={v.vehicule_id} style={{
                  ...S.card,
                  borderLeft: `4px solid ${couleurType[v.energie] || '#888'}`,
                  background: i === 0 ? '#FAF8F2' : '#FFF',
                }}>
                  <div style={S.cardHead}>
                    <div style={{flex: 1, minWidth: 0}}>
                      <div style={S.cardRank}>
                        {i === 0 && <span style={S.bestBadge}>LE PLUS AVANTAGEUX</span>}
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
                      {modePaiement === 'credit' && v.mensualite > 0 && (
                        <div style={S.mensualiteBox}>
                          <div style={S.tcoLabel}>Mensualité crédit</div>
                          <div style={S.tcoValue}>{fmt(v.mensualite)} €<span style={S.perMois}>/mois</span></div>
                        </div>
                      )}
                      <div style={S.tcoLabel}>Tout compris sur {dureeGarde} ans</div>
                      <div style={S.tcoValueLight}>{fmt(v.tco)} €</div>
                      <div style={S.tcoPerKm}>≈ {fmt(v.coutMensuelMoyen)} €/mois · {v.coutAuKm.toFixed(2)} €/km</div>
                    </div>
                  </div>

                  <div style={S.breakdown}>
                    {v.prix_min_eur && (
                      <div><div style={S.bdL}>Prix d'achat</div><div style={S.bdV}>{fmt(v.prix_min_eur)} €</div></div>
                    )}
                    {modePaiement === 'credit' && v.interetsCredit > 0 && (
                      <div><div style={S.bdL}>Intérêts crédit</div><div style={S.bdV}>{fmt(v.interetsCredit)} €</div></div>
                    )}
                    <div><div style={S.bdL}>{v.energie === 'electrique' ? 'Élec./an' : 'Carburant/an'}</div><div style={S.bdV}>{fmt(v.coutEnergieAnnuel)} €</div></div>
                    {v.conso_mixte && (
                      <div><div style={S.bdL}>Conso</div><div style={S.bdV}>{v.conso_mixte} L/100</div></div>
                    )}
                    {v.conso_elec_mixte && (
                      <div><div style={S.bdL}>Conso élec.</div><div style={S.bdV}>{v.conso_elec_mixte} kWh/100</div></div>
                    )}
                    {v.co2_g_km !== null && v.co2_g_km !== undefined && (
                      <div><div style={S.bdL}>CO₂</div><div style={S.bdV}>{v.co2_g_km} g/km</div></div>
                    )}
                    <div><div style={S.bdL}>Revente {dureeGarde} ans</div><div style={S.bdV}>{fmt(v.valeurRevente)} €</div></div>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleExpand(v.vehicule_id)}
                    style={S.expandBtn}
                    aria-expanded={isOpen}
                  >
                    {isOpen ? '— Masquer le détail' : '+ Voir le détail des coûts'}
                  </button>

                  {isOpen && (
                    <div style={S.charts}>
                      <div style={S.chartBlock}>
                        <div style={S.chartTitle}>D'où vient le coût ?</div>
                        <p style={S.chartHelp}>
                          La barre montre comment se répartissent les {fmt(v.tco)} € sur {dureeGarde} ans.
                          La valeur de revente est déduite à la fin (en vert).
                        </p>
                        <TcoBreakdown v={v} dureeGarde={dureeGarde} />
                      </div>
                      <div style={S.chartBlock}>
                        <div style={S.chartTitle}>Si vous revendez avant ?</div>
                        <p style={S.chartHelp}>
                          Voici ce que la voiture vous aura vraiment coûté si vous la revendez après 1, 2, 3… ans.
                        </p>
                        <TcoEvolution v={v} dureeGarde={dureeGarde} />
                      </div>
                    </div>
                  )}
                </article>
              )})}
            </>
          )}

          <footer style={S.footer}>
            <p style={S.footerNote}>
              <strong>D'où viennent ces chiffres ?</strong> La consommation, le CO₂ et la puissance
              proviennent de l'<strong>ADEME</strong> (Carlabelling, Licence Ouverte 2.0). Les prix de l'énergie
              sont des moyennes 2026 (essence 2,03 €/L, diesel 1,78 €/L, électricité 0,16 €/kWh à domicile).
              L'assurance et l'entretien sont des estimations moyennes. La revente est calculée avec une décote
              de 13 %/an (16 %/an pour l'électrique). <em>Ce simulateur est indicatif et ne remplace pas un devis.</em>
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
    fontSize: 16,
  },
  header: { maxWidth: 1200, margin: '0 auto 40px' },
  kicker: { fontSize: 11, letterSpacing: '0.2em', fontWeight: 600, color: '#666', marginBottom: 12 },
  title: {
    fontFamily: 'Georgia, "Tiempos Headline", serif',
    fontSize: 'clamp(32px, 5vw, 56px)', lineHeight: 1.05, fontWeight: 400,
    margin: 0, letterSpacing: '-0.02em',
  },
  titleItalic: { fontStyle: 'italic', color: '#8B6F47' },
  subtitle: { fontSize: 17, color: '#333', maxWidth: 680, marginTop: 18, lineHeight: 1.5 },
  layout: {
    display: 'grid', gridTemplateColumns: 'minmax(280px, 340px) 1fr',
    gap: 40, maxWidth: 1200, margin: '0 auto',
  },
  sidebar: { display: 'flex', flexDirection: 'column', gap: 28, position: 'sticky', top: 24, alignSelf: 'start' },
  section: { borderTop: '1px solid #1A1A1A', paddingTop: 18 },
  stepLabel: {
    fontSize: 16, fontWeight: 700, marginBottom: 6, color: '#1A1A1A',
    display: 'flex', alignItems: 'center', gap: 10,
  },
  stepNum: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: 24, height: 24, borderRadius: '50%', background: '#1A1A1A', color: '#F4F1EA',
    fontSize: 12, fontWeight: 700,
  },
  stepHelp: { fontSize: 13, color: '#666', margin: '0 0 14px', lineHeight: 1.5 },
  label: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
    fontSize: 14, fontWeight: 500, marginBottom: 6, marginTop: 14, color: '#1A1A1A',
    gap: 8,
  },
  labelVal: { fontFamily: 'monospace', fontWeight: 700, color: '#1A1A1A' },
  slider: { width: '100%', accentColor: '#1A1A1A', height: 8 },
  hint: { fontSize: 12, color: '#888', marginTop: 4, lineHeight: 1.4, fontStyle: 'italic' },
  select: {
    width: '100%', padding: '12px 12px', fontSize: 14,
    border: '1px solid #1A1A1A', background: '#FFF', borderRadius: 0,
  },
  checkbox: {
    display: 'flex', alignItems: 'center', gap: 10,
    fontSize: 14, padding: '12px 0', cursor: 'pointer',
  },
  toggleGroup: {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8,
  },
  toggle: {
    padding: '12px 8px', fontSize: 14, fontWeight: 600,
    background: '#FFF', border: '1px solid #CFC8B8', cursor: 'pointer',
    color: '#666',
  },
  toggleActive: {
    padding: '12px 8px', fontSize: 14, fontWeight: 700,
    background: '#1A1A1A', border: '1px solid #1A1A1A', cursor: 'pointer',
    color: '#F4F1EA',
  },
  creditBox: {
    marginTop: 14, padding: 14, background: '#FAF8F2',
    border: '1px solid #E5E0D5',
  },
  results: { display: 'flex', flexDirection: 'column', gap: 16 },
  h2: {
    fontFamily: 'Georgia, serif', fontSize: 26, fontWeight: 400,
    margin: '8px 0 6px', letterSpacing: '-0.01em',
  },
  sectionIntro: { fontSize: 14, color: '#555', margin: '0 0 14px' },
  loading: { padding: 40, textAlign: 'center', color: '#666', fontSize: 16 },
  error: {
    padding: 24, background: '#FFF4E6', border: '1px solid #C44',
    color: '#8B4513', fontSize: 14, lineHeight: 1.6,
  },
  empty: {
    padding: 40, textAlign: 'center', color: '#666', background: '#FFF',
    border: '1px dashed #CCC', fontSize: 16, lineHeight: 1.6,
  },
  heroAnswer: {
    background: '#1A1A1A', color: '#F4F1EA', padding: '28px 32px',
    marginBottom: 8,
  },
  heroTitle: {
    fontFamily: 'Georgia, serif', fontSize: 32, fontWeight: 400,
    margin: '4px 0 12px', color: '#F4F1EA',
  },
  heroLine: {
    display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: 8,
    fontSize: 15, lineHeight: 1.5, color: '#D9D2C2',
  },
  heroBig: {
    fontFamily: 'Georgia, serif', fontSize: 28, fontWeight: 400, color: '#F4F1EA',
  },
  heroSep: { color: '#A89F8A' },
  heroSub: { fontSize: 13, color: '#A89F8A', marginTop: 12, lineHeight: 1.5 },
  podium: {
    background: '#FFF', border: '1px solid #E5E0D5',
    padding: '24px 28px', marginBottom: 8,
  },
  podiumChart: { marginTop: 8 },
  legendRow: {
    display: 'flex', flexWrap: 'wrap', gap: 16,
    marginTop: 12, paddingTop: 12, borderTop: '1px solid #F0EBE0',
    fontSize: 11, color: '#666', textTransform: 'capitalize',
  },
  legendItem: { display: 'inline-flex', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, display: 'inline-block', borderRadius: 1 },
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
  cardTco: { textAlign: 'right', minWidth: 180 },
  mensualiteBox: {
    background: '#FAF8F2', padding: '8px 12px', marginBottom: 10,
    borderLeft: '3px solid #1A1A1A',
  },
  tcoLabel: { fontSize: 10, letterSpacing: '0.15em', fontWeight: 700, color: '#888', marginBottom: 4 },
  tcoValue: { fontFamily: 'Georgia, serif', fontSize: 28, fontWeight: 400, lineHeight: 1, color: '#1A1A1A' },
  tcoValueLight: { fontFamily: 'Georgia, serif', fontSize: 22, fontWeight: 400, lineHeight: 1, color: '#444' },
  perMois: { fontSize: 13, fontFamily: '-apple-system, sans-serif', color: '#666', marginLeft: 4 },
  tcoPerKm: { fontFamily: 'monospace', fontSize: 12, color: '#666', marginTop: 6 },
  breakdown: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
    gap: 12, paddingTop: 14, borderTop: '1px solid #F0EBE0',
  },
  bdL: { fontSize: 10, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 },
  bdV: { fontFamily: 'monospace', fontSize: 13, fontWeight: 600 },
  expandBtn: {
    marginTop: 14, padding: '10px 14px', background: 'transparent',
    border: '1px solid #1A1A1A', color: '#1A1A1A', cursor: 'pointer',
    fontSize: 11, letterSpacing: '0.12em', fontWeight: 700,
    textTransform: 'uppercase',
  },
  charts: {
    marginTop: 18, paddingTop: 18, borderTop: '1px solid #F0EBE0',
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: 24,
  },
  chartBlock: {},
  chartTitle: {
    fontSize: 11, letterSpacing: '0.15em', fontWeight: 700, color: '#666',
    textTransform: 'uppercase', marginBottom: 8,
  },
  chartHelp: { fontSize: 12, color: '#777', margin: '0 0 8px', lineHeight: 1.5 },
  footer: { marginTop: 24, paddingTop: 24, borderTop: '1px solid #1A1A1A' },
  footerNote: { fontSize: 13, lineHeight: 1.6, color: '#666', maxWidth: 760 },
}
