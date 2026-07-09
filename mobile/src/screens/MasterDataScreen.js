import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  FlatList, ActivityIndicator, Modal, ScrollView,
  KeyboardAvoidingView, Platform, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import api from '../utils/api';
import { useAlert } from '../context/AlertContext';
import { syncMasterData, getMasterData } from '../utils/syncManager';
import { clearMasterData, getMasterCounts, getFilteredMasterData } from '../utils/localDB';
import { colors, spacing, radius, typography, shadows } from '../theme';

const TABS = ['States', 'Districts', 'Blocks', 'GPs'];
const PAGE_SIZE = 50;

const PickerRow = ({ label, value, onPress, disabled }) => (
  <TouchableOpacity
    style={[styles.pickerRow, disabled && styles.pickerDisabled]}
    onPress={disabled ? undefined : onPress}
    activeOpacity={disabled ? 1 : 0.7}
  >
    <Text style={[styles.pickerText, !value && styles.pickerPlaceholder]}>
      {value || `Select ${label}…`}
    </Text>
    <Feather name="chevron-right" size={16} color={colors.placeholder} />
  </TouchableOpacity>
);

const SelectModal = ({ visible, title, items, onSelect, onClose }) => {
  const [search, setSearch] = useState('');
  const filtered = items.filter(i => i.label.toLowerCase().includes(search.toLowerCase()));
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalSafe} edges={['top']}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
            <Feather name="x" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.modalHeaderTitle}>{title}</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.searchWrap}>
          <Feather name="search" size={16} color={colors.placeholder} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search…"
            placeholderTextColor={colors.placeholder}
            value={search}
            onChangeText={setSearch}
            autoFocus
          />
        </View>
        <FlatList
          data={filtered}
          keyExtractor={i => String(i.value)}
          initialNumToRender={20}
          maxToRenderPerBatch={20}
          windowSize={5}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.modalItem} onPress={() => { onSelect(item); onClose(); }}>
              <Text style={styles.modalItemText}>{item.label}</Text>
              <Feather name="chevron-right" size={14} color={colors.placeholder} />
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>No results found</Text>}
        />
      </SafeAreaView>
    </Modal>
  );
};

