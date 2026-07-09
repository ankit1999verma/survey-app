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
import { Feather } from '@expo/vector-icons';
import { colors, spacing, radius, typography, shadows } from '../theme';

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
      const { getLocalSurveyMaxId, insertServerSurvey } = require('../utils/localDB');
      const maxId = await getLocalSurveyMaxId();
      
      try {
        const res = await api.get(`/survey/list?afterId=${encodeURIComponent(maxId)}&size=1000`);
        if (res.data && res.data.content && res.data.content.length > 0) {
          // Save new surveys locally without overwriting unsynced edits
          for (let s of res.data.content) {
            await insertServerSurvey(s);
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
        
        <View style={styles.cardFooter}>
          <Feather name="calendar" size={14} color={colors.muted} />
          <Text style={styles.date}>{date}</Text>
          <View style={{ flex: 1 }} />
          <Feather name={item.synced ? "check-circle" : "clock"} size={14} color={item.synced ? colors.success : colors.secondary} />
          <Text style={[styles.syncStatus, { color: item.synced ? colors.success : colors.secondaryDark }]}>
            {item.synced ? 'Synced' : 'Pending Sync'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Feather name="chevron-left" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Saved Surveys</Text>
        <TouchableOpacity onPress={loadSurveys} style={styles.headerBtn}>
          <Feather name="refresh-cw" size={20} color="#fff" />
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
              <View style={styles.emptyIconBox}>
                <Feather name="file-text" size={40} color={colors.primary} />
              </View>
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
  container: { flex: 1, backgroundColor: colors.surfaceContainer },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingVertical: 14,
    backgroundColor: colors.primary,
  },
  headerBtn: { width: 40, alignItems: 'center' },
  title: { flex: 1, textAlign: 'center', ...typography.headlineSm, color: '#fff' },

  filterBar: {
    flexDirection: 'row', paddingHorizontal: spacing.md, paddingVertical: 12,
    backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.outlineVariant
  },
  filterBtn: {
    flex: 1, paddingVertical: 10, alignItems: 'center',
    borderRadius: radius.xl, marginHorizontal: 4, backgroundColor: colors.surfaceContainerLow
  },
  filterBtnActive: { backgroundColor: colors.primary, ...shadows.sm },
  filterText: { ...typography.labelMd, color: colors.muted },
  filterTextActive: { color: '#fff' },

  listContent: { padding: spacing.md, paddingBottom: spacing.xxl },
  emptyContainer: { flex: 1 },

  card: {
    backgroundColor: '#fff', borderRadius: radius.xl,
    padding: spacing.lg, marginBottom: spacing.md,
    borderWidth: 1, borderColor: colors.outlineVariant,
    ...shadows.sm,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  gpName: { flex: 1, ...typography.headlineSm, color: colors.onSurface },
  badge: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: radius.md, marginLeft: 8,
  },
  badgeText: { ...typography.labelSm },
  meta: { ...typography.bodyMd, color: colors.onSurfaceVariant, marginBottom: 12 },
  
  cardFooter: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.surfaceContainerLow
  },
  date: { ...typography.labelMd, color: colors.muted },
  syncStatus: { ...typography.labelMd },

  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  emptyIconBox: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.primaryContainer,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: spacing.lg,
  },
  emptyText: { ...typography.headlineSm, color: colors.onSurface, marginBottom: 4 },
  emptySubText: { ...typography.bodyMd, color: colors.muted, textAlign: 'center' },
});

export default SurveyListScreen;
