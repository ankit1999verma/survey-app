import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, Modal, StyleSheet, Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { colors, spacing, radius, typography } from '../theme';

/**
 * WheelPickerField
 * Props:
 *   label       – string, field label (ALL CAPS recommended)
 *   items       – [{ label, value }]
 *   value       – currently selected value
 *   onChange    – (value) => void
 *   placeholder – string shown when nothing selected
 *   disabled    – bool
 */
const WheelPickerField = ({ label, items = [], value, onChange, placeholder = 'Select...', disabled = false }) => {
  const [visible, setVisible] = useState(false);
  // temp selection while wheel is spinning (commit on Done)
  const [tempValue, setTempValue] = useState(value);

  const selectedLabel = items.find(i => i.value === value)?.label;

  const open = () => {
    if (disabled) return;
    setTempValue(value ?? items[0]?.value ?? null);
    setVisible(true);
  };

  const confirm = () => {
    const confirmed = tempValue ?? items[0]?.value ?? null;
    onChange(confirmed);
    setVisible(false);
  };

  const cancel = () => setVisible(false);

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      {/* Tappable field */}
      <TouchableOpacity
        style={[styles.field, disabled && styles.fieldDisabled]}
        onPress={open}
        activeOpacity={0.7}
      >
        <Text style={[styles.fieldText, !selectedLabel && styles.placeholder]}>
          {selectedLabel || placeholder}
        </Text>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>

      {/* iOS Bottom Sheet */}
      <Modal visible={visible} transparent animationType="slide">
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={cancel} />
        <View style={styles.sheet}>
          {/* Toolbar */}
          <View style={styles.toolbar}>
            <TouchableOpacity onPress={cancel} style={styles.toolbarBtn}>
              <Text style={styles.toolbarCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.toolbarTitle} numberOfLines={1}>{label}</Text>
            <TouchableOpacity onPress={confirm} style={styles.toolbarBtn}>
              <Text style={styles.toolbarDone}>Done</Text>
            </TouchableOpacity>
          </View>

          {/* Wheel */}
          <Picker
            selectedValue={tempValue}
            onValueChange={(v) => setTempValue(v)}
            style={styles.picker}
            itemStyle={styles.pickerItem}
          >
            {items.map((item) => (
              <Picker.Item key={String(item.value)} label={item.label} value={item.value} />
            ))}
          </Picker>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: spacing.md },

  label: {
    fontSize: 12, fontWeight: '700', color: colors.onSurfaceVariant,
    letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 6,
  },

  field: {
    flexDirection: 'row', alignItems: 'center',
    height: 52, backgroundColor: colors.white,
    borderWidth: 1, borderColor: colors.outlineVariant,
    borderRadius: radius.md, paddingHorizontal: spacing.md,
  },
  fieldDisabled: { opacity: 0.45 },
  fieldText: { flex: 1, fontSize: 16, color: colors.onSurface },
  placeholder: { color: colors.placeholder },
  chevron: { fontSize: 22, color: colors.muted, marginTop: -2 },

  // Modal
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },

  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
  },

  toolbar: {
    flexDirection: 'row', alignItems: 'center',
    borderBottomWidth: 1, borderBottomColor: colors.outlineVariant,
    paddingHorizontal: spacing.md, height: 48,
  },
  toolbarBtn: { minWidth: 60, justifyContent: 'center' },
  toolbarCancel: { fontSize: 16, color: colors.muted },
  toolbarDone: { fontSize: 16, fontWeight: '700', color: colors.primary, textAlign: 'right' },
  toolbarTitle: { flex: 1, textAlign: 'center', fontSize: 15, fontWeight: '600', color: colors.onSurface },

  picker: { width: '100%' },
  pickerItem: { fontSize: 18, color: colors.onSurface },
});

export default WheelPickerField;
