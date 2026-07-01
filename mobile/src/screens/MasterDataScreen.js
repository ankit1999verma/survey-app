import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  FlatList, ActivityIndicator, Modal, ScrollView,
  KeyboardAvoidingView, Platform, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../utils/api';
import { useAlert } from '../context/AlertContext';
import { syncMasterData } from '../utils/syncManager';

const TABS = ['States', 'Districts', 'Blocks', 'GPs'];

const PickerRow = ({ label, value, onPress, disabled }) => (
  <TouchableOpacity
    style={[styles.pickerRow, disabled && styles.pickerDisabled]}
    onPress={disabled ? undefined : onPress}
    activeOpacity={disabled ? 1 : 0.7}
  >
    <Text style={[styles.pickerText, !value && styles.pickerPlaceholder]}>
      {value || `Select ${label}…`}
    </Text>
    <Text style={styles.pickerArrow}>›</Text>
  </TouchableOpacity>
);

const SelectModal = ({ visible, title, items, onSelect, onClose }) => {
  const [search, setSearch] = useState('');
  const filtered = items.filter(i => i.label.toLowerCase().includes(search.toLowerCase()));
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalSafe}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.modalCancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>{title}</Text>
          <View style={{ width: 60 }} />
        </View>
        <TextInput
          style={styles.searchInput}
          placeholder="Search…"
          value={search}
          onChangeText={setSearch}
          autoFocus
        />
        <FlatList
          data={filtered}
          keyExtractor={i => String(i.value)}
          initialNumToRender={20}
          maxToRenderPerBatch={20}
          windowSize={5}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.modalItem} onPress={() => { onSelect(item); onClose(); }}>
              <Text style={styles.modalItemText}>{item.label}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>No results</Text>}
        />
      </SafeAreaView>
    </Modal>
  );
};

