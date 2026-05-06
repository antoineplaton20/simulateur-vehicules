import React, { useMemo, useState } from 'react'
import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors, sizes, fmt } from '../theme'
import {
  VALEURS_DEFAUT, SEGMENTS, ENERGIES,
} from '../constants'
import { DEMO_VEHICULES } from '../demoData'
import { calculerTCO, appliquerFiltres } from '../calc'
import Stepper from '../components/Stepper'
import SelectField from '../components/SelectField'
import InfoButton from '../components/InfoButton'
import VehiculeCard from '../components/VehiculeCard'

export default function HomeScreen() {
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
  }

  const resultats = useMemo(() => {
    const filtres = appliquerFiltres(DEMO_VEHICULES, {
      segment: filtreSegment, energie: filtreEnergie, prixMax,
    })
    const params = { kmAnnuel, dureeGarde, aBorne, modePaiement, apport, dureeCreditAns, tauxCredit }
    return filtres
      .map((v) => calculerTCO(v, params))
      .sort((a, b) => a.tco - b.tco)
  }, [filtreSegment, filtreEnergie, prixMax, kmAnnuel, dureeGarde, aBorne, modePaiement, apport, dureeCreditAns, tauxCredit])

  const meilleur = resultats[0]
  const kmHelp =
    kmAnnuel < 10000 ? 'Peu de trajets — surtout en ville.' :
    kmAnnuel < 20000 ? 'Usage moyen, mixte ville et route.' :
    'Gros rouleur — beaucoup d\'autoroute.'

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.kicker}>SIMULATEUR · COÛT D'UNE VOITURE · 2026</Text>
          <Text style={styles.h1}>
            Combien va vous coûter{'\n'}
            <Text style={styles.h1Italic}>vraiment votre voiture ?</Text>
          </Text>
          <Text style={styles.subtitle}>
            Trois questions, une réponse claire. On compare {DEMO_VEHICULES.length} voitures pour vous montrer
            ce que ça vous coûtera <Text style={{ fontStyle: 'italic' }}>chaque mois</Text> — achat, essence,
            entretien, assurance compris.
          </Text>
        </View>

        {/* RÉINITIALISER */}
        <Pressable onPress={reinitialiser} style={({ pressed }) => [styles.resetBtn, pressed && styles.resetBtnPressed]}>
          <Text style={styles.resetText}>↺ Tout réinitialiser</Text>
        </Pressable>

        {/* ÉTAPE 1 */}
        <Section number="1" title="Votre usage" help="Combien vous roulez et pendant combien de temps vous gardez la voiture.">
          <Stepper
            label="Kilomètres par an" value={kmAnnuel} min={5000} max={40000} step={1000}
            onChange={setKmAnnuel} suffix=" km" help={kmHelp}
          />
          <Stepper
            label="Vous la gardez combien de temps ?" value={dureeGarde} min={2} max={10} step={1}
            onChange={setDureeGarde} suffix=" ans"
          />
        </Section>

        {/* ÉTAPE 2 */}
        <Section number="2" title="Comment vous payez ?" help="Comptant si vous avez l'argent de côté, à crédit sinon.">
          <View style={styles.toggleRow}>
            <ToggleBtn label="💶 Comptant" active={modePaiement === 'comptant'} onPress={() => setModePaiement('comptant')} />
            <ToggleBtn label="🏦 À crédit" active={modePaiement === 'credit'} onPress={() => setModePaiement('credit')} />
          </View>

          {modePaiement === 'credit' ? (
            <View style={styles.creditBox}>
              <View style={styles.labelRow}>
                <Text style={styles.labelInline}>Apport personnel</Text>
                <InfoButton title="Qu'est-ce que l'apport ?">
                  L'argent que vous mettez de votre poche au début, avant le crédit. Plus il est élevé, moins vous payez d'intérêts.
                </InfoButton>
              </View>
              <Stepper label="" value={apport} min={0} max={30000} step={500} onChange={setApport} suffix=" €" />
              <Stepper
                label="Durée du crédit" value={dureeCreditAns} min={1} max={7} step={1}
                onChange={setDureeCreditAns} suffix=" ans"
              />
              <View style={styles.labelRow}>
                <Text style={styles.labelInline}>Taux d'intérêt</Text>
                <InfoButton title="Qu'est-ce que le taux ?">
                  Le pourcentage que la banque facture chaque année pour vous prêter l'argent. Demandez la valeur exacte à votre banque — moyenne 2026 ≈ 5,5 %.
                </InfoButton>
              </View>
              <Stepper
                label="" value={tauxCredit} min={0} max={10} step={0.5}
                onChange={(v) => setTauxCredit(+v.toFixed(1))}
                suffix=" %"
                format={(v) => v.toFixed(1)}
              />
            </View>
          ) : null}
        </Section>

        {/* ÉTAPE 3 */}
        <Section number="3" title="Quelle voiture ?" help="Filtrez par budget, type de voiture ou motorisation.">
          <Stepper
            label="Budget maximum" value={prixMax} min={10000} max={100000} step={2500}
            onChange={setPrixMax} suffix=" €"
          />
          <SelectField label="Type de voiture" value={filtreSegment} options={SEGMENTS} onChange={setFiltreSegment} />
          <SelectField label="Motorisation" value={filtreEnergie} options={ENERGIES} onChange={setFiltreEnergie} />

          <Pressable onPress={() => setABorne(!aBorne)} style={styles.checkRow}>
            <View style={[styles.checkbox, aBorne && styles.checkboxOn]}>
              {aBorne ? <Text style={styles.checkboxTick}>✓</Text> : null}
            </View>
            <Text style={styles.checkLabel}>J'ai (ou j'aurai) une borne à la maison</Text>
          </Pressable>
          <Text style={styles.help}>Recharger chez soi coûte 3× moins cher qu'en borne publique.</Text>
        </Section>

        {/* RÉSULTATS */}
        {resultats.length === 0 ? (
          <View style={styles.empty}>
            <Text style={{ fontSize: 36, marginBottom: 8 }}>🔍</Text>
            <Text style={styles.emptyText}>
              Aucune voiture ne correspond à vos critères.{'\n'}
              Essayez d'augmenter votre budget ou réinitialisez.
            </Text>
          </View>
        ) : (
          <>
            {meilleur ? (
              <View style={styles.hero}>
                <Text style={styles.heroKicker}>LA MEILLEURE AFFAIRE POUR VOUS</Text>
                <Text style={styles.heroTitle}>{meilleur.marque} {meilleur.modele}</Text>
                {modePaiement === 'credit' && meilleur.mensualite > 0 ? (
                  <Text style={styles.heroLine}>
                    <Text style={styles.heroBig}>{fmt(meilleur.mensualite)} €/mois</Text>
                    <Text style={styles.heroSep}>  de mensualité de crédit</Text>
                  </Text>
                ) : null}
                <Text style={styles.heroLine}>
                  <Text style={styles.heroBig}>{fmt(meilleur.coutMensuelMoyen)} €/mois</Text>
                  <Text style={styles.heroSep}>  tout compris</Text>
                </Text>
                <Text style={styles.heroSub}>
                  « Tout compris » = achat + essence + entretien + assurance + perte de valeur, sur {dureeGarde} ans.
                  Soit {fmt(meilleur.tco)} € au total.
                </Text>
              </View>
            ) : null}

            <Text style={styles.sectionKicker}>
              {resultats.length} voitures · de la moins chère à la plus chère sur {dureeGarde} ans
            </Text>
            <Text style={styles.h2}>Toutes les voitures</Text>

            {resultats.map((v, i) => (
              <VehiculeCard
                key={v.vehicule_id} v={v} rank={i}
                dureeGarde={dureeGarde} modePaiement={modePaiement}
              />
            ))}
          </>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            <Text style={{ fontWeight: '700' }}>D'où viennent ces chiffres ?</Text> Les données techniques
            (consommation, CO₂, puissance) proviennent de l'ADEME. Les prix de l'énergie sont des moyennes 2026.
            L'assurance et l'entretien sont des estimations moyennes. Ce simulateur est indicatif et ne remplace pas un devis.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

function Section({ number, title, help, children }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionTitleRow}>
        <View style={styles.numCircle}><Text style={styles.numText}>{number}</Text></View>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {help ? <Text style={styles.sectionHelp}>{help}</Text> : null}
      {children}
    </View>
  )
}

