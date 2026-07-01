import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, Modal, StyleSheet, Platform,
  SafeAreaView, ActivityIndicator, FlatList, TextInput, Keyboard
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, radius, typography, shadows } from '../theme';

const WheelPickerField = React.forwardRef(({
  label, items = [], value, onChange,
  placeholder = 'Select...', disabled = false, loading = false,
}, ref) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');

  React.useImperativeHandle(ref, () => ({
    open: () => {
      if (!disabled && !loading) {
        setSearchText('');
        setModalVisible(true);
      }
    },
    close: () => setModalVisible(false),
  }));

  const selectedLabel = items.find(i => i.value === value)?.label;

  const handleOpen = () => {
    if (disabled || loading) return;
    Keyboard.dismiss();
    setSearchText('');
    setModalVisible(true);
  };

  const handleClose = () => setModalVisible(false);

  const handleSelect = (val) => {
    onChange(val);
    handleClose();
  };

  const filteredItems = useMemo(() => {
    if (!searchText) return items;
    const lower = searchText.toLowerCase();
    return items.filter(i => i.label.toLowerCase().includes(lower));
  }, [items, searchText]);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.listItem, value === item.value && styles.listItemSelected]}
      onPress={() => handleSelect(item.value)}
      activeOpacity={0.7}
    >
      <Text style={[styles.listItemText, value === item.value && styles.listItemTextSelected]}>
        {item.label}
      </Text>
      {value === item.value && <Feather name="check" size={20} color={colors.primary} />}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <TouchableOpacity
        style={[styles.field, (disabled || loading) && styles.fieldDisabled]}
        onPress={handleOpen}
        activeOpacity={0.7}
      >
        {loading ? (
          <>
            <Text style={[styles.fieldText, styles.placeholder]} numberOfLines={1}>Loading...</Text>
            <ActivityIndicator size="small" color={colors.primary} />
          </>
        ) : (
          <>
            <Text style={[styles.fieldText, !selectedLabel && styles.placeholder]} numberOfLines={1}>
              {selectedLabel || placeholder}
            </Text>
            <Feather name="chevron-down" size={20} color={colors.muted} />
          </>
        )}
      </TouchableOpacity>

      <Modal 
        visible={modalVisible} 
        animationType="slide" 
        transparent={true}
        onRequestClose={handleClose}
      >
        <View style={styles.modalWrapper}>
          <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose} />

          <SafeAreaView style={styles.sheet}>
            <View style={styles.handleContainer}>
              <View style={styles.handle} />
            </View>

            <View style={styles.toolbar}>
              <Text style={styles.toolbarTitle} numberOfLines={1}>{label || 'Select Option'}</Text>
              <TouchableOpacity onPress={handleClose} style={styles.toolbarBtnRight}>
                <Feather name="x" size={24} color={colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>

            {/* Search Bar for large lists (like Blocks and GPs) */}
            {items.length > 10 && (
              <View style={styles.searchContainer}>
                <Feather name="search" size={18} color={colors.outline} style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search..."
                  value={searchText}
                  onChangeText={setSearchText}
                  placeholderTextColor={colors.placeholder}
                  clearButtonMode="always"
                />
              </View>
            )}

            <FlatList
              data={filteredItems}
              keyExtractor={(item, index) => `${item.value}_${index}`}
              renderItem={renderItem}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
              initialNumToRender={20}
              maxToRenderPerBatch={20}
              windowSize={5}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No matches found</Text>
              }
            />
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
});

const styles = StyleSheet.create({
  container: { marginBottom: spacing.md },
  label: {
    ...typography.labelSm, color: colors.onSurfaceVariant,
    textTransform: 'uppercase', marginBottom: 6,
  },
  
  field: {
    flexDirection: 'row', alignItems: 'center',
    height: 54, backgroundColor: colors.white,
    borderWidth: 1.5, borderColor: colors.outlineVariant,
    borderRadius: radius.md, paddingHorizontal: spacing.md,
    ...shadows.sm,
  },
  fieldDisabled: { opacity: 0.6, backgroundColor: colors.surfaceContainerLow },
  fieldText: { flex: 1, ...typography.bodyMd, color: colors.onSurface },
  placeholder: { color: colors.placeholder },

  // Modal
  modalWrapper: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,23,42,0.4)' },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '65%', 
    minHeight: '40%',
    ...shadows.lg,
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: 12, paddingBottom: 8,
  },
  handle: {
    width: 40, height: 5,
    borderRadius: 3, backgroundColor: colors.outlineVariant,
  },
  
  toolbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingBottom: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.surfaceContainerLow,
  },
  toolbarTitle: { flex: 1, ...typography.titleMd, color: colors.primary, fontWeight: '700', textAlign: 'center' },
  toolbarBtnRight: { padding: 4, marginRight: -4 },

  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: spacing.lg, marginTop: spacing.md, marginBottom: spacing.xs,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.md, paddingHorizontal: spacing.md,
    borderWidth: 1, borderColor: colors.outlineVariant,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1, height: 44,
    ...typography.bodyMd, color: colors.onSurface,
  },

  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
  },
  listItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: spacing.md, paddingHorizontal: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.surfaceContainerLow,
  },
  listItemSelected: {
    backgroundColor: 'rgba(37, 99, 235, 0.05)',
  },
  listItemText: {
    ...typography.bodyLg, color: colors.onSurface, flex: 1,
  },
  listItemTextSelected: {
    color: colors.primary, fontWeight: '700',
  },
  emptyText: {
    ...typography.bodyMd, color: colors.muted,
    textAlign: 'center', marginTop: spacing.xl,
  }
});

export default WheelPickerField;
