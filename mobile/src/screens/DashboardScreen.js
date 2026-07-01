import React, { useContext, useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, ActivityIndicator, ScrollView, StatusBar, Platform, Modal
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system/legacy';
import WheelPickerField from '../components/WheelPickerField';
import * as Sharing from 'expo-sharing';

import { AuthContext } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import { getPendingSurveys, syncSurveys, syncMasterData, getMasterData } from '../utils/syncManager';
import api from '../utils/api';
import { colors, spacing, radius, typography, shadows } from '../theme';

const DashboardScreen = ({ navigation }) => {
  const { userInfo, logout } = useContext(AuthContext);
  const { showAlert: alert } = useAlert();
  const [pendingCount, setPendingCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [todayCompletedCount, setTodayCompletedCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);

  // Export Modal State
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [statesList, setStatesList] = useState([]);
  const [districtsList, setDistrictsList] = useState([]);
  const [blocksList, setBlocksList] = useState([]);
  
  const [expStateId, setExpStateId] = useState(null);
  const [expStateName, setExpStateName] = useState('');
  const [expDistrictId, setExpDistrictId] = useState(null);
  const [expDistrictName, setExpDistrictName] = useState('');
  const [expBlockId, setExpBlockId] = useState(null);
  const [expBlockName, setExpBlockName] = useState('');

  const [isSynced, setIsSynced] = useState(true);

  const loadStats = async () => {
    try {
      const pending = await getPendingSurveys();
      setPendingCount(pending.length);
      setIsSynced(pending.length === 0);

      const cachedCount = await AsyncStorage.getItem('completedCount');
      if (cachedCount) setCompletedCount(parseInt(cachedCount, 10));
      
      const cachedToday = await AsyncStorage.getItem('todayCompletedCount');
      if (cachedToday) setTodayCompletedCount(parseInt(cachedToday, 10));

      const cachedLastSync = await AsyncStorage.getItem('lastSyncTime');
      if (cachedLastSync) {
        setLastSync(new Date(cachedLastSync));
      } else {
        setTimeout(() => handleSyncData(true), 100);
      }

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

  async function handleSyncData(isAuto = false) {
    const silent = isAuto === true;
    setIsSyncing(true);
    try {
      const [result, mdResult] = await Promise.all([
        syncSurveys(),
        syncMasterData()
      ]);
      setLastSync(new Date());
      await AsyncStorage.setItem('lastSyncTime', new Date().toISOString());
      if (!silent) {
        if (result.count > 0) {
          alert('Sync Complete', `Uploaded ${result.count} surveys. Master data refreshed.`);
        } else if (result.status !== 'Nothing to sync') {
          alert('Partial Sync', `Master data updated. Survey upload: ${result.status}`);
        } else {
          alert('Sync Complete', 'Master data refreshed. All data up to date.');
        }
      }
      setIsSynced(true);
      if (!silent) loadStats();
    } catch (e) {
      console.log('Sync err', e);
      if (!silent) alert('Sync Failed', 'Check your connection and try again.');
    } finally {
      setIsSyncing(false);
    }
  }

  const [masterData, setMasterData] = useState(null);
  const [exportCount, setExportCount] = useState(null);
  const [isCounting, setIsCounting] = useState(false);

  useEffect(() => {
    if (!exportModalVisible) return;
    const fetchCount = async () => {
      setIsCounting(true);
      try {
        const queryParams = [];
        if (expStateId) queryParams.push(`stateId=${expStateId}`);
        if (expDistrictId) queryParams.push(`districtId=${expDistrictId}`);
        if (expBlockId) queryParams.push(`blockId=${expBlockId}`);
        const queryStr = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
        const res = await api.get('/survey/count' + queryStr);
        setExportCount(res.data.total);
      } catch (e) {
        setExportCount(0);
      } finally {
        setIsCounting(false);
      }
    };
    fetchCount();
  }, [expStateId, expDistrictId, expBlockId, exportModalVisible]);

  const openExportModal = async () => {
    try {
      const md = await getMasterData();
      setMasterData(md);
      setStatesList(md?.states || []);
      setExportModalVisible(true);
    } catch (e) {
      console.log('Failed to load states for export', e);
    }
  };

  const onExportStateChange = (name) => {
    const s = statesList.find(x => x.name === name);
    setExpStateName(name);
    setExpStateId(s?.id || null);
    setExpDistrictName(''); setExpDistrictId(null);
    setExpBlockName(''); setExpBlockId(null);
    if (s?.id && masterData) {
      setDistrictsList(masterData.districts.filter(d => d.stateId === s.id) || []);
    } else {
      setDistrictsList([]);
    }
  };

  const onExportDistrictChange = (name) => {
    const d = districtsList.find(x => x.name === name);
    setExpDistrictName(name);
    setExpDistrictId(d?.id || null);
    setExpBlockName(''); setExpBlockId(null);
    if (d?.id && masterData) {
      setBlocksList(masterData.blocks.filter(b => b.districtId === d.id) || []);
    } else {
      setBlocksList([]);
    }
  };

  const onExportBlockChange = (name) => {
    const b = blocksList.find(x => x.name === name);
    setExpBlockName(name);
    setExpBlockId(b?.id || null);
  };

  const handleExportExcel = async () => {
    try {
      setExportModalVisible(false);
      setIsSyncing(true);
      
      const queryParams = [];
      if (expStateId) queryParams.push(`stateId=${expStateId}`);
      if (expDistrictId) queryParams.push(`districtId=${expDistrictId}`);
      if (expBlockId) queryParams.push(`blockId=${expBlockId}`);
      const queryStr = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
      const exportUrl = api.defaults.baseURL + '/survey/export' + queryStr;

      if (Platform.OS === 'web') {
        window.open(exportUrl, '_blank');
      } else {
        const fileUri = FileSystem.documentDirectory + `GP_Survey_Export_${Date.now()}.xlsx`;
        const downloadRes = await FileSystem.downloadAsync(exportUrl, fileUri);
        if (downloadRes.status !== 200) {
          throw new Error('Server returned ' + downloadRes.status);
        }
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(downloadRes.uri, {
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            dialogTitle: 'Download Survey Data'
          });
        } else {
          alert('Error', 'Sharing is not available on this device');
        }
      }
    } catch (e) {
      alert('Export Failed', e.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to logout?')) logout();
    } else {
      alert('Logout', 'Are you sure you want to logout?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout },
      ]);
    }
  };

  const getLastSyncText = () => {
    if (!lastSync) return 'NOT SYNCED';
    const mins = Math.floor((new Date() - lastSync) / 60000);
    if (mins < 1) return 'JUST NOW';
    return `${mins}M AGO`;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surfaceContainer} />

      {/* App Header */}
      <View style={styles.headerBar}>
        <View style={styles.headerLeft}>
          <View style={styles.iconBox}>
            <Feather name="bar-chart-2" size={20} color={colors.primary} />
          </View>
          <Text style={styles.appName}>GP Survey Pro</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Feather name="log-out" size={20} color={colors.onSurfaceVariant} />
        </TouchableOpacity>
      </View>

      {/* Sync Status Bar */}
      <View style={[styles.syncBar, isSynced && pendingCount === 0 ? styles.syncBarSynced : styles.syncBarPending]}>
        <Feather name={pendingCount === 0 ? "check-circle" : "refresh-cw"} size={14} color="#fff" />
        <Text style={styles.syncBarText}>
          {pendingCount > 0 
            ? `${pendingCount} survey(s) pending sync` 
            : !lastSync 
              ? 'Ready to sync' 
              : 'All data synced'}
        </Text>
        <Text style={styles.syncBarTime}>LAST UPDATE: {getLastSyncText()}</Text>
      </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <Text style={styles.heroTitle}>Ready to collect?</Text>
            <Feather name="map-pin" size={24} color="rgba(255,255,255,0.8)" />
          </View>
          <Text style={styles.heroSubtitle}>
            Start a new field survey. Location and offline storage active.
          </Text>
          <TouchableOpacity
            style={styles.heroBtn}
            onPress={() => navigation.navigate('SurveyForm')}
            activeOpacity={0.85}
          >
            <Feather name="plus" size={20} color={colors.primary} />
            <Text style={styles.heroBtnText}>Start New Survey</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={styles.statIconBox}>
              <Feather name="check-square" size={16} color={colors.primary} />
            </View>
            <Text style={styles.statNumber}>{completedCount}</Text>
            <Text style={styles.statLabel}>COMPLETED</Text>
            <Text style={styles.statSub}>+{todayCompletedCount} today</Text>
          </View>
          <View style={[styles.statCard, pendingCount > 0 && styles.statCardWarning]}>
            <View style={[styles.statIconBox, pendingCount > 0 && { backgroundColor: colors.pendingBorder }]}>
              <Feather name="upload-cloud" size={16} color={pendingCount > 0 ? '#fff' : colors.primary} />
            </View>
            <Text style={[styles.statNumber, pendingCount > 0 && styles.statNumberWarning]}>{pendingCount}</Text>
            <Text style={[styles.statLabel, pendingCount > 0 && styles.statLabelWarning]}>QUEUED</Text>
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
        </View>

        {/* Actions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Data Management</Text>
        </View>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={handleSyncData}
          disabled={isSyncing}
          activeOpacity={0.8}
        >
          <View style={[styles.actionIconBox, { backgroundColor: '#E0E7FF' }]}>
            {isSyncing ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Feather name="refresh-cw" size={22} color={colors.primary} />
            )}
          </View>
          <View style={styles.actionTextContent}>
            <Text style={styles.actionBtnLabel}>Sync Data</Text>
            <Text style={styles.actionBtnSub}>Upload pending + refresh master data</Text>
          </View>
          <Feather name="chevron-right" size={20} color={colors.outline} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate('MasterData')}
          activeOpacity={0.8}
        >
          <View style={[styles.actionIconBox, { backgroundColor: '#FCE7F3' }]}>
            <Feather name="database" size={22} color="#BE185D" />
          </View>
          <View style={styles.actionTextContent}>
            <Text style={styles.actionBtnLabel}>Manage Master Data</Text>
            <Text style={styles.actionBtnSub}>Add State · District · Block · GP</Text>
          </View>
          <Feather name="chevron-right" size={20} color={colors.outline} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={openExportModal}
          disabled={isSyncing}
          activeOpacity={0.8}
        >
          <View style={[styles.actionIconBox, { backgroundColor: '#DCFCE7' }]}>
            <Feather name="download" size={22} color="#166534" />
          </View>
          <View style={styles.actionTextContent}>
            <Text style={styles.actionBtnLabel}>Export to Excel</Text>
            <Text style={styles.actionBtnSub}>Download complete survey dataset</Text>
          </View>
          <Feather name="chevron-right" size={20} color={colors.outline} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate('SurveyList')}
          activeOpacity={0.8}
        >
          <View style={[styles.actionIconBox, { backgroundColor: '#D1FAE5' }]}>
            <Feather name="file-text" size={22} color={colors.success} />
          </View>
          <View style={styles.actionTextContent}>
            <Text style={styles.actionBtnLabel}>View Saved Surveys</Text>
            <Text style={styles.actionBtnSub}>Edit drafts · Track pending uploads</Text>
          </View>
          <Feather name="chevron-right" size={20} color={colors.outline} />
        </TouchableOpacity>

        <View style={{ height: spacing.xxl }} />
      </ScrollView>

      {/* Bottom Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabActive}>
          <Feather name="grid" size={22} color={colors.primary} />
          <Text style={styles.tabLabelActive}>Dashboard</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab} onPress={() => navigation.navigate('SurveyList')}>
          <Feather name="file-text" size={22} color={colors.muted} />
          <Text style={styles.tabLabel}>Surveys</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab} onPress={handleSyncData} disabled={isSyncing}>
          {isSyncing ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Feather name="refresh-cw" size={22} color={colors.muted} />
          )}
          <Text style={styles.tabLabel}>{isSyncing ? 'Syncing...' : 'Sync'}</Text>
        </TouchableOpacity>
      </View>
      <Modal visible={exportModalVisible} transparent animationType="slide" onRequestClose={() => setExportModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Export Options</Text>
              <TouchableOpacity onPress={() => setExportModalVisible(false)}>
                <Feather name="x" size={24} color={colors.onSurface} />
              </TouchableOpacity>
            </View>
            <View style={{ padding: spacing.xl }}>
              <WheelPickerField
                label="STATE / UT"
                value={expStateName}
                items={[{ label: '— All States —', value: '' }, ...statesList.map(s => ({ label: s.name, value: s.name }))]}
                placeholder="All States"
                onChange={onExportStateChange}
              />
              <WheelPickerField
                label="DISTRICT"
                value={expDistrictName}
                items={[{ label: '— All Districts —', value: '' }, ...districtsList.map(d => ({ label: d.name, value: d.name }))]}
                placeholder={expStateId ? "All Districts" : "— Select state first —"}
                disabled={!expStateId}
                onChange={onExportDistrictChange}
              />
              <WheelPickerField
                label="BLOCK"
                value={expBlockName}
                items={[{ label: '— All Blocks —', value: '' }, ...blocksList.map(b => ({ label: b.name, value: b.name }))]}
                placeholder={expDistrictId ? "All Blocks" : "— Select district first —"}
                disabled={!expDistrictId}
                onChange={onExportBlockChange}
              />
              <TouchableOpacity 
                style={[styles.downloadBtn, (exportCount === 0 || isCounting) && { opacity: 0.5 }]} 
                onPress={handleExportExcel}
                disabled={exportCount === 0 || isCounting}
              >
                {isCounting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Feather name="download" size={20} color="#fff" />
                )}
                <Text style={styles.downloadBtnText}>
                  {isCounting ? 'Calculating...' : (exportCount === 0 ? '0 Surveys Found' : `Download Excel (${exportCount ?? '...'})`)}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfaceContainer },

  // Header
  headerBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingVertical: 14,
    backgroundColor: colors.surfaceContainer,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBox: {
    width: 36, height: 36, borderRadius: radius.md,
    backgroundColor: colors.primaryContainer,
    justifyContent: 'center', alignItems: 'center'
  },
  appName: { ...typography.headlineSm, color: colors.onSurface, letterSpacing: -0.3 },
  logoutBtn: { padding: 8 },

  // Sync bar
  syncBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingVertical: 8, gap: 8,
  },
  syncBarSynced: { backgroundColor: colors.success },
  syncBarPending: { backgroundColor: colors.secondaryDark },
  syncBarText: { flex: 1, ...typography.labelSm, color: '#fff' },
  syncBarTime: { fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.8)' },

  scrollContent: { flex: 1, paddingHorizontal: spacing.md, paddingTop: spacing.md },

  // Hero
  heroCard: {
    backgroundColor: colors.primary, 
    borderRadius: radius.xl,
    padding: spacing.lg, 
    marginBottom: spacing.md,
    ...shadows.primary,
  },
  heroHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  heroTitle: { ...typography.headlineMd, color: '#fff' },
  heroSubtitle: { ...typography.bodyMd, color: 'rgba(255,255,255,0.85)', marginBottom: spacing.lg, lineHeight: 22 },
  heroBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fff', borderRadius: radius.lg,
    paddingVertical: 14, paddingHorizontal: spacing.lg,
    alignSelf: 'flex-start',
    ...shadows.sm,
  },
  heroBtnText: { color: colors.primary, fontWeight: '700', fontSize: 16 },

  // Stats
  statsRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  statCard: {
    flex: 1, backgroundColor: colors.white,
    borderRadius: radius.lg, padding: spacing.md,
    ...shadows.sm,
  },
  statCardWarning: { backgroundColor: '#FFFBEB' },
  statIconBox: {
    width: 32, height: 32, borderRadius: radius.md,
    backgroundColor: colors.primaryContainer,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: { ...typography.displayLg, color: colors.onSurface, marginBottom: 2 },
  statNumberWarning: { color: colors.secondaryDark },
  statLabel: { ...typography.labelSm, color: colors.muted, letterSpacing: 1 },
  statLabelWarning: { color: colors.secondaryDark },
  statSub: { ...typography.labelSm, color: colors.success, marginTop: 4 },
  statSubWarning: { color: colors.secondary },

  // Section Header
  sectionHeader: { marginBottom: 12, marginTop: spacing.md },
  sectionTitle: { ...typography.headlineSm, color: colors.onSurface },

  // User Card
  userCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.white, borderRadius: radius.lg,
    padding: spacing.md, marginBottom: spacing.md, gap: spacing.md,
    ...shadows.sm,
  },
  userAvatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center',
  },
  userAvatarText: { ...typography.headlineSm, color: '#fff' },
  userInfo: { flex: 1 },
  userName: { ...typography.headlineSm, color: colors.onSurface },
  userRole: { ...typography.labelSm, color: colors.muted, marginTop: 2 },

  // Action Button
  actionBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.lg, padding: spacing.md,
    marginBottom: spacing.sm, gap: spacing.md,
    ...shadows.sm,
  },
  actionIconBox: {
    width: 44, height: 44, borderRadius: radius.md,
    justifyContent: 'center', alignItems: 'center',
  },
  actionTextContent: { flex: 1 },
  actionBtnLabel: { ...typography.bodyMd, color: colors.onSurface, fontWeight: '700' },
  actionBtnSub: { ...typography.labelSm, color: colors.muted, marginTop: 4 },

  // Tab Bar
  tabBar: {
    flexDirection: 'row', 
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    ...shadows.lg,
  },
  tab: { flex: 1, alignItems: 'center', gap: 4 },
  tabActive: { flex: 1, alignItems: 'center', gap: 4 },
  tabLabel: { ...typography.labelSm, color: colors.muted },
  tabLabelActive: { ...typography.labelSm, color: colors.primary },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.xl, paddingTop: spacing.xl, paddingBottom: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: '#f1f5f9'
  },
  modalTitle: {
    fontSize: 20, fontWeight: '700', color: colors.onSurface
  },
  downloadBtn: {
    backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 12,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    marginTop: spacing.xl,
  },
  downloadBtnText: {
    color: '#fff', fontSize: 16, fontWeight: '700', marginLeft: 8
  },
});

export default DashboardScreen;