export default function MasterDataScreen({ navigation }) {
  const { showAlert: alert } = useAlert();
  const [activeTab, setActiveTab] = useState(0);
  const [syncing, setSyncing]     = useState(false);
  const [saving, setSaving]       = useState(false);
  const [clearing, setClearing]   = useState(false);
  const [syncProgress, setSyncProgress] = useState(null);

  // Counts for tab badges
  const [counts, setCounts] = useState({ states: 0, districts: 0, blocks: 0, gps: 0 });

  // Paginated list state
  const [items, setItems]         = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [offset, setOffset]       = useState(0);
  const [hasMore, setHasMore]     = useState(false);

  // Filters
  const [selState, setSelState]       = useState(null);
  const [selDistrict, setSelDistrict] = useState(null);
  const [selBlock, setSelBlock]       = useState(null);
  const [stateModal, setStateModal]       = useState(false);
  const [districtModal, setDistrictModal] = useState(false);
  const [blockModal, setBlockModal]       = useState(false);

  // For picker options (only states+districts need full list, small data)
  const [states, setStates]       = useState([]);
  const [districts, setDistricts] = useState([]);
  const [blocks, setBlocks]       = useState([]);

  // Add form
  const [form, setForm] = useState({ name: '', code: '' });

  // Load counts and picker options
  const loadCounts = useCallback(async () => {
    const c = await getMasterCounts();
    setCounts(c);
  }, []);

  const loadPickerOptions = useCallback(async () => {
    const data = await getMasterData();
    if (data) {
      setStates(data.states || []);
      setDistricts(data.districts || []);
      // blocks for picker: only when district selected, fetched on demand
    }
  }, []);

  // Load paginated list for active tab
  const loadList = useCallback(async (tab, parentId, off = 0, append = false) => {
    setListLoading(true);
    try {
      const rows = await getFilteredMasterData({ tab, parentId, limit: PAGE_SIZE, offset: off });
      if (append) {
        setItems(prev => [...prev, ...rows]);
      } else {
        setItems(rows);
      }
      setOffset(off + rows.length);
      setHasMore(rows.length === PAGE_SIZE);
    } catch (e) {
      console.warn('loadList error', e);
    } finally {
      setListLoading(false);
    }
  }, []);

  // Parent ID for current tab filter
  const getParentId = () => {
    if (activeTab === 1) return selState?.value ?? null;
    if (activeTab === 2) return selDistrict?.value ?? null;
    if (activeTab === 3) return selBlock?.value ?? null;
    return null;
  };

  // Sync master data
  const handleSync = useCallback(async (force = false) => {
    setSyncing(true);
    setSyncProgress(null);
    try {
      const data = await getMasterData();
      if (!data || force) {
        await syncMasterData((p) => setSyncProgress(p));
      }
      await loadCounts();
      await loadPickerOptions();
      await loadList(activeTab, getParentId(), 0, false);
    } catch (e) {
      alert('Error', 'Could not sync: ' + (e.message || 'Check connection.'));
    } finally {
      setSyncing(false);
      setSyncProgress(null);
    }
  }, [activeTab, selState, selDistrict, selBlock]);

  useEffect(() => {
    handleSync(false);
  }, []);

  // Reload list when tab or filters change
  useEffect(() => {
    setItems([]);
    setOffset(0);
    setHasMore(false);
    loadList(activeTab, getParentId(), 0, false);
    loadCounts();
  }, [activeTab, selState, selDistrict, selBlock]);

  // Reset filters on tab change
  useEffect(() => {
    setSelState(null); setSelDistrict(null); setSelBlock(null);
    setForm({ name: '', code: '' });
  }, [activeTab]);

  // Load blocks for block picker when district changes
  useEffect(() => {
    if (selDistrict) {
      getFilteredMasterData({ tab: 2, parentId: selDistrict.value, limit: 5000, offset: 0 })
        .then(rows => setBlocks(rows))
        .catch(() => {});
    } else {
      setBlocks([]);
    }
  }, [selDistrict]);

  const handleClear = async () => {
    alert('Clear Master Data', 'This will delete all local data. You will need to re-sync.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear All', style: 'destructive',
        onPress: async () => {
          setClearing(true);
          try {
            await clearMasterData();
            setItems([]); setCounts({ states: 0, districts: 0, blocks: 0, gps: 0 });
          } catch (e) {
            alert('Error', 'Could not clear master data.');
          } finally { setClearing(false); }
        },
      },
    ]);
  };

  const handleAdd = async () => {
    const name = form.name.trim();
    if (!name) { alert('Error', 'Name is required'); return; }
    let endpoint = '';
    let payload  = { name, code: form.code.trim() || undefined };
    if (activeTab === 0) {
      endpoint = '/master/states';
    } else if (activeTab === 1) {
      if (!selState) { alert('Error', 'Select a state first'); return; }
      endpoint = '/master/districts'; payload = { ...payload, stateId: selState.value };
    } else if (activeTab === 2) {
      if (!selDistrict) { alert('Error', 'Select a district first'); return; }
      endpoint = '/master/blocks'; payload = { ...payload, districtId: selDistrict.value };
    } else {
      if (!selBlock) { alert('Error', 'Select a block first'); return; }
      endpoint = '/master/grampanchayats'; payload = { ...payload, blockId: selBlock.value };
    }
    setSaving(true);
    try {
      await api.post(endpoint, payload);
      setForm({ name: '', code: '' });
      await handleSync(true);
      alert('Success', `${TABS[activeTab].slice(0, -1)} added!`);
    } catch (e) {
      alert('Error', e.response?.data?.error ?? 'Failed to save.');
    } finally { setSaving(false); }
  };

  const stateOptions    = states.map(s => ({ label: s.name, value: s.id }));
  const districtOptions = selState
    ? districts.filter(d => d.stateId === selState.value).map(d => ({ label: d.name, value: d.id }))
    : districts.map(d => ({ label: d.name, value: d.id }));
  const blockOptions    = blocks.map(b => ({ label: b.name, value: b.id }));

  const tabCounts = [counts.states, counts.districts, counts.blocks, counts.gps];

  const renderItem = ({ item }) => (
    <View style={styles.listItem}>
      <View style={styles.listDot} />
      <View style={{ flex: 1 }}>
        <Text style={styles.listItemName}>{item.name}</Text>
      </View>
      {item.code ? <View style={styles.codeBadge}><Text style={styles.codeText}>{item.code}</Text></View> : null}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Feather name="chevron-left" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Master Data</Text>
        <TouchableOpacity onPress={() => handleSync(true)} style={styles.headerBtn} disabled={syncing}>
          {syncing
            ? <ActivityIndicator size="small" color="#fff" />
            : <Feather name="refresh-cw" size={20} color="#fff" />
          }
        </TouchableOpacity>
      </View>

      {/* Sync progress */}
      {syncProgress && (
        <View style={styles.progressBanner}>
          <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: 8 }} />
          <Text style={styles.progressText}>
            {syncProgress.step === 'states' ? 'Syncing states & districts...' :
             syncProgress.step === 'blocks' ? `Blocks: ${syncProgress.done.toLocaleString()} / ${syncProgress.total?.toLocaleString() || '?'}` :
             `GPs: ${syncProgress.done.toLocaleString()} / ${syncProgress.total?.toLocaleString() || '?'}`}
          </Text>
        </View>
      )}

      {/* Clear banner */}
      <TouchableOpacity
        style={[styles.clearBanner, clearing && { opacity: 0.6 }]}
        onPress={handleClear}
        disabled={clearing || syncing}
      >
        {clearing
          ? <ActivityIndicator size="small" color="#fff" />
          : <><Feather name="trash-2" size={13} color="#fff" /><Text style={styles.clearBannerText}>  Clear All Local Master Data</Text></>
        }
      </TouchableOpacity>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {TABS.map((t, i) => (
          <TouchableOpacity key={t} style={[styles.tab, activeTab === i && styles.tabActive]} onPress={() => setActiveTab(i)}>
            <Text style={[styles.tabText, activeTab === i && styles.tabTextActive]}>{t}</Text>
            <Text style={[styles.tabCount, activeTab === i && styles.tabCountActive]}>
              {tabCounts[i].toLocaleString()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        {/* Filters */}
        {(activeTab >= 1) && (
          <View style={styles.filterRow}>
            <TouchableOpacity style={styles.filterChip} onPress={() => setStateModal(true)}>
              <Text style={styles.filterChipText} numberOfLines={1}>{selState?.label || 'All States'}</Text>
              <Feather name="chevron-down" size={14} color={colors.primary} />
            </TouchableOpacity>
            {activeTab >= 2 && (
              <TouchableOpacity style={styles.filterChip} onPress={() => setDistrictModal(true)} disabled={!selState}>
                <Text style={[styles.filterChipText, !selState && { color: colors.placeholder }]} numberOfLines={1}>
                  {selDistrict?.label || 'All Districts'}
                </Text>
                <Feather name="chevron-down" size={14} color={colors.primary} />
              </TouchableOpacity>
            )}
            {activeTab === 3 && (
              <TouchableOpacity style={styles.filterChip} onPress={() => setBlockModal(true)} disabled={!selDistrict}>
                <Text style={[styles.filterChipText, !selDistrict && { color: colors.placeholder }]} numberOfLines={1}>
                  {selBlock?.label || 'All Blocks'}
                </Text>
                <Feather name="chevron-down" size={14} color={colors.primary} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Add Form */}
        <ScrollView style={styles.addFormScroll} contentContainerStyle={styles.addFormContent} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Add New {TABS[activeTab].slice(0, -1)}</Text>
            <Text style={styles.fieldLabel}>NAME *</Text>
            <TextInput
              style={styles.input}
              placeholder={`Enter ${TABS[activeTab].slice(0, -1)} name`}
              placeholderTextColor={colors.placeholder}
              value={form.name}
              onChangeText={v => setForm(f => ({ ...f, name: v }))}
            />
            {activeTab === 3 && (
              <>
                <Text style={styles.fieldLabel}>CODE</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter code (optional)"
                  placeholderTextColor={colors.placeholder}
                  value={form.code}
                  onChangeText={v => setForm(f => ({ ...f, code: v }))}
                />
              </>
            )}
            <TouchableOpacity style={[styles.addBtn, saving && { opacity: 0.6 }]} onPress={handleAdd} disabled={saving}>
              {saving
                ? <ActivityIndicator color="#fff" size="small" />
                : <><Feather name="plus" size={16} color="#fff" /><Text style={styles.addBtnText}>  Add {TABS[activeTab].slice(0, -1)}</Text></>
              }
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* List */}
        <FlatList
          data={items}
          keyExtractor={item => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          initialNumToRender={20}
          maxToRenderPerBatch={20}
          windowSize={5}
          ListEmptyComponent={
            listLoading ? null : (
              <Text style={styles.emptyText}>
                {syncing ? 'Syncing data...' : 'No records. Tap ↑ sync to download data.'}
              </Text>
            )
          }
          ListFooterComponent={
            listLoading ? <ActivityIndicator color={colors.primary} style={{ marginVertical: 16 }} /> :
            hasMore ? (
              <TouchableOpacity style={styles.loadMoreBtn} onPress={() => loadList(activeTab, getParentId(), offset, true)}>
                <Text style={styles.loadMoreText}>Load More</Text>
              </TouchableOpacity>
            ) : null
          }
        />
      </KeyboardAvoidingView>

      <SelectModal visible={stateModal} title="Select State" items={stateOptions}
        onSelect={item => { setSelState(item); setSelDistrict(null); setSelBlock(null); }}
        onClose={() => setStateModal(false)} />
      <SelectModal visible={districtModal} title="Select District" items={districtOptions}
        onSelect={item => { setSelDistrict(item); setSelBlock(null); }}
        onClose={() => setDistrictModal(false)} />
      <SelectModal visible={blockModal} title="Select Block" items={blockOptions}
        onSelect={item => setSelBlock(item)}
        onClose={() => setBlockModal(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },

  header: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md, paddingVertical: 14,
  },
  headerBtn: { width: 40, alignItems: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', ...typography.headlineSm, color: '#fff' },

  progressBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.primaryContainer,
    paddingVertical: 8, paddingHorizontal: spacing.md,
  },
  progressText: { ...typography.labelMd, color: colors.primary },

  clearBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.error, paddingVertical: 9,
  },
  clearBannerText: { ...typography.labelMd, color: '#fff', fontWeight: '700' },

  tabBar: {
    flexDirection: 'row', backgroundColor: colors.surface,
    borderBottomWidth: 1, borderBottomColor: colors.outlineVariant,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2.5, borderBottomColor: colors.primary },
  tabText: { ...typography.labelSm, color: colors.muted },
  tabTextActive: { ...typography.labelSm, color: colors.primary, fontWeight: '700' },
  tabCount: { fontSize: 10, color: colors.muted, marginTop: 2 },
  tabCountActive: { color: colors.primary },

  filterRow: {
    flexDirection: 'row', gap: 8,
    paddingHorizontal: spacing.md, paddingVertical: 10,
    backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.outlineVariant,
  },
  filterChip: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: colors.primary, borderRadius: radius.xl,
    paddingHorizontal: 10, paddingVertical: 6, backgroundColor: colors.primaryContainer,
  },
  filterChipText: { flex: 1, ...typography.labelSm, color: colors.primary, marginRight: 4 },

  addFormScroll: { maxHeight: 200 },
  addFormContent: { padding: spacing.md, paddingBottom: 0 },
  card: {
    backgroundColor: colors.surface, borderRadius: radius.lg,
    padding: spacing.md, borderWidth: 1, borderColor: colors.outlineVariant, ...shadows.sm,
  },
  cardTitle: { ...typography.labelMd, color: colors.primary, fontWeight: '700', marginBottom: spacing.sm },
  fieldLabel: { ...typography.labelSm, color: colors.muted, marginBottom: 4, marginTop: 8 },
  input: {
    borderWidth: 1, borderColor: colors.outline, borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: 10,
    ...typography.bodyMd, color: colors.onSurface, backgroundColor: colors.surfaceContainerLow,
  },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.primary, borderRadius: radius.md,
    paddingVertical: 12, marginTop: spacing.md,
  },
  addBtnText: { ...typography.labelMd, color: '#fff', fontWeight: '700' },

  listContent: { padding: spacing.md, paddingBottom: 40 },
  listItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: radius.md,
    paddingVertical: 11, paddingHorizontal: spacing.md,
    marginBottom: 6, borderWidth: 1, borderColor: colors.outlineVariant,
  },
  listDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: colors.primary, marginRight: spacing.sm, opacity: 0.5,
  },
  listItemName: { ...typography.bodyMd, color: colors.onSurface, flex: 1 },
  codeBadge: {
    backgroundColor: colors.primaryContainer, borderRadius: radius.sm, paddingHorizontal: 6, paddingVertical: 2,
  },
  codeText: { ...typography.labelSm, color: colors.primary },

  loadMoreBtn: {
    paddingVertical: 12, borderRadius: radius.md,
    backgroundColor: colors.surfaceContainerLow, alignItems: 'center',
    borderWidth: 1, borderColor: colors.outline, marginTop: 4,
  },
  loadMoreText: { ...typography.labelMd, color: colors.primary },
  emptyText: { ...typography.bodyMd, color: colors.muted, textAlign: 'center', marginTop: spacing.xl },

  modalSafe: { flex: 1, backgroundColor: colors.surface },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary,
    paddingHorizontal: spacing.md, paddingVertical: 14,
  },
  modalHeaderTitle: { flex: 1, textAlign: 'center', ...typography.headlineSm, color: '#fff' },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    margin: spacing.md, paddingHorizontal: spacing.md, paddingVertical: 10,
    borderWidth: 1, borderColor: colors.outline, borderRadius: radius.md,
    backgroundColor: colors.surfaceContainerLow,
  },
  searchInput: { flex: 1, ...typography.bodyMd, color: colors.onSurface },
  modalItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: colors.outlineVariant,
  },
  modalItemText: { flex: 1, ...typography.bodyMd, color: colors.onSurface },
});
