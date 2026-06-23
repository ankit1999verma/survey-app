import React, { useState, useEffect, useContext } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  ScrollView, Alert, StatusBar, Platform, ActivityIndicator, Image, ActionSheetIOS
} from 'react-native';
import WheelPickerField from '../components/WheelPickerField';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import * as FileSystem from 'expo-file-system';
import { AuthContext } from '../context/AuthContext';
import { saveSurveyOffline, getMasterData, syncMasterData } from '../utils/syncManager';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radius, typography } from '../theme';

// YES / NO / NA dropdown items
const ynaItems = [
  { label: 'Yes', value: 'Yes' },
  { label: 'No', value: 'No' },
  { label: 'N/A', value: 'NA' },
];

// ── Static sub-components (defined OUTSIDE to prevent re-mount on every render) ──
const SectionCard = ({ title, color = colors.primary, children }) => (
  <View style={[styles.sectionCard, { borderLeftColor: color }]}>
    {title ? <Text style={[styles.sectionTag, { color }]}>{title}</Text> : null}
    {children}
  </View>
);

const FieldLabel = ({ text }) => <Text style={styles.fieldLabel}>{text}</Text>;

const TextF = ({ label, placeholder, value, onChangeText, keyboardType, multiline }) => {
  const [isFocused, setIsFocused] = React.useState(false);
  return (
    <View style={styles.formGroup}>
      <FieldLabel text={label} />
      <TextInput
        style={[styles.input,
          multiline && { height: 80, textAlignVertical: 'top', paddingTop: 12 },
          isFocused && styles.inputFocused,
        ]}
        placeholder={placeholder || `Enter ${label.toLowerCase()}`}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType || 'default'}
        placeholderTextColor={colors.placeholder}
        multiline={multiline}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
    </View>
  );
};

const WheelF = ({ label, value, onChange, items, disabled, placeholder }) => (
  <WheelPickerField
    label={label} value={value} onChange={onChange}
    items={items} disabled={disabled} placeholder={placeholder || 'Select option...'}
  />
);

const PhoneField = ({ label, value, onChangeText, placeholder }) => {
  const [isFocused, setIsFocused] = React.useState(false);
  return (
    <View style={styles.formGroup}>
      <FieldLabel text={label} />
      <View style={[styles.phoneWrapper, isFocused && styles.inputFocused]}>
        <View style={styles.phonePrefix}><Text style={styles.phonePrefixText}>+91</Text></View>
        <View style={styles.phoneDivider} />
        <TextInput
          style={styles.phoneInput}
          placeholder={placeholder || "XXXXXX XXXXX"}
          value={value}
          onChangeText={onChangeText}
          keyboardType="number-pad" maxLength={10}
          placeholderTextColor={colors.placeholder}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        {value.length > 0 && <Text style={styles.phoneCount}>{value.length}/10</Text>}
      </View>
    </View>
  );
};

