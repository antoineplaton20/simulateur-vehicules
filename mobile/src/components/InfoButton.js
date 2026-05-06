import React, { useState } from 'react'
import { View, Text, Pressable, Modal, StyleSheet } from 'react-native'
import { colors } from '../theme'

export default function InfoButton({ title, children }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Pressable
        accessibilityLabel="Plus d'informations"
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.dot, pressed && styles.dotPressed]}
        hitSlop={8}
      >
        <Text style={styles.qmark}>?</Text>
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={styles.box}>
            {title ? <Text style={styles.title}>{title}</Text> : null}
            <Text style={styles.body}>{children}</Text>
            <Pressable onPress={() => setOpen(false)} style={styles.closeBtn}>
              <Text style={styles.closeText}>Fermer</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  dot: {
    width: 24, height: 24, borderRadius: 12, marginLeft: 6,
    backgroundColor: '#E5E0D5', alignItems: 'center', justifyContent: 'center',
  },
  dotPressed: { backgroundColor: '#D0CAB8' },
  qmark: { fontSize: 14, fontWeight: '700', color: colors.text, lineHeight: 16 },
  backdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center', justifyContent: 'center', padding: 20,
  },
  box: {
    backgroundColor: colors.dark, padding: 22, maxWidth: 360, width: '100%',
  },
  title: { color: colors.light, fontSize: 16, fontWeight: '700', marginBottom: 8 },
  body: { color: colors.light, fontSize: 15, lineHeight: 22 },
  closeBtn: {
    marginTop: 18, alignSelf: 'flex-end',
    paddingVertical: 8, paddingHorizontal: 14,
    borderWidth: 1, borderColor: colors.light,
  },
  closeText: { color: colors.light, fontSize: 13, fontWeight: '700', letterSpacing: 1.2 },
})
