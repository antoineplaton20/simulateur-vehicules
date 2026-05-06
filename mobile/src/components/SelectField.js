import React, { useState } from 'react'
import { View, Text, Pressable, Modal, FlatList, StyleSheet } from 'react-native'
import { colors, sizes } from '../theme'

export default function SelectField({ label, value, options, onChange }) {
  const [open, setOpen] = useState(false)
  const current = options.find((o) => o.value === value) || options[0]

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.field, pressed && styles.fieldPressed]}
      >
        <Text style={styles.fieldText} numberOfLines={1}>{current?.label || '—'}</Text>
        <Text style={styles.chevron}>▾</Text>
      </Pressable>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation?.()}>
            <Text style={styles.sheetTitle}>{label}</Text>
            <FlatList
              data={options}
              keyExtractor={(o) => o.value || 'none'}
              renderItem={({ item }) => {
                const selected = item.value === value
                return (
                  <Pressable
                    onPress={() => { onChange(item.value); setOpen(false) }}
                    style={({ pressed }) => [styles.option, pressed && styles.optionPressed, selected && styles.optionSelected]}
                  >
                    <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{item.label}</Text>
                    {selected && <Text style={styles.optionTextSelected}>✓</Text>}
                  </Pressable>
                )
              }}
            />
            <Pressable style={styles.closeBtn} onPress={() => setOpen(false)}>
              <Text style={styles.closeText}>Fermer</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { marginTop: 16 },
  label: { fontSize: sizes.small + 1, fontWeight: '600', color: colors.text, marginBottom: 8 },
  field: {
    borderWidth: 1.5, borderColor: colors.dark, backgroundColor: colors.card,
    paddingVertical: 14, paddingHorizontal: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  fieldPressed: { backgroundColor: colors.cardHighlight },
  fieldText: { fontSize: 15, color: colors.text, flex: 1, marginRight: 8 },
  chevron: { fontSize: 14, color: colors.textMuted },
  backdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.card, paddingTop: 18, paddingHorizontal: 16, paddingBottom: 24,
    maxHeight: '70%', borderTopLeftRadius: 16, borderTopRightRadius: 16,
  },
  sheetTitle: {
    fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 12,
    fontFamily: 'Georgia',
  },
  option: {
    paddingVertical: 14, paddingHorizontal: 12,
    borderBottomWidth: 1, borderBottomColor: colors.cardBorder,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  optionPressed: { backgroundColor: colors.cardHighlight },
  optionSelected: { backgroundColor: colors.cardHighlight },
  optionText: { fontSize: 15, color: colors.text, flex: 1 },
  optionTextSelected: { color: colors.text, fontWeight: '700' },
  closeBtn: {
    marginTop: 12, paddingVertical: 14, borderWidth: 1.5, borderColor: colors.dark,
    alignItems: 'center',
  },
  closeText: { fontSize: 14, fontWeight: '700', color: colors.text, letterSpacing: 1.5 },
})