const GpsField = ({ label, value, onChangeText, placeholder, onFetchLocation, isFetching, isFetchingThis }) => {
  const [isFocused, setIsFocused] = React.useState(false);
  return (
    <View style={styles.formGroup}>
      <FieldLabel text={label} />
      <View style={styles.gpsRow}>
        <TextInput
          style={[styles.input, { flex: 1 }, isFocused && styles.inputFocused]}
          placeholder={placeholder || "lat, long"}
          value={value}
          onChangeText={onChangeText}
          placeholderTextColor={colors.placeholder}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        <TouchableOpacity style={styles.gpsBtn} onPress={onFetchLocation} disabled={isFetching}>
          {isFetchingThis
            ? <ActivityIndicator color={colors.white} size="small" />
            : <Text style={styles.gpsBtnText}>📍</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const SurveyFormScreen = ({ navigation }) => {
  const { userInfo } = useContext(AuthContext);

  // ── Master Data ──────────────────────────────────────────────
  const [masterData, setMasterData] = useState({ states: [], districts: [], blocks: [], gramPanchayats: [] });
  const [isLoadingData, setIsLoadingData] = useState(true);

  // ── Location Dropdowns ───────────────────────────────────────
  const [stateId, setStateId] = useState(null);
  const [districtId, setDistrictId] = useState(null);
  const [blockId, setBlockId] = useState(null);
  const [gpId, setGpId] = useState(null);

  // ── Administrative Fields ────────────────────────────────────
  const [gpName, setGpName] = useState('');
  const [sarpanchName, setSarpanchName] = useState('');
  const [sarpanchContact, setSarpanchContact] = useState('');

  // ── Power & Infrastructure ───────────────────────────────────
  const [electricityHrs, setElectricityHrs] = useState('');
  const [electricMeter, setElectricMeter] = useState(null);
  const [solarAvail, setSolarAvail] = useState(null);
  const [earthing, setEarthing] = useState(null);
  const [infraStatus, setInfraStatus] = useState('');

  // ── GP Bhawan Details ────────────────────────────────────────
  const [gpBhawanAvail, setGpBhawanAvail] = useState(null);
  const [gpBhawanInfra, setGpBhawanInfra] = useState('');
  const [gpBhawanMeter, setGpBhawanMeter] = useState(null);
  const [gpBhawanSolar, setGpBhawanSolar] = useState(null);
  const [gpBhawanEarthing, setGpBhawanEarthing] = useState(null);

  // ── Geospatial Data ──────────────────────────────────────────
  const [gpAvailAsKml, setGpAvailAsKml] = useState('');
  const [gpOriginalLoc, setGpOriginalLoc] = useState('');
  const [gpCurrentLoc, setGpCurrentLoc] = useState('');
  const [gpPlLoc, setGpPlLoc] = useState('');
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [fetchingTarget, setFetchingTarget] = useState(null); // 'current' | 'original' | 'plot'

  // ── Respondent ───────────────────────────────────────────────
  const [respondentName, setRespondentName] = useState('');
  const [age, setAge] = useState(null);
  const [ageItems] = useState(
    [{ label: 'Under 18', value: 17 }].concat(
      Array.from({ length: 83 }, (_, i) => ({ label: String(i + 18), value: i + 18 }))
    ).concat([{ label: '100+', value: 100 }])
  );
  const [gender, setGender] = useState('Male');
  const [contact, setContact] = useState('');

  // ── Documentation ────────────────────────────────────────────
  const [remarks, setRemarks] = useState('');
  const [photos, setPhotos] = useState([]); // [{ uri, fileName }]

  // ── Storage ──────────────────────────────────────────────────
  const [storageInfo, setStorageInfo] = useState({ used: 0, total: 100 }); // MB

  // ── UI State ─────────────────────────────────────────────────
  const [isSaving, setIsSaving] = useState(false);

  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    loadMaster();
    loadStorageInfo();
  }, []);

  const loadMaster = async () => {
    setIsLoadingData(true);
    try {
      let data = await getMasterData();
      if (!data || !data.states || data.states.length === 0) {
        data = await syncMasterData();
      }
      if (data) setMasterData(data);
    } catch (_) {}
    finally { setIsLoadingData(false); }
  };

  const loadStorageInfo = async () => {
    try {
      const info = await FileSystem.getInfoAsync(FileSystem.documentDirectory);
      const freeMB = info.freeSpace ? Math.floor(info.freeSpace / (1024 * 1024)) : null;
      const totalMB = info.totalSpace ? Math.floor(info.totalSpace / (1024 * 1024)) : null;
      if (freeMB !== null && totalMB !== null) {
        setStorageInfo({ used: totalMB - freeMB, total: totalMB });
      }
    } catch (_) {}
  };

  // ── GPS ────────────────────────────────────────────────────
  const fetchLiveLocation = async (target) => {
    setIsFetchingLocation(true);
    setFetchingTarget(target);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const coords = `${loc.coords.latitude.toFixed(6)}, ${loc.coords.longitude.toFixed(6)}`;
      if (target === 'current') setGpCurrentLoc(coords);
      else if (target === 'original') setGpOriginalLoc(coords);
      else if (target === 'plot') setGpPlLoc(coords);
    } catch {
      Alert.alert('Error', 'Could not get location. Please try again.');
    } finally {
      setIsFetchingLocation(false);
      setFetchingTarget(null);
    }
  };

  // ── Camera / Gallery ───────────────────────────────────────
  const handlePhotoOption = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['Cancel', 'Take Photo', 'Choose from Gallery'], cancelButtonIndex: 0 },
        (idx) => { if (idx === 1) takePhoto(); else if (idx === 2) pickFromGallery(); }
      );
    } else {
      Alert.alert('Upload Photo', 'Choose source', [
        { text: 'Camera', onPress: takePhoto },
        { text: 'Gallery', onPress: pickFromGallery },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission required', 'Camera access is needed.'); return; }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: 'images',
      quality: 0.7,
      allowsEditing: false,
    });
    if (!result.canceled) {
      const asset = result.assets[0];
      setPhotos(prev => [...prev, { uri: asset.uri, fileName: asset.fileName || `SITE_${Date.now()}.jpg` }]);
    }
  };

  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission required', 'Photo library access is needed.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      quality: 0.7,
      allowsMultipleSelection: true,
      selectionLimit: 10,
    });
    if (!result.canceled) {
      const newPhotos = result.assets.map(a => ({ uri: a.uri, fileName: a.fileName || `SITE_${Date.now()}.jpg` }));
      setPhotos(prev => [...prev, ...newPhotos]);
    }
  };

  // ── Save ───────────────────────────────────────────────────
  const handleSave = async (syncNow = false) => {
    if (!stateId || !districtId || !blockId || !gpId || !respondentName) {
      Alert.alert('Incomplete Form', 'Please fill all required fields (location + respondent name).');
      return;
    }
    setIsSaving(true);
    try {
      await saveSurveyOffline({
        userId: userInfo.id,
        stateId, districtId, blockId, gramPanchayatId: gpId,
        gpName, sarpanchName, sarpanchContact,
        electricityHrs, electricMeter, solarAvail, earthing, infraStatus,
        gpBhawanAvail, gpBhawanInfra, gpBhawanMeter, gpBhawanSolar, gpBhawanEarthing,
        gpAvailAsKml, gpOriginalLoc, gpCurrentLoc, gpPlLoc,
        respondentName, age, gender, contact: contact ? `+91${contact}` : '',
        remarks, photoUris: photos.map(p => p.uri),
        latitude: null, longitude: null, responses: {},
      });
      Alert.alert('Saved', syncNow ? 'Saved and queued for sync.' : 'Survey saved offline.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch {
      Alert.alert('Error', 'Could not save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredDistricts = masterData.districts.filter(d => String(d.stateId) === String(stateId));
  const filteredBlocks = masterData.blocks.filter(b => String(b.districtId) === String(districtId));
  const filteredGPs = masterData.gramPanchayats.filter(g => String(g.blockId) === String(blockId));



  const storagePercent = Math.min((storageInfo.used / storageInfo.total) * 100, 100);
  const storageFull = storagePercent > 90;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      {/* Header */}
      <View style={styles.headerBar}>
        <View style={styles.headerLeft}>
          <View style={styles.signalIcon}>
            {[6, 10, 14, 18].map((h, i) => <View key={i} style={[styles.bar, { height: h }]} />)}
          </View>
          <Text style={styles.appName}>GP Survey Pro</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.cancelBtn}>
          <Text style={styles.cancelText}>✕ Cancel</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.headerUnderline} />

      {/* Offline Banner */}
      <View style={styles.offlineBar}>
        <Text style={styles.offlineText}>⊘  OFFLINE MODE — DATA WILL BE STORED LOCALLY</Text>
      </View>

      <ScrollView
        style={styles.scrollContent}
        nestedScrollEnabled keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>New Data Capture</Text>
        <Text style={styles.pageSubtitle}>Industrial Grade Survey Entry</Text>

        {isLoadingData && (
          <View style={styles.loadingBanner}>
            <ActivityIndicator color={colors.primary} size="small" />
            <Text style={styles.loadingText}>Loading master data...</Text>
          </View>
        )}

        {/* ── ADMINISTRATIVE ─────────────────────────────── */}
        <SectionCard title="ADMINISTRATIVE" zBase={9000}>
          <WheelF label="STATE *"
            value={stateId}
            onChange={(v) => { setStateId(v); setDistrictId(null); setBlockId(null); setGpId(null); }}
            items={masterData.states.map(s => ({ label: s.name, value: s.id }))}
            placeholder={isLoadingData ? 'Loading...' : 'Select State...'} />

          <WheelF label="DISTRICT *"
            value={districtId}
            onChange={(v) => { setDistrictId(v); setBlockId(null); setGpId(null); }}
            items={filteredDistricts.map(d => ({ label: d.name, value: d.id }))}
            disabled={!stateId} placeholder="Select District..." />

          <WheelF label="BLOCK *"
            value={blockId}
            onChange={(v) => { setBlockId(v); setGpId(null); }}
            items={filteredBlocks.map(b => ({ label: b.name, value: b.id }))}
            disabled={!districtId} placeholder="Select Block..." />

          <WheelF label="GRAM PANCHAYAT *"
            value={gpId} onChange={setGpId}
            items={filteredGPs.map(g => ({ label: g.name, value: g.id }))}
            disabled={!blockId} placeholder="Select GP..." />

          <TextF label="GP NAME" placeholder="Enter Gram Panchayat Name" value={gpName} onChangeText={setGpName} />
          <TextF label="SARPANCH NAME" placeholder="Enter Sarpanch Name" value={sarpanchName} onChangeText={setSarpanchName} />

          {/* Sarpanch Contact */}
          <PhoneField
            label="SARPANCH CONTACT NO"
            placeholder="XXXXXX XXXXX"
            value={sarpanchContact}
            onChangeText={(v) => setSarpanchContact(v.replace(/\D/g, '').slice(0, 10))}
          />
        </SectionCard>

        {/* ── POWER & INFRASTRUCTURE ─────────────────────── */}
        <SectionCard title="POWER & INFRASTRUCTURE" color={colors.secondary} zBase={5000}>
          <TextF label="ELECTRICITY AVAILABLE IN HRS" placeholder="e.g. 16" value={electricityHrs} onChangeText={setElectricityHrs} keyboardType="numeric" />
          <WheelF label="ELECTRIC METER AVAILABLE" value={electricMeter} onChange={setElectricMeter} items={ynaItems} />
          <WheelF label="SOLAR AVAILABILITY" value={solarAvail} onChange={setSolarAvail} items={ynaItems} />
          <WheelF label="EARTHING AVAILABILITY" value={earthing} onChange={setEarthing} items={ynaItems} />
          <TextF label="INFRA STATUS" placeholder="Current infrastructure status" value={infraStatus} onChangeText={setInfraStatus} />
        </SectionCard>

        {/* ── GP BHAWAN DETAILS ──────────────────────────── */}
        <SectionCard title="GP BHAWAN DETAILS" color={colors.success} zBase={4000}>
          <WheelF label="GP BHAWAN AVAILABILITY" value={gpBhawanAvail} onChange={setGpBhawanAvail} items={ynaItems} />
          <TextF label="INFRA OF GP BHAWAN" placeholder="Infrastructure description" value={gpBhawanInfra} onChangeText={setGpBhawanInfra} />
          <WheelF label="ELECTRIC METER IN GP BHAWAN" value={gpBhawanMeter} onChange={setGpBhawanMeter} items={ynaItems} />
          <WheelF label="SOLAR AVAILABILITY IN GP BHAWAN" value={gpBhawanSolar} onChange={setGpBhawanSolar} items={ynaItems} />
          <WheelF label="EARTHING AVAILABILITY IN GP BHAWAN" value={gpBhawanEarthing} onChange={setGpBhawanEarthing} items={ynaItems} />
        </SectionCard>

        {/* ── GEOSPATIAL DATA ────────────────────────────── */}
        <SectionCard title="GEOSPATIAL DATA" color="#7B2FBE" zBase={3000}>
          <TextF label="GP AVAILABLE AS PER KML" placeholder="Location name / status" value={gpAvailAsKml} onChangeText={setGpAvailAsKml} />

          {/* GP Original Location */}
          <GpsField
            label="GP ORIGINAL LOCATION"
            value={gpOriginalLoc}
            onChangeText={setGpOriginalLoc}
            onFetchLocation={() => fetchLiveLocation('original')}
            isFetching={isFetchingLocation}
            isFetchingThis={isFetchingLocation && fetchingTarget === 'original'}
          />

          {/* GP Current Location */}
          <GpsField
            label="GP CURRENT LOCATION"
            value={gpCurrentLoc}
            onChangeText={setGpCurrentLoc}
            onFetchLocation={() => fetchLiveLocation('current')}
            isFetching={isFetchingLocation}
            isFetchingThis={isFetchingLocation && fetchingTarget === 'current'}
          />

          {/* GP Plot Location */}
          <GpsField
            label="GP PLOT LOCATION"
            value={gpPlLoc}
            onChangeText={setGpPlLoc}
            onFetchLocation={() => fetchLiveLocation('plot')}
            isFetching={isFetchingLocation}
            isFetchingThis={isFetchingLocation && fetchingTarget === 'plot'}
          />
        </SectionCard>

        {/* Step divider */}
        <View style={styles.stepRow}>
          <View style={styles.stepLine} />
          <Text style={styles.stepLabel}>STEP 2 OF 3: RESPONDENT</Text>
          <View style={styles.stepLine} />
        </View>

        {/* ── RESPONDENT DETAILS ─────────────────────────── */}
        <SectionCard title="" zBase={2000}>
          <TextF label="RESPONDENT NAME *" placeholder="Enter full name" value={respondentName} onChangeText={setRespondentName} />

          <WheelF label="AGE" value={age} onChange={setAge} items={ageItems} placeholder="Select Age..." />
          <WheelF label="GENDER" value={gender} onChange={setGender}
            items={[{ label: 'Male', value: 'Male' }, { label: 'Female', value: 'Female' }, { label: 'Other', value: 'Other' }]} />

          {/* Contact */}
          <PhoneField
            label="CONTACT NUMBER"
            placeholder="10-digit mobile number"
            value={contact}
            onChangeText={(v) => setContact(v.replace(/\D/g, '').slice(0, 10))}
          />
        </SectionCard>

        {/* Step divider */}
        <View style={styles.stepRow}>
          <View style={styles.stepLine} />
          <Text style={styles.stepLabel}>STEP 3 OF 3: DOCUMENTATION</Text>
          <View style={styles.stepLine} />
        </View>

        {/* ── DOCUMENTATION ─────────────────────────────── */}
        <SectionCard title="DOCUMENTATION" zBase={1000}>
          <TextF label="REMARKS IF ANY" placeholder="Enter any additional remarks..." value={remarks} onChangeText={setRemarks} multiline />

          {/* Photo Upload */}
          <View style={styles.formGroup}>
            <View style={styles.photoHeaderRow}>
              <FieldLabel text={`SITE PHOTOS${photos.length > 0 ? ` (${photos.length})` : ''}`} />
            </View>

            {/* Thumbnail grid */}
            {photos.length > 0 ? (
              <View style={styles.photoGrid}>
                {photos.map((p, idx) => (
                  <View key={idx} style={styles.photoThumb}>
                    <Image source={{ uri: p.uri }} style={styles.thumbImage} />
                    <TouchableOpacity
                      style={styles.thumbRemove}
                      onPress={() => setPhotos(prev => prev.filter((_, i) => i !== idx))}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Text style={styles.thumbRemoveText}>✕</Text>
                    </TouchableOpacity>
                    <Text style={styles.thumbLabel} numberOfLines={1}>{p.fileName}</Text>
                  </View>
                ))}
                
                {/* Inline Add Button inside the grid */}
                {photos.length < 10 && (
                  <TouchableOpacity style={styles.photoGridAdd} onPress={handlePhotoOption}>
                    <Text style={styles.photoGridAddIcon}>＋</Text>
                    <Text style={styles.photoGridAddText}>Add Photo</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <TouchableOpacity style={styles.uploadBox} onPress={handlePhotoOption}>
                <Text style={styles.uploadIcon}>📷</Text>
                <Text style={styles.uploadText}>ADD PHOTOS</Text>
                <Text style={styles.uploadHint}>Camera or Gallery • Multiple allowed</Text>
              </TouchableOpacity>
            )}
          </View>
        </SectionCard>

        {/* ── ACTION BUTTONS ──────────────────────────────── */}
        <TouchableOpacity
          style={[styles.actionBtn, styles.syncSaveBtn, isSaving && { opacity: 0.7 }]}
          onPress={() => handleSave(true)} disabled={isSaving} activeOpacity={0.85}
        >
          {isSaving ? <ActivityIndicator color={colors.white} /> : <Text style={styles.actionBtnText}>⟳  SAVE AND SYNC</Text>}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.offlineSaveBtn, isSaving && { opacity: 0.7 }]}
          onPress={() => handleSave(false)} disabled={isSaving} activeOpacity={0.85}
        >
          <Text style={[styles.actionBtnText, { color: colors.onSurface }]}>⊙  SAVE OFFLINE</Text>
        </TouchableOpacity>

        {/* ── LOCAL STORAGE CAPACITY ─────────────────────── */}
        <View style={[styles.storageBanner, storageFull && styles.storageBannerFull]}>
          <Text style={styles.storageIcon}>ℹ️</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.storageTitle}>LOCAL STORAGE CAPACITY</Text>
            <View style={styles.storageBar}>
              <View style={[styles.storageBarFill, { width: `${storagePercent}%`, backgroundColor: storageFull ? colors.error : colors.secondary }]} />
            </View>
            <Text style={styles.storageText}>
              {storageInfo.used} MB / {storageInfo.total} MB used
              {storageFull ? '  ⚠ Sync required to add more data.' : ''}
            </Text>
          </View>
        </View>

        <View style={{ height: spacing.xl }} />
      </ScrollView>

      {/* Bottom Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tab} onPress={() => navigation.goBack()}>
          <Text style={styles.tabIcon}>⊞</Text>
          <Text style={styles.tabLabel}>Dashboard</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, styles.tabActive]}>
          <Text style={styles.tabIcon}>📋</Text>
          <Text style={[styles.tabLabel, styles.tabLabelActive]}>Sync Status</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },

  headerBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingVertical: 12,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  signalIcon: { flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  bar: { width: 4, backgroundColor: colors.primary, borderRadius: 1 },
  appName: { fontSize: 18, fontWeight: '700', color: colors.primary, letterSpacing: -0.3 },
  cancelBtn: { padding: 8 },
  cancelText: { fontSize: 14, color: colors.muted, fontWeight: '600' },
  headerUnderline: { height: 2, backgroundColor: colors.primary },

  offlineBar: { backgroundColor: colors.inverseNavy, paddingVertical: 8, paddingHorizontal: spacing.md },
  offlineText: { fontSize: 11, color: '#fff', letterSpacing: 0.8, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },

  scrollContent: { flex: 1, paddingHorizontal: spacing.md, paddingTop: spacing.md },
  pageTitle: { ...typography.headlineMd, color: colors.onSurface, marginBottom: 4 },
  pageSubtitle: { ...typography.bodyMd, color: colors.muted, marginBottom: spacing.md },

  loadingBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.surfaceContainerLow, borderRadius: radius.md, padding: spacing.sm, marginBottom: spacing.sm,
  },
  loadingText: { fontSize: 13, color: colors.muted },

  sectionCard: {
    backgroundColor: colors.white, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.outlineVariant,
    borderLeftWidth: 4, padding: spacing.md, marginBottom: spacing.md,
  },
  sectionTag: {
    fontSize: 11, fontWeight: '700', letterSpacing: 1.5,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: spacing.sm,
  },

  formGroup: { marginBottom: spacing.md },
  fieldLabel: {
    fontSize: 12, fontWeight: '700', color: colors.onSurfaceVariant,
    letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 6,
  },
  input: {
    height: 52, backgroundColor: colors.white,
    borderWidth: 1, borderColor: colors.outlineVariant,
    borderRadius: radius.md, paddingHorizontal: spacing.md,
    fontSize: 16, color: colors.onSurface,
  },
  inputFocused: { borderWidth: 2, borderColor: colors.primary, backgroundColor: colors.surfaceContainerLow },

  // Phone
  phoneWrapper: {
    flexDirection: 'row', alignItems: 'center', height: 52,
    borderWidth: 1, borderColor: colors.outlineVariant, borderRadius: radius.md,
    backgroundColor: colors.white, overflow: 'hidden',
  },
  phonePrefix: { paddingHorizontal: 14, height: '100%', justifyContent: 'center', backgroundColor: colors.surfaceContainerLow },
  phonePrefixText: { fontSize: 16, fontWeight: '700', color: colors.primary },
  phoneDivider: { width: 1, height: '60%', backgroundColor: colors.outlineVariant },
  phoneInput: { flex: 1, fontSize: 16, color: colors.onSurface, paddingHorizontal: 14 },
  phoneCount: { fontSize: 12, color: colors.muted, paddingRight: 12 },

  // GPS
  gpsRow: { flexDirection: 'row', gap: 8 },
  gpsBtn: {
    width: 52, height: 52, backgroundColor: colors.primary,
    borderRadius: radius.md, justifyContent: 'center', alignItems: 'center',
  },
  gpsBtnText: { fontSize: 22 },
  coordsBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.successBg, borderRadius: radius.md,
    padding: spacing.sm, marginBottom: spacing.sm,
    borderWidth: 1, borderColor: colors.success,
  },
  coordsLabel: { fontSize: 10, fontWeight: '700', color: colors.success, letterSpacing: 1 },
  coordsValue: { fontSize: 13, color: colors.success, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },

  // Photo
  uploadBox: {
    borderWidth: 1.5, borderColor: colors.primary, borderStyle: 'dashed',
    borderRadius: radius.lg, padding: spacing.lg,
    alignItems: 'center', gap: 6, backgroundColor: colors.surfaceContainerLow,
  },
  uploadIcon: { fontSize: 32 },
  uploadText: { fontSize: 14, fontWeight: '700', color: colors.primary, letterSpacing: 1 },
  uploadHint: { fontSize: 12, color: colors.muted },
  photoPreview: { borderRadius: radius.md, overflow: 'hidden', borderWidth: 1, borderColor: colors.outlineVariant },
  photoImage: { width: '100%', height: 180 },
  photoMeta: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: spacing.sm, backgroundColor: colors.inverseNavy,
  },
  photoName: { flex: 1, fontSize: 12, color: '#fff', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  removeBtn: { padding: 4 },
  removeText: { fontSize: 12, color: '#fff', letterSpacing: 0.5 },
  addPhotoBtn: {
    marginTop: 8, borderWidth: 1, borderColor: colors.outlineVariant,
    borderRadius: radius.md, padding: 10, alignItems: 'center',
  },
  addPhotoBtnText: { fontSize: 14, color: colors.primary, fontWeight: '600' },

  photoHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 6,
  },
  photoThumb: {
    width: 95,
    height: 115,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    overflow: 'hidden',
    position: 'relative',
  },
  thumbImage: {
    width: '100%',
    height: 90,
    backgroundColor: colors.surfaceContainerHigh,
  },
  thumbRemove: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  thumbRemoveText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  thumbLabel: {
    fontSize: 10,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    paddingHorizontal: 4,
    paddingVertical: 2,
    fontWeight: '500',
  },
  photoGridAdd: {
    width: 95,
    height: 90,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    backgroundColor: colors.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  photoGridAddIcon: {
    fontSize: 20,
    color: colors.primary,
    fontWeight: 'bold',
  },
  photoGridAddText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '600',
  },

  // Step divider
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.md, marginTop: 4 },
  stepLine: { flex: 1, height: 1, backgroundColor: colors.outlineVariant },
  stepLabel: { fontSize: 10, color: colors.muted, letterSpacing: 0.8, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },

  // Action Buttons
  actionBtn: {
    height: 56, borderRadius: radius.md,
    justifyContent: 'center', alignItems: 'center', marginBottom: spacing.sm,
  },
  syncSaveBtn: { backgroundColor: colors.primary },
  offlineSaveBtn: {
    backgroundColor: colors.white, borderWidth: 2, borderColor: colors.primary,
  },
  actionBtnText: { color: colors.white, fontSize: 15, fontWeight: '700', letterSpacing: 1 },

  // Storage
  storageBanner: {
    flexDirection: 'row', gap: 10, alignItems: 'flex-start',
    backgroundColor: colors.surfaceContainerLow, borderRadius: radius.lg,
    padding: spacing.md, marginBottom: spacing.md,
    borderWidth: 1, borderColor: colors.outlineVariant,
  },
  storageBannerFull: { borderColor: colors.error, backgroundColor: colors.errorBg },
  storageIcon: { fontSize: 16, marginTop: 2 },
  storageTitle: { fontSize: 11, fontWeight: '700', color: colors.muted, letterSpacing: 1, marginBottom: 6 },
  storageBar: { height: 6, backgroundColor: colors.outlineVariant, borderRadius: 3, marginBottom: 6, overflow: 'hidden' },
  storageBarFill: { height: '100%', borderRadius: 3 },
  storageText: { fontSize: 12, color: colors.onSurfaceVariant },

  // Tab Bar
  tabBar: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.outlineVariant, backgroundColor: colors.white },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10, gap: 2 },
  tabActive: { borderTopWidth: 3, borderTopColor: colors.primary },
  tabIcon: { fontSize: 20 },
  tabLabel: { fontSize: 12, color: colors.muted, fontWeight: '500' },
  tabLabelActive: { color: colors.primary, fontWeight: '700' },
});

export default SurveyFormScreen;