export default function MasterDataScreen({ navigation }) {
  const { showAlert: alert } = useAlert();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading]     = useState(false);
  const [saving, setSaving]       = useState(false);
  const [states, setStates]       = useState([]);
  const [districts, setDistricts] = useState([]);
  const [blocks, setBlocks]       = useState([]);
  const [gps, setGps]             = useState([]);
  const [form, setForm]           = useState({ name: '', code: '' });
  const [selState, setSelState]       = useState(null);
  const [selDistrict, setSelDistrict] = useState(null);
  const [selBlock, setSelBlock]       = useState(null);
  const [stateModal, setStateModal]       = useState(false);
  const [districtModal, setDistrictModal] = useState(false);
  const [blockModal, setBlockModal]       = useState(false);
  
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 50;

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [s, d, b, g] = await Promise.all([
        api.get('/master/states'),
        api.get('/master/districts'),
        api.get('/master/blocks'),
        api.get('/master/grampanchayats'),
      ]);
      setStates(s.data.data);
      setDistricts(d.data.data);
      setBlocks(b.data.data);
      setGps(g.data.data);
    } catch (e) {
      alert('Error', 'Could not load master data. Check your connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    setForm({ name: '', code: '' });
    setSelState(null); setSelDistrict(null); setSelBlock(null);
    setPage(1);
  }, [activeTab]);

  useEffect(() => {
    setPage(1);
  }, [selState, selDistrict, selBlock]);

  const handleAdd = async () => {
    const name = form.name.trim();
    if (!name) { alert('Error', 'Name is required'); return; }
    let endpoint = '';
    let payload  = { name, code: form.code.trim() || undefined };
    if (activeTab === 0) {
      endpoint = '/master/states';
    } else if (activeTab === 1) {
      if (!selState) { alert('Error', 'Select a state first'); return; }
      endpoint = '/master/districts';
      payload  = { ...payload, stateId: selState.value };
    } else if (activeTab === 2) {
      if (!selDistrict) { alert('Error', 'Select a district first'); return; }
      endpoint = '/master/blocks';
      payload  = { ...payload, districtId: selDistrict.value };
    } else {
      if (!selBlock) { alert('Error', 'Select a block first'); return; }
      endpoint = '/master/grampanchayats';
      payload  = { ...payload, blockId: selBlock.value };
    }
    setSaving(true);
    try {
      await api.post(endpoint, payload);
      await fetchAll();
      try { await syncMasterData(); } catch (_) {}
      setForm({ name: '', code: '' });
      setSelState(null); setSelDistrict(null); setSelBlock(null);
      alert('Success', `${TABS[activeTab].slice(0, -1)} added successfully!`);
    } catch (e) {
      alert('Error', e.response?.data?.error ?? 'Failed to save. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const stateOptions    = states.map(s => ({ label: s.name, value: s.id }));
  const districtOptions = selState
    ? districts.filter(d => d.stateId === selState.value).map(d => ({ label: d.name, value: d.id }))
    : districts.map(d => ({ label: d.name, value: d.id }));
  const blockOptions    = selDistrict
    ? blocks.filter(b => b.districtId === selDistrict.value).map(b => ({ label: b.name, value: b.id }))
    : blocks.map(b => ({ label: b.name, value: b.id }));

  const currentList = () => {
    if (activeTab === 0) return states;
    if (activeTab === 1) return selState ? districts.filter(d => d.stateId === selState.value) : districts;
    if (activeTab === 2) return selDistrict ? blocks.filter(b => b.districtId === selDistrict.value) : blocks;
    return selBlock ? gps.filter(g => g.blockId === selBlock.value) : gps;
  };

  const listSubtitle = (item) => {
    if (activeTab === 1) { const st = states.find(s => s.id === item.stateId); return st ? st.name : ''; }
    if (activeTab === 2) { const dist = districts.find(d => d.id === item.districtId); return dist ? dist.name : ''; }
    if (activeTab === 3) { const bl = blocks.find(b => b.id === item.blockId); return bl ? bl.name : ''; }
    return '';
  };

  const filterLabel = () => {
    if (activeTab === 3 && selBlock) return `GPs in ${selBlock.label}`;
    if (activeTab === 2 && selDistrict) return `Blocks in ${selDistrict.label}`;
    if (activeTab === 1 && selState) return `Districts in ${selState.label}`;
    return `All ${TABS[activeTab]}`;
  };

  const paginatedList = currentList().slice(0, page * ITEMS_PER_PAGE);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#1a3a8f" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Master Data</Text>
        <TouchableOpacity onPress={fetchAll} style={styles.refreshBtn}>
          <Text style={styles.refreshText}>⟳</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabBar}>
        {TABS.map((t, i) => (
          <TouchableOpacity key={t} style={[styles.tab, activeTab === i && styles.tabActive]} onPress={() => setActiveTab(i)}>
            <Text style={[styles.tabText, activeTab === i && styles.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Add Form */}
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Add New {TABS[activeTab].slice(0, -1)}</Text>
            {activeTab >= 1 && (
              <>
                <Text style={styles.fieldLabel}>STATE</Text>
                <PickerRow label="State" value={selState?.label} onPress={() => setStateModal(true)} />
              </>
            )}
            {activeTab >= 2 && (
              <>
                <Text style={styles.fieldLabel}>DISTRICT</Text>
                <PickerRow label="District" value={selDistrict?.label} onPress={() => setDistrictModal(true)} disabled={!selState} />
              </>
            )}
            {activeTab === 3 && (
              <>
                <Text style={styles.fieldLabel}>BLOCK</Text>
                <PickerRow label="Block" value={selBlock?.label} onPress={() => setBlockModal(true)} disabled={!selDistrict} />
              </>
            )}
            <Text style={styles.fieldLabel}>NAME *</Text>
            <TextInput
              style={styles.input}
              placeholder={`Enter ${TABS[activeTab].slice(0, -1)} name`}
              value={form.name}
              onChangeText={v => setForm(f => ({ ...f, name: v }))}
            />
            <Text style={styles.fieldLabel}>CODE (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. BLK-01"
              value={form.code}
              onChangeText={v => setForm(f => ({ ...f, code: v }))}
              autoCapitalize="characters"
            />
            <TouchableOpacity style={[styles.addBtn, saving && styles.addBtnDisabled]} onPress={handleAdd} disabled={saving}>
              {saving
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.addBtnText}>+ Add {TABS[activeTab].slice(0, -1)}</Text>}
            </TouchableOpacity>
          </View>

          {/* List */}
          <View style={styles.listCard}>
            <Text style={styles.listTitle}>{filterLabel()} ({currentList().length})</Text>
            {loading
              ? <ActivityIndicator style={{ marginTop: 16 }} color="#1a3a8f" />
              : currentList().length === 0
                ? <Text style={styles.emptyText}>No data found. Add one above.</Text>
                : <>
                    {paginatedList.map(item => (
                      <View key={item.id} style={styles.listItem}>
                        <Text style={styles.listItemName}>{item.name}</Text>
                        {listSubtitle(item) ? <Text style={styles.listItemSub}>{listSubtitle(item)}</Text> : null}
                        {item.code ? <Text style={styles.listItemCode}>{item.code}</Text> : null}
                      </View>
                    ))}
                    {paginatedList.length < currentList().length && (
                      <TouchableOpacity style={styles.loadMoreBtn} onPress={() => setPage(p => p + 1)}>
                        <Text style={styles.loadMoreText}>Load More</Text>
                      </TouchableOpacity>
                    )}
                  </>
            }
          </View>
        </ScrollView>
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

const BLUE = '#1a3a8f';
const styles = StyleSheet.create({
  safe:              { flex: 1, backgroundColor: '#f0f4ff' },
  header:            { backgroundColor: BLUE, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  backBtn:           { width: 36 },
  backArrow:         { color: '#fff', fontSize: 28, lineHeight: 30 },
  headerTitle:       { flex: 1, color: '#fff', fontSize: 18, fontWeight: '700', textAlign: 'center' },
  refreshBtn:        { width: 36, alignItems: 'flex-end' },
  refreshText:       { color: '#fff', fontSize: 22 },
  tabBar:            { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e0e7ff' },
  tab:               { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive:         { borderBottomWidth: 3, borderBottomColor: BLUE },
  tabText:           { color: '#888', fontSize: 12, fontWeight: '600' },
  tabTextActive:     { color: BLUE },
  scroll:            { padding: 16, paddingBottom: 40 },
  formCard:          { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  formTitle:         { fontSize: 15, fontWeight: '700', color: BLUE, marginBottom: 14 },
  fieldLabel:        { fontSize: 11, fontWeight: '700', color: '#888', marginBottom: 4, marginTop: 10, letterSpacing: 0.5 },
  input:             { borderWidth: 1, borderColor: '#dde3f0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: '#1a1a2e', backgroundColor: '#fafbff' },
  pickerRow:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#dde3f0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fafbff' },
  pickerDisabled:    { backgroundColor: '#f0f0f0', opacity: 0.6 },
  pickerText:        { fontSize: 15, color: '#1a1a2e' },
  pickerPlaceholder: { color: '#aaa' },
  pickerArrow:       { fontSize: 18, color: '#aaa' },
  addBtn:            { backgroundColor: BLUE, borderRadius: 8, paddingVertical: 13, alignItems: 'center', marginTop: 18 },
  addBtnDisabled:    { opacity: 0.6 },
  addBtnText:        { color: '#fff', fontWeight: '700', fontSize: 15 },
  listCard:          { backgroundColor: '#fff', borderRadius: 12, padding: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  listTitle:         { fontSize: 13, fontWeight: '700', color: '#555', marginBottom: 12 },
  listItem:          { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  listItemName:      { flex: 1, fontSize: 14, color: '#1a1a2e', fontWeight: '500' },
  listItemSub:       { fontSize: 12, color: '#888', marginRight: 8 },
  listItemCode:      { fontSize: 11, color: '#aaa', backgroundColor: '#f0f4ff', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  emptyText:         { color: '#aaa', textAlign: 'center', marginTop: 20, fontSize: 14 },
  loadMoreBtn:       { marginTop: 16, paddingVertical: 12, borderRadius: 8, backgroundColor: '#f0f4ff', alignItems: 'center' },
  loadMoreText:      { color: BLUE, fontWeight: '600', fontSize: 14 },
  modalSafe:         { flex: 1, backgroundColor: '#fff' },
  modalHeader:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#eee' },
  modalCancel:       { color: BLUE, fontSize: 15, width: 60 },
  modalTitle:        { flex: 1, textAlign: 'center', fontWeight: '700', fontSize: 16, color: '#1a1a2e' },
  searchInput:       { margin: 12, borderWidth: 1, borderColor: '#dde3f0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
  modalItem:         { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  modalItemText:     { fontSize: 15, color: '#1a1a2e' },
});
