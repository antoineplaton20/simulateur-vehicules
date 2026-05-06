import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors, sizes, fmt } from '../theme'
import { LIBELLE_ENERGIE, LIBELLE_SEGMENT } from '../constants'
import InfoButton from './InfoButton'

export default function VehiculeCard({ v, rank, dureeGarde, modePaiement }) {
  const couleur = colors.energie[v.energie] || '#888'
  const isFirst = rank === 0
  return (
    <View style={[styles.card, { borderLeftColor: couleur, backgroundColor: isFirst ? colors.cardHighlight : colors.card }]}>
      <View style={styles.head}>
        <View style={{ flex: 1 }}>
          <View style={styles.rankRow}>
            {isFirst && <Text style={styles.bestBadge}>LE PLUS AVANTAGEUX</Text>}
            <Text style={styles.rankNum}>#{rank + 1}</Text>
            {v.critair ? (
              <View style={styles.critairWrap}>
                <View style={[styles.critair, v.critair === 'E' && styles.critairE]}>
                  <Text style={[styles.critairText, v.critair === 'E' && styles.critairTextE]}>Crit'Air {v.critair}</Text>
                </View>
                <InfoButton title="Qu'est-ce que Crit'Air ?">
                  Vignette anti-pollution obligatoire dans certaines villes. Plus le chiffre est bas, mieux c'est. E = électrique (le plus propre).
                </InfoButton>
              </View>
            ) : null}
          </View>
          <Text style={styles.title}>{v.marque} {v.modele}</Text>
          <Text style={styles.meta}>
            {v.finition ? `${v.finition} · ` : ''}
            {LIBELLE_ENERGIE[v.energie] || v.energie} · {v.puissance_max_ch || '?'} ch
            {v.segment ? ` · ${LIBELLE_SEGMENT[v.segment] || v.segment}` : ''}
          </Text>
        </View>
      </View>

      {modePaiement === 'credit' && v.mensualite > 0 ? (
        <View style={styles.mensualiteBox}>
          <Text style={styles.mensualiteLabel}>À PAYER CHAQUE MOIS (CRÉDIT)</Text>
          <Text style={styles.mensualiteValue}>{fmt(v.mensualite)} €<Text style={styles.perMois}>/mois</Text></Text>
        </View>
      ) : null}

      <View style={styles.tcoBlock}>
        <Text style={styles.tcoLabel}>TOUT COMPRIS SUR {dureeGarde} ANS</Text>
        <Text style={styles.tcoValue}>{fmt(v.tco)} €</Text>
        <Text style={styles.tcoSub}>≈ {fmt(v.coutMensuelMoyen)} €/mois</Text>
      </View>

      <View style={styles.breakdown}>
        {v.prix_min_eur ? <BdItem label="Prix d'achat" value={`${fmt(v.prix_min_eur)} €`} /> : null}
        {modePaiement === 'credit' && v.interetsCredit > 0 ? <BdItem label="Intérêts crédit" value={`${fmt(v.interetsCredit)} €`} /> : null}
        <BdItem
          label={v.energie === 'electrique' ? 'Élec./an' : 'Carburant/an'}
          value={`${fmt(v.coutEnergieAnnuel)} €`}
        />
        {v.conso_mixte ? <BdItem label="Conso" value={`${v.conso_mixte} L/100`} /> : null}
        {v.conso_elec_mixte ? <BdItem label="Conso élec." value={`${v.conso_elec_mixte} kWh/100`} /> : null}
        {v.co2_g_km != null ? <BdItem label="CO₂" value={`${v.co2_g_km} g/km`} /> : null}
        <BdItem label={`Revente ${dureeGarde} ans`} value={`${fmt(v.valeurRevente)} €`} />
      </View>
    </View>
  )
}

function BdItem({ label, value }) {
  return (
    <View style={styles.bdItem}>
      <Text style={styles.bdLabel}>{label}</Text>
      <Text style={styles.bdValue}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderWidth: 1.5, borderColor: colors.cardBorder, borderLeftWidth: 4,
    padding: 18, marginBottom: 12,
  },
  head: { marginBottom: 12 },
  rankRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 },
  bestBadge: {
    fontSize: 11, fontWeight: '700', letterSpacing: 1.5,
    backgroundColor: colors.dark, color: colors.light, paddingHorizontal: 8, paddingVertical: 4,
  },
  rankNum: { fontSize: 13, fontWeight: '700', color: colors.textMuted },
  critairWrap: { flexDirection: 'row', alignItems: 'center' },
  critair: { backgroundColor: '#F0EBE0', paddingHorizontal: 8, paddingVertical: 4 },
  critairE: { backgroundColor: colors.energie.electrique },
  critairText: { fontSize: 12, fontWeight: '700', color: colors.text },
  critairTextE: { color: colors.light },
  title: { fontSize: 22, fontWeight: '400', color: colors.text, fontFamily: 'Georgia', marginBottom: 4 },
  meta: { fontSize: 14, color: colors.textMuted },
  mensualiteBox: {
    backgroundColor: colors.cardHighlight, padding: 12,
    borderLeftWidth: 3, borderLeftColor: colors.dark, marginBottom: 12,
  },
  mensualiteLabel: { fontSize: 11, letterSpacing: 1.2, fontWeight: '700', color: colors.textMuted, marginBottom: 4 },
  mensualiteValue: { fontSize: 26, fontWeight: '400', color: colors.text, fontFamily: 'Georgia' },
  perMois: { fontSize: 14, color: colors.textMuted, fontWeight: '400' },
  tcoBlock: { marginBottom: 14 },
  tcoLabel: { fontSize: 11, letterSpacing: 1.2, fontWeight: '700', color: colors.textMuted, marginBottom: 4 },
  tcoValue: { fontSize: 28, fontWeight: '400', color: colors.text, fontFamily: 'Georgia' },
  tcoSub: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  breakdown: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F0EBE0',
    marginHorizontal: -8,
  },
  bdItem: { width: '50%', paddingHorizontal: 8, paddingVertical: 6 },
  bdLabel: { fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.5, marginBottom: 2 },
  bdValue: { fontSize: 14, fontWeight: '700', color: colors.text },
})
