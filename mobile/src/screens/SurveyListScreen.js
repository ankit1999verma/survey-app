import React, { useCallback, useState, useContext } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  ActivityIndicator, StatusBar, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import { getAllSurveys } from '../utils/localDB';
import api from '../utils/api';
import { colors, spacing, radius } from '../theme';

const STATUS_COLORS = {
  YES:   { bg: '#d1fae5', text: '#065f46', label: 'SAVED' },
  DRAFT: { bg: '#fef3c7', text: '#92400e', label: 'DRAFT' },
};

const SurveyListScreen = ({ navigation }) => {
  const { showAlert: alert } = useAlert();
  const { userInfo } = useContext(AuthContext);
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL'); // 'ALL', 'PENDING', 'SYNCED'

  const loadSurveys = async () => {
    try {
      setLoading(true);
      
      // True Incremental Sync for Surveys
      const { getLocalSurveyMaxDate, insertSurvey } = require('../utils/localDB');
      const maxDate = await getLocalSurveyMaxDate();
      
      try {
        const res = await api.get(`/survey/list?afterDate=${encodeURIComponent(maxDate)}&size=1000`);
        if (res.data && res.data.content && res.data.content.length > 0) {
          // Save new surveys locally
          for (let s of res.data.content) {
            await insertSurvey({ ...s, synced: 1 });
          }
        }
      } catch (err) {
        if (err.response?.status !== 404) {
          console.log('Failed to fetch server surveys', err);
        }
      }
      
      // Load all surveys from SQLite (now includes freshly synced ones)
      const local = await getAllSurveys();
      setSurveys(local);

    } catch (e) {
      alert('Error', 'Error loading surveys: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { loadSurveys(); }, []));

  const renderItem = ({ item }) => {
    const statusCfg = STATUS_COLORS[item.surveyDone] || STATUS_COLORS.YES;
    const date = item.surveyDate || (item.createdAt ? item.createdAt.split('T')[0] : '—');
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('SurveyForm', { survey: item })}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.gpName} numberOfLines={1}>
            {item.gramPanchayatName || 'Unnamed GP'}
          </Text>
          <View style={[styles.badge, { backgroundColor: statusCfg.bg }]}>
            <Text style={[styles.badgeText, { color: statusCfg.text }]}>{statusCfg.label}</Text>
          </View>
        </View>
        <Text style={styles.meta}>{item.blockName || '—'} › {item.districtName || '—'} › {item.stateName || '—'}</Text>
        <Text style={styles.date}>{date}  {item.synced ? '✓ Synced' : '⏳ Pending sync'}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Saved Surveys</Text>
        <TouchableOpacity onPress={loadSurveys} style={styles.refreshBtn}>
          <Text style={styles.refreshIcon}>↻</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterBar}>
        {['ALL', 'PENDING', 'SYNCED'].map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={surveys.filter(s => filter === 'ALL' ? true : filter === 'PENDING' ? !s.synced : s.synced)}
          keyExtractor={(item, idx) => item.uuid || String(idx)}
          renderItem={renderItem}
          contentContainerStyle={surveys.length === 0 ? styles.emptyContainer : styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyText}>No saved surveys yet.</Text>
              <Text style={styles.emptySubText}>Start a new survey from the Dashboard.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingVertical: 14,
    backgroundColor: colors.surface || '#fff',
    borderBottomWidth: 1, borderBottomColor: '#e2e8f0',
  },
  backBtn: { padding: 8 },
  backIcon: { fontSize: 22, color: colors.primary },
  title: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700', color: colors.onSurface },
  refreshBtn: { padding: 8 },
  refreshIcon: { fontSize: 22, color: colors.primary },

  filterBar: {
    flexDirection: 'row', paddingHorizontal: spacing.md, paddingVertical: 10,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0'
  },
  filterBtn: {
    flex: 1, paddingVertical: 8, alignItems: 'center',
    borderRadius: 20, marginHorizontal: 4, backgroundColor: '#f1f5f9'
  },
  filterBtnActive: { backgroundColor: colors.primary },
  filterText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  filterTextActive: { color: '#fff' },

  listContent: { padding: spacing.md },
  emptyContainer: { flex: 1 },

  card: {
    backgroundColor: '#fff', borderRadius: radius.md,
    padding: spacing.md, marginBottom: spacing.md,
    borderWidth: 1, borderColor: '#e2e8f0',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  gpName: { flex: 1, fontSize: 16, fontWeight: '700', color: colors.onSurface },
  badge: {
    paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: 99, marginLeft: 8,
  },
  badgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  meta: { fontSize: 13, color: colors.muted, marginBottom: 4 },
  date: { fontSize: 12, color: '#94a3b8' },

  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  emptyIcon: { fontSize: 56, marginBottom: spacing.md },
  emptyText: { fontSize: 18, fontWeight: '700', color: colors.onSurface, marginBottom: 4 },
  emptySubText: { fontSize: 14, color: colors.muted, textAlign: 'center' },
});

export default SurveyListScreen;
