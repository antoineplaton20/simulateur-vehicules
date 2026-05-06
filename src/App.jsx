import React, { useState, useEffect, useMemo } from 'react'
import { fetchVehicules, fetchStats } from './supabase'
import { PodiumComparison, TcoBreakdown, TcoEvolution } from './charts.jsx'

// ============================================================
// CONSTANTES
// ============================================================
const PRIX = {
  essence: 2.03,
  diesel: 1.78,
  elec_hc: 0.1579,
  elec_borne: 0.45,
}

const TAUX_CREDIT_DEFAUT = 5.5

const VALEURS_DEFAUT = {
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

const LIBELLE_ENERGIE = {
  essence: 'Essence',
  diesel: 'Diesel',
  hybride: 'Hybride',
  hybride_rechargeable: 'Hybride rechargeable',
  electrique: 'Électrique',
}

const LIBELLE_SEGMENT = {
  citadine: 'Citadine',
  compacte: 'Compacte',
  berline: 'Berline',
  SUV: 'SUV',
  break: 'Break',
  monospace: 'Monospace',
  coupe: 'Coupé',
  cabriolet: 'Cabriolet',
}

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

const fmt = (n) => Math.round(n).toLocaleString('fr-FR')

// ============================================================
// COMPOSANT STEPPER (slider + boutons +/−)
// ============================================================
function Stepper({ label, value, min, max, step = 1, onChange, suffix = '', help }) {
  const dec = () => onChange(Math.max(min, value - step))
  const inc = () => onChange(Math.min(max, value + step))
  return (
    <div style={S.stepperWrap}>
      <div style={S.label}>{label}</div>
      <div style={S.stepperRow}>
        <button type="button" onClick={dec} style={S.stepBtn} aria-label={`Diminuer ${label}`}>−</button>
        <div style={S.stepperValue}>
          {fmt(value)}<span style={S.stepperSuffix}>{suffix}</span>
        </div>
        <button type="button" onClick={inc} style={S.stepBtn} aria-label={`Augmenter ${label}`}>+</button>
      </div>
      <input
        type="range"
        min={min} max={max} step={step}
        value={value}
        onChange={(e) => onChange(+e.target.value)}
        style={S.slider}
        aria-label={label}
      />
      {help && <div style={S.hint}>{help}</div>}
    </div>
  )
}

// ============================================================
// COMPOSANT INFO (?) — explication au clic
// ============================================================
function Info({ children, label = 'Plus d\'infos' }) {
  return (
    <details className="info" style={S.infoDetails}>
      <summary style={S.infoToggle} aria-label={label}>?</summary>
      <div style={S.infoContent}>{children}</div>
    </details>
  )
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

  const [filtreSegment, setFiltreSegment] = useState(VALEURS_DEFAUT.filtreSegment)
  const [filtreEnergie, setFiltreEnergie] = useState(VALEURS_DEFAUT.filtreEnergie)
  const [prixMax, setPrixMax] = useState(VALEURS_DEFAUT.prixMax)
  const [kmAnnuel, setKmAnnuel] = useState(VALEURS_DEFAUT.kmAnnuel)
  const [dureeGarde, setDureeGarde] = useState(VALEURS_DEFAUT.dureeGarde)
  const [aBorne, setABorne] = useState(VALEURS_DEFAUT.aBorne)
  const [modePaiement, setModePaiement] = useState(VALEURS_DEFAUT.modePaiement)
  const [apport, setApport] = useState(VALEURS_DEFAUT.apport)
  const [dureeCreditAns, setDureeCreditAns] = useState(VALEURS_DEFAUT.dureeCreditAns)
  const [tauxCredit, setTauxCredit] = useState(VALEURS_DEFAUT.tauxCredit)

  const reinitialiser = () => {
    setFiltreSegment(VALEURS_DEFAUT.filtreSegment)
    setFiltreEnergie(VALEURS_DEFAUT.filtreEnergie)
    setPrixMax(VALEURS_DEFAUT.prixMax)
    setKmAnnuel(VALEURS_DEFAUT.kmAnnuel)
    setDureeGarde(VALEURS_DEFAUT.dureeGarde)
    setABorne(VALEURS_DEFAUT.aBorne)
    setModePaiement(VALEURS_DEFAUT.modePaiement)
    setApport(VALEURS_DEFAUT.apport)
    setDureeCreditAns(VALEURS_DEFAUT.dureeCreditAns)
    setTauxCredit(VALEURS_DEFAUT.tauxCredit)
    setExpanded(new Set())
  }

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

      let interetsCredit = 0
      let mensualite = 0
      let credit = null
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

  const couleurType = {
    essence: '#8B6F47',
    diesel: '#5C4033',
    hybride: '#5B7C99',
    hybride_rechargeable: '#2E5C7E',
    electrique: '#4A7C59',
  }

  return (
    <div className="app-container" style={S.container}>
      <header style={S.header}>
        <div style={S.kicker}>SIMULATEUR · COÛT D'UNE VOITURE · 2026</div>
        <h1 style={S.title}>
          Combien va vous coûter<br />
          <em style={S.titleItalic}>vraiment&nbsp;votre voiture&nbsp;?</em>
        </h1>
        <p style={S.subtitle}>
          Trois questions, une réponse claire.{' '}
          {stats && <>On compare <strong>{fmt(stats.totalVehicules)}</strong> modèles disponibles en France
          pour vous montrer ce que ça vous coûtera <em>chaque mois</em> — achat, essence, entretien,
          assurance compris.</>}
        </p>
      </header>

      <div className="layout-grid">
        {/* SIDEBAR */}
        <aside className="sidebar-sticky">
          <button type="button" onClick={reinitialiser} style={S.resetBtn}>
            ↺ Tout réinitialiser
          </button>

          {/* ÉTAPE 1 */}
          <div style={S.section}>
            <div style={S.stepLabel}><span style={S.stepNum}>1</span> Votre usage</div>
            <p style={S.stepHelp}>Combien vous roulez et pendant combien de temps vous gardez la voiture.</p>

            <Stepper
              label="Kilomètres par an"
              value={kmAnnuel} min={5000} max={40000} step={1000}
              onChange={setKmAnnuel} suffix=" km"
              help={
                kmAnnuel < 10000 ? 'Peu de trajets — surtout en ville.' :
                kmAnnuel < 20000 ? 'Usage moyen, mixte ville et route.' :
                'Gros rouleur — beaucoup d\'autoroute.'
              }
            />

            <Stepper
              label="Vous la gardez combien de temps ?"
              value={dureeGarde} min={2} max={10} step={1}
              onChange={setDureeGarde} suffix=" ans"
            />
          </div>

          {/* ÉTAPE 2 */}
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
                <Stepper
                  label={<>Apport personnel <Info label="Qu'est-ce que l'apport ?">L'argent que vous mettez de votre poche au début, avant le crédit. Plus il est élevé, moins vous payez d'intérêts.</Info></>}
                  value={apport} min={0} max={30000} step={500}
                  onChange={setApport} suffix=" €"
                />
                <Stepper
                  label="Durée du crédit"
                  value={dureeCreditAns} min={1} max={7} step={1}
                  onChange={setDureeCreditAns} suffix=" ans"
                />
                <div style={S.tauxBlock}>
                  <div style={S.label}>
                    Taux d'intérêt <Info label="Qu'est-ce que le taux ?">Le pourcentage que la banque facture chaque année pour vous prêter l'argent. Demandez la valeur exacte à votre banque — moyenne 2026 ≈ 5,5 %.</Info>
                    <span style={S.labelValRight}>{tauxCredit.toFixed(1)} %</span>
                  </div>
                  <div style={S.stepperRow}>
                    <button type="button" onClick={() => setTauxCredit(Math.max(0, +(tauxCredit - 0.5).toFixed(1)))} style={S.stepBtn} aria-label="Diminuer le taux">−</button>
                    <div style={S.stepperValue}>{tauxCredit.toFixed(1)}<span style={S.stepperSuffix}> %</span></div>
                    <button type="button" onClick={() => setTauxCredit(Math.min(10, +(tauxCredit + 0.5).toFixed(1)))} style={S.stepBtn} aria-label="Augmenter le taux">+</button>
                  </div>
                  <input type="range" min="0" max="10" step="0.1"
                    value={tauxCredit} onChange={e => setTauxCredit(+e.target.value)} style={S.slider}/>
                </div>
              </div>
            )}
          </div>

          {/* ÉTAPE 3 */}
          <div style={S.section}>
            <div style={S.stepLabel}><span style={S.stepNum}>3</span> Quelle voiture ?</div>
            <p style={S.stepHelp}>Filtrez par budget, type de voiture ou motorisation.</p>

            <Stepper
              label="Budget maximum"
              value={prixMax} min={10000} max={100000} step={2500}
              onChange={setPrixMax} suffix=" €"
            />

            <label style={S.label}>Type de voiture</label>
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

            <label style={S.label}>Motorisation</label>
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
              <div style={{fontSize: 36, marginBottom: 8}}>🔍</div>
              Aucune voiture ne correspond à vos critères.
              <br/>Essayez d'augmenter votre budget ou cliquez sur « Tout réinitialiser ».
            </div>
          )}

          {!loading && !error && vehiculesAvecTCO.length > 0 && (
            <>
              {top5[0] && (
                <section className="hero-answer" style={S.heroAnswer}>
                  <div style={S.kickerLight}>La meilleure affaire pour vous</div>
                  <h2 style={S.heroTitle}>
                    {top5[0].marque} {top5[0].modele}
                  </h2>
                  {modePaiement === 'credit' && top5[0].mensualite > 0 && (
                    <div style={S.heroLine}>
                      <strong style={S.heroBig}>{fmt(top5[0].mensualite)} €/mois</strong>
                      <span style={S.heroSep}>de mensualité de crédit</span>
                    </div>
                  )}
                  <div style={S.heroLine}>
                    <strong style={S.heroBig}>{fmt(top5[0].coutMensuelMoyen)} €/mois</strong>
                    <span style={S.heroSep}>tout compris</span>
                  </div>
                  <div style={S.heroSub}>
                    « Tout compris » = achat + essence + entretien + assurance + perte de valeur, sur {dureeGarde} ans.
                    Soit <strong>{fmt(top5[0].tco)} €</strong> au total.
                  </div>
                </section>
              )}

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
                        {LIBELLE_ENERGIE[k] || k}
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
                <article key={v.vehicule_id} className="card" style={{
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
                          <span style={S.critairWrap}>
                            <span style={{
                              ...S.critair,
                              background: v.critair === 'E' ? '#4A7C59' : '#F0EBE0',
                              color: v.critair === 'E' ? '#FFF' : '#444',
                            }}>Crit'Air {v.critair}</span>
                            <Info label="Qu'est-ce que Crit'Air ?">
                              Vignette anti-pollution obligatoire dans certaines villes.
                              Plus le chiffre est bas, mieux c'est. <strong>E</strong> = électrique (le plus propre).
                            </Info>
                          </span>
                        )}
                      </div>
                      <h3 style={S.cardTitle}>{v.marque} {v.modele}</h3>
                      <div style={S.cardMeta}>
                        {v.finition && <span>{v.finition} · </span>}
                        {LIBELLE_ENERGIE[v.energie] || v.energie} · {v.puissance_max_ch || '?'} ch
                        {v.segment && ` · ${LIBELLE_SEGMENT[v.segment] || v.segment}`}
                      </div>
                    </div>
                    <div style={S.cardTco}>
                      {modePaiement === 'credit' && v.mensualite > 0 && (
                        <div style={S.mensualiteBox}>
                          <div style={S.tcoLabel}>À payer chaque mois (crédit)</div>
                          <div style={S.tcoValue}>{fmt(v.mensualite)} €<span style={S.perMois}>/mois</span></div>
                        </div>
                      )}
                      <div style={S.tcoLabel}>Tout compris sur {dureeGarde} ans</div>
                      <div style={S.tcoValueLight}>{fmt(v.tco)} €</div>
                      <div style={S.tcoPerKm}>≈ {fmt(v.coutMensuelMoyen)} €/mois</div>
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
                    {isOpen ? '− Masquer le détail' : '+ Voir le détail des coûts'}
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
  },
  header: { maxWidth: 1200, margin: '0 auto 40px' },
  kicker: { fontSize: 13, letterSpacing: '0.18em', fontWeight: 700, color: '#555', marginBottom: 12, textTransform: 'uppercase' },
  kickerLight: { fontSize: 13, letterSpacing: '0.18em', fontWeight: 700, color: '#A89F8A', marginBottom: 12, textTransform: 'uppercase' },
  title: {
    fontFamily: 'Georgia, "Tiempos Headline", serif',
    fontSize: 'clamp(34px, 5vw, 58px)', lineHeight: 1.05, fontWeight: 400,
    margin: 0, letterSpacing: '-0.02em',
  },
  titleItalic: { fontStyle: 'italic', color: '#8B6F47' },
  subtitle: { fontSize: 18, color: '#222', maxWidth: 700, marginTop: 18, lineHeight: 1.55 },
  /* layout/sidebar gérés par index.css (.layout-grid, .sidebar-sticky) */
  resetBtn: {
    padding: '10px 14px', background: 'transparent',
    border: '1.5px solid #1A1A1A', color: '#1A1A1A', cursor: 'pointer',
    fontSize: 14, fontWeight: 600, alignSelf: 'flex-start',
  },
  section: { borderTop: '1.5px solid #1A1A1A', paddingTop: 18 },
  stepLabel: {
    fontSize: 18, fontWeight: 700, marginBottom: 8, color: '#1A1A1A',
    display: 'flex', alignItems: 'center', gap: 12,
  },
  stepNum: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: 28, height: 28, borderRadius: '50%', background: '#1A1A1A', color: '#F4F1EA',
    fontSize: 14, fontWeight: 700,
  },
  stepHelp: { fontSize: 14, color: '#555', margin: '0 0 16px', lineHeight: 1.5 },
  label: {
    display: 'flex', alignItems: 'center', gap: 8,
    fontSize: 15, fontWeight: 600, marginBottom: 8, color: '#1A1A1A',
  },
  labelValRight: { marginLeft: 'auto', fontFamily: 'monospace', fontWeight: 700 },
  stepperWrap: { marginTop: 16 },
  stepperRow: {
    display: 'grid', gridTemplateColumns: 'auto 1fr auto',
    gap: 8, alignItems: 'center', marginBottom: 8,
  },
  stepBtn: {
    width: 44, height: 44, fontSize: 22, fontWeight: 700,
    background: '#FFF', border: '1.5px solid #1A1A1A', color: '#1A1A1A',
    cursor: 'pointer', lineHeight: 1, padding: 0,
  },
  stepperValue: {
    textAlign: 'center', fontSize: 20, fontWeight: 700,
    fontFamily: 'Georgia, serif',
    border: '1.5px solid #1A1A1A', padding: '8px 6px', background: '#FFF',
  },
  stepperSuffix: { fontSize: 14, fontWeight: 500, color: '#555', marginLeft: 2 },
  slider: { width: '100%', accentColor: '#1A1A1A', height: 8 },
  hint: { fontSize: 13, color: '#555', marginTop: 8, lineHeight: 1.5, fontStyle: 'italic' },
  select: {
    width: '100%', padding: '12px 14px', fontSize: 15,
    border: '1.5px solid #1A1A1A', background: '#FFF', borderRadius: 0,
    color: '#1A1A1A',
  },
  checkbox: {
    display: 'flex', alignItems: 'center', gap: 12,
    fontSize: 15, padding: '14px 0', cursor: 'pointer', fontWeight: 500,
  },
  toggleGroup: {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8,
  },
  toggle: {
    padding: '14px 8px', fontSize: 15, fontWeight: 600,
    background: '#FFF', border: '1.5px solid #CFC8B8', cursor: 'pointer',
    color: '#555',
  },
  toggleActive: {
    padding: '14px 8px', fontSize: 15, fontWeight: 700,
    background: '#1A1A1A', border: '1.5px solid #1A1A1A', cursor: 'pointer',
    color: '#F4F1EA',
  },
  creditBox: {
    marginTop: 14, padding: 16, background: '#FAF8F2',
    border: '1.5px solid #E5E0D5',
  },
  tauxBlock: { marginTop: 16 },
  infoDetails: {
    display: 'inline-block', position: 'relative', marginLeft: 4,
  },
  infoToggle: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: 22, height: 22, borderRadius: '50%',
    background: '#E5E0D5', color: '#1A1A1A',
    fontSize: 13, fontWeight: 700,
  },
  infoContent: {
    position: 'absolute', top: '100%', left: 0, marginTop: 6, zIndex: 10,
    background: '#1A1A1A', color: '#F4F1EA', padding: '12px 14px',
    fontSize: 14, lineHeight: 1.5, fontWeight: 400, fontStyle: 'normal',
    width: 240, boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  },
  results: { display: 'flex', flexDirection: 'column', gap: 16 },
  h2: {
    fontFamily: 'Georgia, serif', fontSize: 28, fontWeight: 400,
    margin: '8px 0 6px', letterSpacing: '-0.01em',
  },
  sectionIntro: { fontSize: 15, color: '#444', margin: '0 0 14px' },
  loading: { padding: 40, textAlign: 'center', color: '#444', fontSize: 17 },
  error: {
    padding: 24, background: '#FFF4E6', border: '1.5px solid #C44',
    color: '#8B4513', fontSize: 15, lineHeight: 1.6,
  },
  empty: {
    padding: 40, textAlign: 'center', color: '#444', background: '#FFF',
    border: '1.5px dashed #CCC', fontSize: 17, lineHeight: 1.6,
  },
  heroAnswer: {
    background: '#1A1A1A', color: '#F4F1EA', padding: '32px 36px',
    marginBottom: 8,
  },
  heroTitle: {
    fontFamily: 'Georgia, serif', fontSize: 36, fontWeight: 400,
    margin: '4px 0 16px', color: '#F4F1EA',
  },
  heroLine: {
    display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: 10,
    fontSize: 16, lineHeight: 1.5, color: '#D9D2C2', marginBottom: 8,
  },
  heroBig: {
    fontFamily: 'Georgia, serif', fontSize: 30, fontWeight: 400, color: '#F4F1EA',
  },
  heroSep: { color: '#A89F8A', fontSize: 16 },
  heroSub: { fontSize: 14, color: '#A89F8A', marginTop: 14, lineHeight: 1.6 },
  podium: {
    background: '#FFF', border: '1.5px solid #E5E0D5',
    padding: '24px 28px', marginBottom: 8,
  },
  podiumChart: { marginTop: 8 },
  legendRow: {
    display: 'flex', flexWrap: 'wrap', gap: 16,
    marginTop: 12, paddingTop: 12, borderTop: '1px solid #F0EBE0',
    fontSize: 13, color: '#555',
  },
  legendItem: { display: 'inline-flex', alignItems: 'center', gap: 6 },
  legendDot: { width: 12, height: 12, display: 'inline-block', borderRadius: 1 },
  card: { background: '#FFF', padding: '24px 28px', border: '1.5px solid #E5E0D5' },
  cardHead: {
    display: 'flex', justifyContent: 'space-between', gap: 20,
    marginBottom: 16, flexWrap: 'wrap',
  },
  cardRank: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' },
  bestBadge: {
    fontSize: 11, letterSpacing: '0.16em', fontWeight: 700,
    background: '#1A1A1A', color: '#F4F1EA', padding: '5px 10px',
  },
  rankNum: { fontSize: 13, fontFamily: 'monospace', fontWeight: 700, color: '#666' },
  critairWrap: { display: 'inline-flex', alignItems: 'center', gap: 4 },
  critair: { fontSize: 12, fontWeight: 700, padding: '4px 8px', letterSpacing: '0.05em' },
  cardTitle: { fontFamily: 'Georgia, serif', fontSize: 24, fontWeight: 400, margin: '0 0 6px' },
  cardMeta: { fontSize: 14, color: '#555' },
  cardTco: { textAlign: 'right', minWidth: 200 },
  mensualiteBox: {
    background: '#FAF8F2', padding: '10px 14px', marginBottom: 12,
    borderLeft: '3px solid #1A1A1A',
  },
  tcoLabel: { fontSize: 12, letterSpacing: '0.12em', fontWeight: 700, color: '#666', marginBottom: 4, textTransform: 'uppercase' },
  tcoValue: { fontFamily: 'Georgia, serif', fontSize: 30, fontWeight: 400, lineHeight: 1, color: '#1A1A1A' },
  tcoValueLight: { fontFamily: 'Georgia, serif', fontSize: 24, fontWeight: 400, lineHeight: 1, color: '#444' },
  perMois: { fontSize: 14, fontFamily: '-apple-system, sans-serif', color: '#666', marginLeft: 4 },
  tcoPerKm: { fontFamily: 'monospace', fontSize: 13, color: '#555', marginTop: 6 },
  breakdown: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: 14, paddingTop: 14, borderTop: '1px solid #F0EBE0',
  },
  bdL: { fontSize: 12, fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 },
  bdV: { fontFamily: 'monospace', fontSize: 14, fontWeight: 700, color: '#1A1A1A' },
  expandBtn: {
    marginTop: 16, padding: '12px 16px', background: 'transparent',
    border: '1.5px solid #1A1A1A', color: '#1A1A1A', cursor: 'pointer',
    fontSize: 13, letterSpacing: '0.1em', fontWeight: 700,
    textTransform: 'uppercase',
  },
  charts: {
    marginTop: 18, paddingTop: 18, borderTop: '1px solid #F0EBE0',
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: 24,
  },
  chartBlock: {},
  chartTitle: {
    fontSize: 13, letterSpacing: '0.12em', fontWeight: 700, color: '#555',
    textTransform: 'uppercase', marginBottom: 8,
  },
  chartHelp: { fontSize: 13, color: '#555', margin: '0 0 8px', lineHeight: 1.5 },
  footer: { marginTop: 24, paddingTop: 24, borderTop: '1.5px solid #1A1A1A' },
  footerNote: { fontSize: 14, lineHeight: 1.6, color: '#555', maxWidth: 760 },
}
