import React, { useContext, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, ActivityIndicator, ScrollView, StatusBar, Platform
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../context/AuthContext';
import { getPendingSurveys, syncSurveys, syncMasterData } from '../utils/syncManager';
import api from '../utils/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radius, typography } from '../theme';

const DashboardScreen = ({ navigation }) => {
  const { userInfo, logout } = useContext(AuthContext);
  const [pendingCount, setPendingCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [todayCompletedCount, setTodayCompletedCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [isSynced, setIsSynced] = useState(true);

  const loadStats = async () => {
    try {
      const pending = await getPendingSurveys();
      setPendingCount(pending.length);
      setIsSynced(pending.length === 0);

      // Load cached counts
      const cachedCount = await AsyncStorage.getItem('completedCount');
      if (cachedCount) setCompletedCount(parseInt(cachedCount, 10));
      
      const cachedToday = await AsyncStorage.getItem('todayCompletedCount');
      if (cachedToday) setTodayCompletedCount(parseInt(cachedToday, 10));

      // Fetch fresh stats from API
      const res = await api.get('/survey/list');
      if (res.data) {
        const total = res.data.length;
        const todayStr = new Date().toISOString().split('T')[0];
        const todayCount = res.data.filter(s => s.createdAt && s.createdAt.startsWith(todayStr)).length;

        setCompletedCount(total);
        setTodayCompletedCount(todayCount);

        await AsyncStorage.setItem('completedCount', String(total));
        await AsyncStorage.setItem('todayCompletedCount', String(todayCount));
      }
    } catch (error) {
      console.log('Failed to fetch stats from API', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [])
  );

  const handleSyncData = async () => {
    setIsSyncing(true);
    try {
      await syncMasterData();
      if (pendingCount > 0) {
        const result = await syncSurveys();
        if (result.status === 'Success') {
          Alert.alert('Sync Complete', `Uploaded ${result.count} surveys. Master data refreshed.`);
        } else {
          Alert.alert('Partial Sync', `Master data updated. Survey upload: ${result.status}`);
        }
      } else {
        Alert.alert('Sync Complete', 'Master data refreshed. All data up to date.');
      }
      setLastSync(new Date());
      await loadStats();
    } catch (error) {
      Alert.alert('Sync Failed', 'Check your connection and try again.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  const getLastSyncText = () => {
    if (!lastSync) return 'NOT SYNCED';
    const mins = Math.floor((new Date() - lastSync) / 60000);
    if (mins < 1) return 'JUST NOW';
    return `${mins}M AGO`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      {/* App Header */}
      <View style={styles.headerBar}>
        <View style={styles.headerLeft}>
          <View style={styles.signalIcon}>
            <View style={[styles.bar, { height: 6 }]} />
            <View style={[styles.bar, { height: 10 }]} />
            <View style={[styles.bar, { height: 14 }]} />
            <View style={[styles.bar, { height: 18 }]} />
          </View>
          <Text style={styles.appName}>GP Survey Pro</Text>
        </View>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.syncIconText}>⇄</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.headerUnderline} />

      {/* Sync Status Bar */}
      <View style={[styles.syncBar, isSynced && pendingCount === 0 ? styles.syncBarSynced : styles.syncBarPending]}>
        <Text style={styles.syncBarIcon}>{pendingCount === 0 ? '☁' : '⟳'}</Text>
        <Text style={styles.syncBarText}>
          {pendingCount === 0 ? 'All data synced' : `${pendingCount} survey(s) pending sync`}
        </Text>
        <Text style={styles.syncBarTime}>LAST UPDATE: {getLastSyncText()}</Text>
      </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Card */}
        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>Ready to collect?</Text>
          <Text style={styles.heroSubtitle}>
            Start a new field survey. Location and offline storage active.
          </Text>
          <TouchableOpacity
            style={styles.heroBtn}
            onPress={() => navigation.navigate('SurveyForm')}
            activeOpacity={0.85}
          >
            <Text style={styles.heroBtnText}>＋  Start New Survey</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>COMPLETED</Text>
            <Text style={styles.statNumber}>{completedCount}</Text>
            <Text style={styles.statSub}>+{todayCompletedCount} today</Text>
          </View>
          <View style={[styles.statCard, pendingCount > 0 && styles.statCardWarning]}>
            <Text style={[styles.statLabel, pendingCount > 0 && styles.statLabelWarning]}>QUEUED</Text>
            <Text style={[styles.statNumber, pendingCount > 0 && styles.statNumberWarning]}>{pendingCount}</Text>
            <Text style={[styles.statSub, pendingCount > 0 && styles.statSubWarning]}>
              {pendingCount === 0 ? 'Synced' : 'Pending sync'}
            </Text>
          </View>
        </View>

        {/* User Info Card */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Field Officer</Text>
        </View>
        <View style={styles.userCard}>
          <View style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>
              {userInfo?.name?.charAt(0)?.toUpperCase() || 'U'}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{userInfo?.name || 'Surveyor'}</Text>
            <Text style={styles.userRole}>{userInfo?.role?.toUpperCase() || 'FIELD AGENT'}</Text>
          </View>
          <TouchableOpacity style={styles.logoutChip} onPress={handleLogout}>
            <Text style={styles.logoutChipText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Actions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Data Management</Text>
        </View>

        <TouchableOpacity
          style={[styles.actionBtn, styles.syncBtn]}
          onPress={handleSyncData}
          disabled={isSyncing}
          activeOpacity={0.85}
        >
          {isSyncing ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <>
              <Text style={styles.syncBtnIcon}>⟳</Text>
              <View>
                <Text style={styles.syncBtnLabel}>Sync Data</Text>
                <Text style={styles.syncBtnSub}>Upload pending + refresh master data</Text>
              </View>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: spacing.xl }} />
      </ScrollView>

      {/* Bottom Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={[styles.tab, styles.tabActive]}>
          <Text style={styles.tabIcon}>⊞</Text>
          <Text style={[styles.tabLabel, styles.tabLabelActive]}>Dashboard</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab} onPress={handleSyncData}>
          <Text style={styles.tabIcon}>⟳</Text>
          <Text style={styles.tabLabel}>Sync Status</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },

  // Header
  headerBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingVertical: 12,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  signalIcon: { flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  bar: { width: 4, backgroundColor: colors.primary, borderRadius: 1 },
  appName: { fontSize: 18, fontWeight: '700', color: colors.primary, letterSpacing: -0.3 },
  syncIconText: { fontSize: 22, color: colors.onSurface },
  headerUnderline: { height: 2, backgroundColor: colors.primary },

  // Sync bar
  syncBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingVertical: 8, gap: 6,
  },
  syncBarSynced: { backgroundColor: colors.inverseNavy },
  syncBarPending: { backgroundColor: colors.secondaryDark },
  syncBarIcon: { fontSize: 14, color: '#fff' },
  syncBarText: { flex: 1, fontSize: 13, color: '#fff', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  syncBarTime: { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },

  scrollContent: { flex: 1, paddingHorizontal: spacing.md, paddingTop: spacing.md },

  // Hero
  heroCard: {
    backgroundColor: colors.primary, borderRadius: radius.lg,
    padding: spacing.lg, marginBottom: spacing.md,
  },
  heroTitle: { ...typography.headlineMd, color: '#fff', marginBottom: 8 },
  heroSubtitle: { ...typography.bodyMd, color: 'rgba(255,255,255,0.8)', marginBottom: spacing.md, lineHeight: 22 },
  heroBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: radius.md,
    paddingVertical: 12, paddingHorizontal: spacing.md,
    alignSelf: 'flex-start',
  },
  heroBtnText: { color: colors.primary, fontWeight: '700', fontSize: 16 },

  // Stats
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  statCard: {
    flex: 1, backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.lg, padding: spacing.md,
    borderWidth: 1, borderColor: colors.outlineVariant,
  },
  statCardWarning: { backgroundColor: colors.pending, borderColor: colors.pendingBorder },
  statLabel: { ...typography.labelSm, color: colors.muted, letterSpacing: 1, marginBottom: 4 },
  statLabelWarning: { color: colors.secondaryDark },
  statNumber: { ...typography.displayLg, color: colors.primary, lineHeight: 40 },
  statNumberWarning: { color: colors.secondary },
  statSub: { ...typography.labelSm, color: colors.muted, marginTop: 2 },
  statSubWarning: { color: colors.secondaryDark },

  // Section Header
  sectionHeader: { marginBottom: 8, marginTop: spacing.sm },
  sectionTitle: { ...typography.headlineSm, color: colors.onSurface },

  // User Card
  userCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.white, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.outlineVariant,
    padding: spacing.md, marginBottom: spacing.md, gap: spacing.sm,
  },
  userAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center',
  },
  userAvatarText: { color: '#fff', fontWeight: '700', fontSize: 18 },
  userInfo: { flex: 1 },
  userName: { ...typography.bodyLg, color: colors.onSurface, fontWeight: '600' },
  userRole: {
    fontSize: 12, color: colors.muted,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 0.8,
  },
  logoutChip: {
    borderWidth: 1, borderColor: colors.outlineVariant,
    borderRadius: radius.md, paddingVertical: 6, paddingHorizontal: 12,
  },
  logoutChipText: { fontSize: 13, color: colors.muted, fontWeight: '600' },

  // Action Button
  actionBtn: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: radius.lg, padding: spacing.md,
    marginBottom: spacing.sm, gap: spacing.sm,
    minHeight: 64,
  },
  syncBtn: {
    backgroundColor: colors.white, borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  syncBtnIcon: { fontSize: 24, color: colors.primary },
  syncBtnLabel: { ...typography.bodyMd, color: colors.onSurface, fontWeight: '600' },
  syncBtnSub: { fontSize: 12, color: colors.muted, marginTop: 2 },

  // Tab Bar
  tabBar: {
    flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.outlineVariant,
    backgroundColor: colors.white,
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10, gap: 2 },
  tabActive: { borderTopWidth: 3, borderTopColor: colors.primary },
  tabIcon: { fontSize: 20 },
  tabLabel: { fontSize: 12, color: colors.muted, fontWeight: '500' },
  tabLabelActive: { color: colors.primary, fontWeight: '700' },
});

export default DashboardScreen;