function ToggleBtn({ label, active, onPress }) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.toggle,
        active && styles.toggleActive,
        pressed && !active && styles.togglePressed,
      ]}
    >
      <Text style={[styles.toggleText, active && styles.toggleTextActive]}>{label}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 16, paddingBottom: 40 },
  header: { marginBottom: 18 },
  kicker: { fontSize: 11, letterSpacing: 1.5, fontWeight: '700', color: colors.textMuted, marginBottom: 10 },
  h1: { fontSize: 34, fontFamily: 'Georgia', color: colors.text, lineHeight: 38, marginBottom: 14 },
  h1Italic: { fontStyle: 'italic', color: colors.accent },
  subtitle: { fontSize: 16, color: colors.textMuted, lineHeight: 24 },
  resetBtn: {
    alignSelf: 'flex-start', paddingVertical: 10, paddingHorizontal: 14,
    borderWidth: 1.5, borderColor: colors.dark, marginBottom: 18,
  },
  resetBtnPressed: { backgroundColor: colors.cardHighlight },
  resetText: { fontSize: 14, fontWeight: '600', color: colors.text },
  section: {
    borderTopWidth: 1.5, borderTopColor: colors.dark, paddingTop: 16, marginBottom: 14,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
  numCircle: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: colors.dark,
    alignItems: 'center', justifyContent: 'center',
  },
  numText: { color: colors.light, fontSize: 14, fontWeight: '700' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  sectionHelp: { fontSize: 14, color: colors.textMuted, marginBottom: 12, lineHeight: 20, marginTop: 4 },
  toggleRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  toggle: {
    flex: 1, paddingVertical: 14, alignItems: 'center',
    borderWidth: 1.5, borderColor: '#CFC8B8', backgroundColor: colors.card,
  },
  togglePressed: { backgroundColor: colors.cardHighlight },
  toggleActive: { backgroundColor: colors.dark, borderColor: colors.dark },
  toggleText: { fontSize: 15, fontWeight: '600', color: colors.textMuted },
  toggleTextActive: { color: colors.light, fontWeight: '700' },
  creditBox: {
    marginTop: 14, padding: 14, backgroundColor: colors.cardHighlight,
    borderWidth: 1.5, borderColor: colors.cardBorder,
  },
  labelRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16, marginBottom: -8 },
  labelInline: { fontSize: sizes.small + 1, fontWeight: '600', color: colors.text },
  checkRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  checkbox: {
    width: 24, height: 24, borderWidth: 1.5, borderColor: colors.dark,
    backgroundColor: colors.card, marginRight: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: colors.dark },
  checkboxTick: { color: colors.light, fontSize: 16, fontWeight: '700', lineHeight: 18 },
  checkLabel: { fontSize: 15, color: colors.text, flex: 1 },
  help: { fontSize: 13, color: colors.textMuted, fontStyle: 'italic', lineHeight: 18 },
  empty: {
    padding: 30, alignItems: 'center',
    backgroundColor: colors.card, borderWidth: 1.5, borderColor: '#CCC',
    borderStyle: 'dashed', marginVertical: 16,
  },
  emptyText: { fontSize: 16, color: colors.textMuted, textAlign: 'center', lineHeight: 24 },
  hero: { backgroundColor: colors.dark, padding: 22, marginTop: 18, marginBottom: 12 },
  heroKicker: { fontSize: 11, letterSpacing: 1.5, fontWeight: '700', color: '#A89F8A', marginBottom: 10 },
  heroTitle: { fontFamily: 'Georgia', fontSize: 28, color: colors.light, marginBottom: 14 },
  heroLine: { color: '#D9D2C2', fontSize: 16, lineHeight: 32, marginBottom: 4 },
  heroBig: { fontFamily: 'Georgia', fontSize: 26, color: colors.light },
  heroSep: { color: '#A89F8A', fontSize: 15 },
  heroSub: { fontSize: 13, color: '#A89F8A', marginTop: 12, lineHeight: 20 },
  sectionKicker: { fontSize: 11, letterSpacing: 1.5, fontWeight: '700', color: colors.textMuted, marginTop: 18, marginBottom: 6 },
  h2: { fontSize: 24, fontFamily: 'Georgia', color: colors.text, marginBottom: 12 },
  footer: { borderTopWidth: 1.5, borderTopColor: colors.dark, paddingTop: 16, marginTop: 18 },
  footerText: { fontSize: 13, color: colors.textMuted, lineHeight: 20 },
})
