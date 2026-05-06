import React from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { colors, sizes } from '../theme'

export default function Stepper({ label, value, min, max, step = 1, onChange, suffix = '', help, format }) {
  const dec = () => onChange(Math.max(min, value - step))
  const inc = () => onChange(Math.min(max, value + step))
  const display = format ? format(value) : value.toLocaleString('fr-FR')

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Diminuer ${label}`}
          onPress={dec}
          style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
        >
          <Text style={styles.btnText}>−</Text>
        </Pressable>
        <View style={styles.valueBox}>
          <Text style={styles.valueText}>
            {display}<Text style={styles.suffix}>{suffix}</Text>
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Augmenter ${label}`}
          onPress={inc}
          style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
        >
          <Text style={styles.btnText}>+</Text>
        </Pressable>
      </View>
      {help ? <Text style={styles.help}>{help}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { marginTop: 16 },
  label: { fontSize: sizes.small + 1, fontWeight: '600', color: colors.text, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'stretch', gap: 8 },
  btn: {
    width: 52, height: 52, borderWidth: 1.5, borderColor: colors.dark,
    backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center',
  },
  btnPressed: { backgroundColor: colors.cardHighlight },
  btnText: { fontSize: 26, fontWeight: '700', color: colors.text, lineHeight: 26 },
  valueBox: {
    flex: 1, borderWidth: 1.5, borderColor: colors.dark,
    backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 8,
  },
  valueText: {
    fontSize: 20, fontWeight: '700', color: colors.text,
    fontFamily: 'Georgia',
  },
  suffix: { fontSize: 14, fontWeight: '500', color: colors.textMuted },
  help: { fontSize: sizes.tiny + 1, color: colors.textMuted, marginTop: 8, fontStyle: 'italic', lineHeight: 18 },
})
