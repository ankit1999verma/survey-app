import React, { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  ScrollView, Alert, StatusBar, Platform, ActivityIndicator, Modal,
  LayoutAnimation, UIManager, Image, KeyboardAvoidingView, AppState
} from 'react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import WheelPickerField from '../components/WheelPickerField';
import api from '../utils/api';
import { saveSurveyOffline, syncMasterData } from '../utils/syncManager';
import { getStates, getDistricts, getBlocks, getGramPanchayats } from '../utils/localDB';
import { colors, spacing, radius, typography, shadows } from '../theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ── Item helpers ──────────────────────────────────────────────────────────────
const opts = arr => arr.map(v => ({ label: v, value: v }));

const YN_ITEMS   = opts(['YES', 'NO']);
const INFRA_ITEMS = opts(['GOOD', 'NOT GOOD', 'BAD', 'NOT SAFE']);
const PT_ITEMS   = opts(['PERMANENT', 'TEMPORARY']);
const LOC_TYPE_ITEMS = opts([
  'GRAM SACHIVALAY', 'PANCHAYAT BHAWAN', 'CHAUPAL', 'ANGANWADI',
  'SCHOOL', 'LIBRARY', 'DHARMSHALA', 'CSC CENTER', 'MAHILA CHAUPAL', 'OTHERS',
]);
const CURR_LOC_ITEMS = opts(['SAME AS ORIGINAL LOCATION', 'NOT FOUND', 'OTHER (specify below)']);
const HOURS_ITEMS = opts(Array.from({length: 25}, (_, i) => String(i)));

// ── Shared components ─────────────────────────────────────────────────────────
const SectionCard = ({ title, children, color }) => (
  <View style={[styles.sectionCard, { borderTopColor: color }]}>
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color }]}>{title}</Text>
    </View>
    <View style={styles.sectionContent}>
      {children}
    </View>
  </View>
);

const FieldLabel = ({ text }) => <Text style={styles.fieldLabel}>{text}</Text>;

const TextF = React.forwardRef(({ label, placeholder, value, onChangeText, keyboardType, multiline, returnKeyType, onSubmitEditing }, ref) => {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.formGroup}>
      <FieldLabel text={label} />
      <TextInput
        ref={ref}
        style={[
          styles.input,
          multiline && { height: 80, textAlignVertical: 'top', paddingTop: 14 },
          focused && styles.inputFocused,
        ]}
        placeholder={placeholder || `Enter ${label.toLowerCase()}`}
        value={value ?? ''}
        onChangeText={onChangeText}
        keyboardType={keyboardType || 'default'}
        placeholderTextColor={colors.placeholder}
        multiline={multiline}
        returnKeyType={returnKeyType || 'default'}
        onSubmitEditing={onSubmitEditing}
        blurOnSubmit={returnKeyType === 'next' ? false : undefined}
        onFocus={() => {
          setFocused(true);
        }}
        onBlur={() => {
          setFocused(false);
        }}
      />
    </View>
  );
});

const WheelF = React.forwardRef(({ label, value, onChange, items, disabled, placeholder }, ref) => (
  <View style={styles.formGroup}>
    <WheelPickerField
      ref={ref}
      label={label} value={value} onChange={onChange}
      items={items} disabled={disabled}
      placeholder={placeholder || 'Select...'}
    />
  </View>
));

const GpsField = React.forwardRef(({ label, lat, long, onChangeLat, onChangeLong, onCapture, capturing, returnKeyType, onSubmitEditing }, ref) => {
  const [focusedLat, setFocusedLat] = useState(false);
  const [focusedLng, setFocusedLng] = useState(false);
  const longRef = React.useRef(null);
  
  React.useImperativeHandle(ref, () => ({
    focus: () => {
      // Focus latitude by default when this component is focused
    }
  }));

  return (
    <View style={styles.formGroup}>
      <FieldLabel text={label} />
      <View style={styles.gpsRow}>
        <TextInput
          style={[styles.input, { flex: 1 }, focusedLat && styles.inputFocused]}
          placeholder="Latitude"
          value={lat ?? ''}
          onChangeText={onChangeLat}
          keyboardType="decimal-pad"
          placeholderTextColor={colors.placeholder}
          returnKeyType="next"
          onSubmitEditing={() => { longRef.current?.focus(); }}
          blurOnSubmit={false}
          onFocus={() => setFocusedLat(true)}
          onBlur={() => setFocusedLat(false)}
        />
        <TextInput
          ref={longRef}
          style={[styles.input, { flex: 1, marginLeft: 8 }, focusedLng && styles.inputFocused]}
          placeholder="Longitude"
          value={long ?? ''}
          onChangeText={onChangeLong}
          keyboardType="decimal-pad"
          placeholderTextColor={colors.placeholder}
          returnKeyType={returnKeyType || 'default'}
          onSubmitEditing={onSubmitEditing}
          blurOnSubmit={returnKeyType === 'next' ? false : undefined}
          onFocus={() => setFocusedLng(true)}
          onBlur={() => setFocusedLng(false)}
        />
        <TouchableOpacity style={styles.gpsBtn} onPress={onCapture} disabled={capturing}>
          {capturing
            ? <ActivityIndicator size="small" color={colors.primary} />
            : <Feather name="map-pin" size={20} color={colors.primary} />
          }
        </TouchableOpacity>
      </View>
    </View>
  );
});

const PhoneField = React.forwardRef(({ label, value, onChangeText, returnKeyType, onSubmitEditing }, ref) => {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.formGroup}>
      <FieldLabel text={label} />
      <View style={[styles.phoneWrapper, focused && styles.inputFocused]}>
        <View style={styles.phonePrefix}><Text style={styles.phonePrefixText}>+91</Text></View>
        <View style={styles.phoneDivider} />
        <TextInput
          ref={ref}
          style={styles.phoneInput}
          placeholder="10-digit number"
          value={value ?? ''}
          onChangeText={v => onChangeText(v.replace(/\D/g, '').slice(0, 10))}
          keyboardType="number-pad"
          maxLength={10}
          placeholderTextColor={colors.placeholder}
          returnKeyType={returnKeyType || 'default'}
          onSubmitEditing={onSubmitEditing}
          blurOnSubmit={returnKeyType === 'next' ? false : undefined}
          onFocus={() => {
            setFocused(true);
          }}
          onBlur={() => {
            setFocused(false);
          }}
        />
      </View>
    </View>
  );
});

// ── Initial state ─────────────────────────────────────────────────────────────
const INIT = {
  stateId: null, stateName: '', districtId: null, districtName: '',
  blockId: null, blockName: '', gramPanchayatId: null, gramPanchayatName: '',
  gramPanchayatCode: '', phase: '', surveyVendor: '', remarks: '',
  origLocationType: '', origInfraStatus: '', origElectricity: '',
  origPowerHours: '', origSolar: '', origEarthing: '', origLat: '', origLong: '',
  currentLocation: '', currentLocationOther: '', currentPermTemp: '',
  currentLat: '', currentLong: '',
  gpBhawanAvailable: '', gpBhawanInfraStatus: '', gpBhawanEnergyMeter: '',
  gpBhawanEarthing: '', gpBhawanSolar: '', gpBhawanLat: '', gpBhawanLong: '',
  proposedBuilding: '', proposedRackSpace: '', proposedLat: '', proposedLong: '',
  proposedEnergyMeter: '', proposedEarthing: '', proposedSolar: '',
  proposedPoleLength: '', proposedPoleLat: '', proposedPoleLong: '', proposedRemarks: '',
  sarpanchName: '', sarpanchContact: '',
};

// ── Screen ────────────────────────────────────────────────────────────────────
export default function SurveyFormScreen({ route, navigation }) {
  const { userInfo } = useContext(AuthContext);
  const { showAlert: alert } = useAlert();
  const existingSurvey = route?.params?.survey;
  
  let initialPhotos = [];
  if (existingSurvey?.photoBase64) {
    try {
      const parsed = JSON.parse(existingSurvey.photoBase64);
      initialPhotos = Array.isArray(parsed) ? parsed : [existingSurvey.photoBase64];
    } catch(e) {
      initialPhotos = [existingSurvey.photoBase64];
    }
  }

  const [form, setForm] = useState(existingSurvey ? { ...INIT, ...existingSurvey, photos: initialPhotos } : { ...INIT, photos: [] });
  const [masterData, setMD] = useState(null);
  const [saving, setSaving] = useState(false);
  const [gpsLoading, setGpsLoading] = useState({});
  const [addModal, setAddModal] = useState(null);
  const [addName, setAddName] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const insets = useSafeAreaInsets();
  const sarpanchContactRef = React.useRef(null);
  const remarksRef = React.useRef(null);
  const districtRef = React.useRef(null);
  const blockRef = React.useRef(null);
  const gpRef = React.useRef(null);
  const vendorRef = React.useRef(null);

  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [gps, setGps] = useState([]);

  useEffect(() => {
    if (form.stateId) getDistricts(form.stateId).then(setDistricts);
    else setDistricts([]);
  }, [form.stateId]);

  useEffect(() => {
    if (form.districtId) getBlocks(form.districtId).then(setBlocks);
    else setBlocks([]);
  }, [form.districtId]);

  useEffect(() => {
    if (form.blockId) getGramPanchayats(form.blockId).then(setGps);
    else setGps([]);
  }, [form.blockId]);

  useEffect(() => {
    (async () => {
      let st = [];
      try {
        st = await getStates();
        setStates(st);
      } catch (e) {
        console.log('Failed to load local master data', e);
      }

      if (!existingSurvey) {
        let draftParsed = null;
        try {
          const draft = await AsyncStorage.getItem('unsaved_survey_draft');
          if (draft) {
            draftParsed = JSON.parse(draft);
            if (draftParsed) {
              if (draftParsed.uuid) {
                // If it has a UUID, it's a corrupted draft from an old edited survey! Delete it.
                AsyncStorage.removeItem('unsaved_survey_draft').catch(()=>{});
                draftParsed = null;
              } else {
                setForm(draftParsed);
              }
            }
          }
        } catch(e) {}

        // Auto-detect State and District from GPS if not already selected
        if (st?.length > 0 && !draftParsed?.stateId) {
          try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
              const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
              const geocode = await Location.reverseGeocodeAsync({
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude
              });
              if (geocode && geocode.length > 0) {
                const { region, subregion, city } = geocode[0];
                if (region) {
                  const s = st.find(x => x.name.toLowerCase() === region.toLowerCase());
                  if (s) {
                    const dists = await getDistricts(s.id);
                    const distStr = subregion || city;
                    let d = null;
                    if (distStr) {
                      d = dists.find(x => x.name.toLowerCase() === distStr.toLowerCase());
                    }
                    setForm(f => {
                      if (f.stateId) return f; // User manually selected in the meantime
                      return {
                        ...f, 
                        stateId: s.id, stateName: s.name,
                        districtId: d?.id ?? null, districtName: d?.name ?? ''
                      };
                    });
                  }
                }
              }
            }
          } catch (e) {
            console.log('Auto GPS detection failed', e);
          }
        }
      } else {
        // We are editing an existing survey. Delete any stale drafts to prevent corruption.
        AsyncStorage.removeItem('unsaved_survey_draft').catch(()=>{});
      }
    })();
  }, [existingSurvey]);

  // Keep a ref to the latest form state for the AppState listener
  const formRef = React.useRef(form);
  useEffect(() => {
    formRef.current = form;
  }, [form]);

  // Listen to app state changes and save draft when backgrounded
  useEffect(() => {
    const sub = AppState.addEventListener('change', next => {
      if (next === 'background' || next === 'inactive') {
        if (!existingSurvey) {
          AsyncStorage.setItem('unsaved_survey_draft', JSON.stringify(formRef.current)).catch(() => {});
        }
      }
    });
    return () => sub.remove();
  }, [existingSurvey]);

  const set = useCallback((k, v) => setForm(f => ({ ...f, [k]: v })), []);

  const captureGps = async (latKey, longKey) => {
    setGpsLoading(p => ({ ...p, [latKey]: true }));
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { alert('Error', 'Permission denied'); return; }
      
      // Use Highest accuracy for real-time accurate fixes when the button is explicitly clicked
      const loc = await Location.getCurrentPositionAsync({ 
        accuracy: Location.Accuracy.Highest 
      });
      
      set(latKey, String(loc.coords.latitude));
      set(longKey, String(loc.coords.longitude));
    } catch (e) {
      alert('GPS Error', e.message);
    } finally {
      setGpsLoading(p => ({ ...p, [latKey]: false }));
    }
  };

  const takeWithCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission Denied', 'Camera permission is required.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.6,
        base64: true,
      });

      if (!result.canceled && result.assets?.length > 0) {
        set('photos', [...(form.photos || []), result.assets[0].base64]);
      }
    } catch (e) {
      alert('Camera Error', e.message);
    }
  };

  const pickFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission Denied', 'Gallery permission is required.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.6,
        base64: true,
      });

      if (!result.canceled && result.assets?.length > 0) {
        const newPhotos = result.assets.map(a => a.base64);
        set('photos', [...(form.photos || []), ...newPhotos]);
      }
    } catch (e) {
      alert('Gallery Error', e.message);
    }
  };

  const removePhoto = (index) => {
    const updated = [...form.photos];
    updated.splice(index, 1);
    set('photos', updated);
  };

  const capturePhoto = () => {
    if (Platform.OS === 'web') {
      pickFromGallery();
      return;
    }
    Alert.alert('Add Photo', 'Choose photo source', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Gallery', onPress: pickFromGallery },
      { text: 'Camera', onPress: takeWithCamera },
    ]);
  };

  const handleSubmit = async (isDraft = false) => {
    if (!isDraft) {
      if (!form.gramPanchayatId) {
        alert('Required', 'Please select Gram Panchayat');
        return;
      }
    }
    setSaving(true);
    try {
      const finalData = { ...form };
      if (finalData.photos && finalData.photos.length > 0) {
        finalData.photoBase64 = JSON.stringify(finalData.photos);
      } else {
        finalData.photoBase64 = null;
      }
      delete finalData.photos;
      
      finalData.surveyDone = isDraft ? 'DRAFT' : 'YES';
      finalData.surveyDate = new Date().toISOString().split('T')[0];
      ['origLat','origLong','currentLat','currentLong','gpBhawanLat','gpBhawanLong',
       'proposedLat','proposedLong','proposedPoleLat','proposedPoleLong'].forEach(k => {
        finalData[k] = finalData[k] ? parseFloat(finalData[k]) : null;
      });

      await saveSurveyOffline(finalData, userInfo?.id);
      
      // Clear the unsaved draft since we successfully saved
      await AsyncStorage.removeItem('unsaved_survey_draft').catch(() => {});
      
      alert(isDraft ? 'Draft Saved' : 'Saved', isDraft ? 'Draft saved locally.' : 'Survey saved locally. Sync when online.');
      setTimeout(() => navigation.goBack(), 500);
      
    } catch (e) {
      alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  const isOtherCurrent = form.currentLocation === 'OTHER (specify below)';
  const showCurrentDetails = form.currentLocation && form.currentLocation !== 'NOT FOUND';

  const handleAddSubmit = async () => {
    if (!addName.trim()) return;
    setAddLoading(true);
    try {
      let res;
      if (addModal === 'state') res = await api.post('/master/states', { name: addName });
      else if (addModal === 'district') res = await api.post('/master/districts', { name: addName, stateId: form.stateId });
      else if (addModal === 'block') res = await api.post('/master/blocks', { name: addName, districtId: form.districtId });
      else if (addModal === 'gp') res = await api.post('/master/grampanchayats', { name: addName, blockId: form.blockId });

      const fresh = await syncMasterData();
      if (fresh) setMD(fresh);

      const newItem = res.data;
      if (addModal === 'state') {
        setForm(f => ({ ...f, stateName: newItem.name, stateId: newItem.id, districtName: '', districtId: null, blockName: '', blockId: null, gramPanchayatName: '', gramPanchayatId: null }));
      } else if (addModal === 'district') {
        setForm(f => ({ ...f, districtName: newItem.name, districtId: newItem.id, blockName: '', blockId: null, gramPanchayatName: '', gramPanchayatId: null }));
      } else if (addModal === 'block') {
        setForm(f => ({ ...f, blockName: newItem.name, blockId: newItem.id, gramPanchayatName: '', gramPanchayatId: null }));
      } else if (addModal === 'gp') {
        setForm(f => ({ ...f, gramPanchayatName: newItem.name, gramPanchayatId: newItem.id }));
      }
      setAddModal(null);
      setAddName('');
    } catch (e) {
      alert('Error', 'Failed to add. Are you online?');
    } finally {
      setAddLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} translucent />

      {/* Header */}
      <View style={[styles.header, { paddingTop: (insets.top || 14) + 14, paddingBottom: 14 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="chevron-left" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>GramSync Pro</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView 
          style={styles.scroll} 
          contentContainerStyle={{ paddingBottom: 100 }}
          keyboardShouldPersistTaps="handled" 
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
        >
        <View style={styles.body}>

          {/* ── 0: GP IDENTIFICATION ── */}
          <SectionCard title="SECTION 0 · GP IDENTIFICATION" color={colors.primary}>
            <WheelF
              label="STATE / UT"
              value={form.stateId}
              items={[...states.map(s => ({ label: s.name, value: s.id })), { label: '+ Add New State...', value: '__ADD__' }]}
              placeholder="Select state..."
              onChange={id => {
                if (id === '__ADD__') { setAddModal('state'); return; }
                const s = states.find(x => x.id === id);
                
                setForm(f => ({
                  ...f, stateName: s?.name ?? '', stateId: s?.id ?? null,
                  districtName: '', districtId: null,
                  blockName: '', blockId: null,
                  gramPanchayatName: '', gramPanchayatId: null, gramPanchayatCode: '',
                }));
              }}
            />
            <WheelF
              ref={districtRef}
              label="DISTRICT"
              value={form.districtId}
              items={[...districts.map(d => ({ label: d.name, value: d.id })), form.stateId ? { label: '+ Add New District...', value: '__ADD__' } : null].filter(Boolean)}
              placeholder={form.stateId ? 'Select district...' : '— Select state first —'}
              disabled={!form.stateId}
              onChange={id => {
                if (id === '__ADD__') { setAddModal('district'); return; }
                const d = districts.find(x => x.id === id);
                
                setForm(f => ({
                  ...f, districtName: d?.name ?? '', districtId: d?.id ?? null,
                  blockName: '', blockId: null,
                  gramPanchayatName: '', gramPanchayatId: null, gramPanchayatCode: '',
                }));
              }}
            />
            <WheelF
              ref={blockRef}
              label="BLOCK"
              value={form.blockId}
              items={[...blocks.map(b => ({ label: b.name, value: b.id })), form.districtId ? { label: '+ Add New Block...', value: '__ADD__' } : null].filter(Boolean)}
              placeholder={form.districtId ? 'Select block...' : '— Select district first —'}
              disabled={!form.districtId}
              onChange={id => {
                if (id === '__ADD__') { setAddModal('block'); return; }
                const b = blocks.find(x => x.id === id);
                
                setForm(f => ({
                  ...f, blockName: b?.name ?? '', blockId: b?.id ?? null,
                  gramPanchayatName: '', gramPanchayatId: null, gramPanchayatCode: '',
                }));
              }}
            />
            <WheelF
              ref={gpRef}
              label="GRAM PANCHAYAT"
              value={form.gramPanchayatId}
              items={[...gps.map(g => ({ label: g.name, value: g.id })), form.blockId ? { label: '+ Add New GP...', value: '__ADD__' } : null].filter(Boolean)}
              placeholder={form.blockId ? 'Select GP...' : '— Select block first —'}
              disabled={!form.blockId}
              onChange={id => {
                if (id === '__ADD__') { setAddModal('gp'); return; }
                const g = gps.find(x => x.id === id);
                
                setForm(f => ({
                  ...f, gramPanchayatName: g?.name ?? '',
                  gramPanchayatId: g?.id ?? null, gramPanchayatCode: g?.code ?? '',
                }));
              }}
            />
            {!!form.gramPanchayatCode && (
              <View style={styles.gpCodeRow}>
                <Text style={styles.gpCodeLabel}>GP CODE</Text>
                <Text style={styles.gpCodeValue}>{form.gramPanchayatCode}</Text>
              </View>
            )}
            <TextF 
              ref={vendorRef}
              label="SURVEY VENDOR NAME" 
              value={form.surveyVendor} 
              onChangeText={v => set('surveyVendor', v)} 
              placeholder="Company name" 
              returnKeyType="next"
              onSubmitEditing={() => remarksRef.current?.focus()}
            />
            <TextF 
              ref={remarksRef}
              label="REMARKS" 
              value={form.remarks} 
              onChangeText={v => set('remarks', v)} 
              placeholder="Any notes..." 
              multiline 
            />
          </SectionCard>

          {/* ── A: ORIGINAL LOCATION ── */}
          <SectionCard title="SECTION A · ORIGINAL LOCATION" color="#0891b2">
            <Text style={styles.hint}>Per BSNL discussion order / KMZ file</Text>
            <WheelF label="LOCATION TYPE" value={form.origLocationType} onChange={v => set('origLocationType', v)} items={LOC_TYPE_ITEMS} />
            <WheelF label="INFRA STATUS" value={form.origInfraStatus} onChange={v => set('origInfraStatus', v)} items={INFRA_ITEMS} />
            <WheelF label="ELECTRICITY AVAILABLE" value={form.origElectricity} onChange={v => set('origElectricity', v)} items={YN_ITEMS} />
            <WheelF label="POWER SUPPLY HOURS / DAY" value={form.origPowerHours} onChange={v => set('origPowerHours', v)} items={HOURS_ITEMS} />
            <WheelF label="SOLAR AVAILABLE" value={form.origSolar} onChange={v => set('origSolar', v)} items={YN_ITEMS} />
            <WheelF label="EARTHING AVAILABLE" value={form.origEarthing} onChange={v => set('origEarthing', v)} items={YN_ITEMS} />
            <GpsField
              label="LAT / LONG"
              lat={form.origLat} long={form.origLong}
              onChangeLat={v => set('origLat', v)} onChangeLong={v => set('origLong', v)}
              onCapture={() => captureGps('origLat', 'origLong')}
              capturing={!!gpsLoading.origLat}
            />
          </SectionCard>

          {/* ── B: CURRENT LOCATION ── */}
          <SectionCard title="SECTION B · CURRENT LOCATION" color="#7c3aed">
            <Text style={styles.hint}>Where equipment is actually found on ground</Text>
            <WheelF
              label="CURRENT LOCATION STATUS"
              value={form.currentLocation}
              onChange={v => {
                setForm(f => ({ ...f, currentLocation: v, currentLocationOther: '' }));
              }}
              items={CURR_LOC_ITEMS}
            />
            {isOtherCurrent && (
              <TextF label="SPECIFY LOCATION" value={form.currentLocationOther} onChangeText={v => set('currentLocationOther', v)} placeholder="e.g. ANGANWADI, SCHOOL..." />
            )}
            {showCurrentDetails && (
              <>
                <WheelF label="PERMANENT OR TEMPORARY" value={form.currentPermTemp} onChange={v => set('currentPermTemp', v)} items={PT_ITEMS} />
                <GpsField
                  label="CURRENT LOCATION LAT / LONG"
                  lat={form.currentLat} long={form.currentLong}
                  onChangeLat={v => set('currentLat', v)} onChangeLong={v => set('currentLong', v)}
                  onCapture={() => captureGps('currentLat', 'currentLong')}
                  capturing={!!gpsLoading.currentLat}
                />
              </>
            )}
          </SectionCard>

          {/* ── C: GP BHAWAN ── */}
          <SectionCard title="SECTION C · GP BHAWAN" color="#d97706">
            <Text style={styles.hint}>Fill only if Equipment is not installed in GP</Text>
            <TextF
              label="GP BHAWAN AVAILABLE?"
              value={form.gpBhawanAvailable}
              onChangeText={v => set('gpBhawanAvailable', v)}
              placeholder="YES / NO / YES BUT USED AS ANGAWADI..."
            />
            <WheelF label="INFRA STATUS" value={form.gpBhawanInfraStatus} onChange={v => set('gpBhawanInfraStatus', v)} items={INFRA_ITEMS} />
            <WheelF label="ENERGY METER INSTALLED" value={form.gpBhawanEnergyMeter} onChange={v => set('gpBhawanEnergyMeter', v)} items={YN_ITEMS} />
            <WheelF label="EARTHING AVAILABLE" value={form.gpBhawanEarthing} onChange={v => set('gpBhawanEarthing', v)} items={YN_ITEMS} />
            <WheelF label="SOLAR AVAILABLE" value={form.gpBhawanSolar} onChange={v => set('gpBhawanSolar', v)} items={YN_ITEMS} />
            <GpsField
              label="GP BHAWAN LAT / LONG"
              lat={form.gpBhawanLat} long={form.gpBhawanLong}
              onChangeLat={v => set('gpBhawanLat', v)} onChangeLong={v => set('gpBhawanLong', v)}
              onCapture={() => captureGps('gpBhawanLat', 'gpBhawanLong')}
              capturing={!!gpsLoading.gpBhawanLat}
            />
          </SectionCard>

          {/* ── D: PROPOSED LOCATION ── */}
          <SectionCard title="SECTION D · PROPOSED LOCATION" color="#059669">
            <Text style={styles.hint}>Fill if Original Location is not applicable for equipment installation</Text>
            <TextF label="BUILDING NAME" value={form.proposedBuilding} onChangeText={v => set('proposedBuilding', v)} placeholder="e.g. GRAM SACHIVALAY, PANCHAYAT BHAWAN..." />
            <WheelF label="RACK SPACE AVAILABLE" value={form.proposedRackSpace} onChange={v => set('proposedRackSpace', v)} items={YN_ITEMS} />
            <GpsField
              label="PROPOSED LOCATION LAT / LONG"
              lat={form.proposedLat} long={form.proposedLong}
              onChangeLat={v => set('proposedLat', v)} onChangeLong={v => set('proposedLong', v)}
              onCapture={() => captureGps('proposedLat', 'proposedLong')}
              capturing={!!gpsLoading.proposedLat}
            />
            <WheelF label="ENERGY METER INSTALLED" value={form.proposedEnergyMeter} onChange={v => set('proposedEnergyMeter', v)} items={YN_ITEMS} />
            <WheelF label="EARTHING AVAILABLE" value={form.proposedEarthing} onChange={v => set('proposedEarthing', v)} items={YN_ITEMS} />
            <WheelF label="SOLAR AVAILABLE" value={form.proposedSolar} onChange={v => set('proposedSolar', v)} items={YN_ITEMS} />
            <TextF label="POLE LENGTH (ft)" value={form.proposedPoleLength} onChangeText={v => set('proposedPoleLength', v)} keyboardType="numeric" />
            <GpsField
              label="POLE LAT / LONG"
              lat={form.proposedPoleLat} long={form.proposedPoleLong}
              onChangeLat={v => set('proposedPoleLat', v)} onChangeLong={v => set('proposedPoleLong', v)}
              onCapture={() => captureGps('proposedPoleLat', 'proposedPoleLong')}
              capturing={!!gpsLoading.proposedPoleLat}
            />
            <TextF label="REMARKS" value={form.proposedRemarks} onChangeText={v => set('proposedRemarks', v)} placeholder="Any notes..." multiline />
          </SectionCard>

          {/* ── E: SARPANCH ── */}
          <SectionCard title="SECTION E · SARPANCH DETAILS" color="#dc2626">
            <TextF 
              label="SARPANCH NAME" 
              value={form.sarpanchName} 
              onChangeText={v => set('sarpanchName', v)} 
              placeholder="Full name" 
              returnKeyType="next"
              onSubmitEditing={() => sarpanchContactRef.current?.focus()}
            />
            <PhoneField 
              ref={sarpanchContactRef}
              label="CONTACT NUMBER" 
              value={form.sarpanchContact} 
              onChangeText={v => set('sarpanchContact', v)} 
            />
          </SectionCard>

          {/* ── F: SITE PHOTO ── */}
          <SectionCard title="SECTION F · SITE PHOTOS" color="#2563eb">
            <Text style={styles.hint}>Capture clear photos of the site/equipment</Text>
            
            {form.photos && form.photos.length > 0 ? (
              <View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoScroll}>
                  {form.photos.map((p, idx) => (
                    <View key={idx} style={styles.photoWrapper}>
                      <Image 
                        source={{ uri: p.startsWith('http') ? p : `data:image/jpeg;base64,${p}` }} 
                        style={styles.capturedPhotoThumb} 
                        resizeMode="cover" 
                      />
                      <TouchableOpacity style={styles.removePhotoBtn} onPress={() => removePhoto(idx)}>
                        <Feather name="x" size={16} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  ))}
                  <TouchableOpacity style={styles.addMorePhotoBtn} onPress={capturePhoto}>
                    <Feather name="plus" size={24} color={colors.primary} />
                  </TouchableOpacity>
                </ScrollView>
              </View>
            ) : (
              <TouchableOpacity style={styles.captureBtn} onPress={capturePhoto} activeOpacity={0.8}>
                <Feather name="camera" size={32} color={colors.primary} />
                <Text style={styles.captureBtnText}>Tap to Add Photos</Text>
              </TouchableOpacity>
            )}
          </SectionCard>

        </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Fixed Bottom Action Bar */}
      <View style={styles.actionBar}>
        <TouchableOpacity
          style={[styles.submitBtn, saving && { opacity: 0.7 }]}
          onPress={() => handleSubmit(false)}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving
            ? <ActivityIndicator color="#fff" />
            : <><Feather name="check-circle" size={18} color="#fff" /><Text style={styles.submitText}>SUBMIT</Text></>
          }
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.draftBtn, saving && { opacity: 0.7 }]}
          onPress={() => handleSubmit(true)}
          disabled={saving}
          activeOpacity={0.8}
        >
          <Feather name="save" size={18} color={colors.primaryDark} />
          <Text style={styles.draftText}>DRAFT</Text>
        </TouchableOpacity>
      </View>

      {/* Add Master Data Modal */}
      <Modal visible={!!addModal} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add New {addModal === 'gp' ? 'Gram Panchayat' : addModal}</Text>
            <TextInput
              style={[styles.input, { marginBottom: spacing.xl }]}
              placeholder="Enter name"
              value={addName}
              onChangeText={setAddName}
              autoFocus
            />
            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.modalBtnCancel} onPress={() => { setAddModal(null); setAddName(''); }}>
                <Text style={styles.modalBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnSave} onPress={handleAddSubmit} disabled={addLoading}>
                {addLoading ? <ActivityIndicator color="#fff" /> : <Text style={[styles.modalBtnText, { color: '#fff' }]}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfaceContainerLow },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md, paddingVertical: 14,
  },
  backBtn: { width: 40, alignItems: 'flex-start' },
  headerTitle: { ...typography.headlineSm, color: '#fff', letterSpacing: 0.3 },

  scroll: { flex: 1 },
  body: { paddingHorizontal: spacing.md, paddingTop: spacing.md },
  
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    borderTopWidth: 4,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  sectionHeader: {
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceContainerLow,
  },
  sectionTitle: { ...typography.labelMd, letterSpacing: 1 },
  sectionContent: { gap: spacing.sm },

  hint: {
    ...typography.labelSm, color: colors.placeholder, 
    marginBottom: 12, marginTop: -6, fontStyle: 'italic',
  },

  formGroup: { marginBottom: spacing.md },
  fieldLabel: {
    ...typography.labelSm, color: colors.onSurfaceVariant,
    textTransform: 'uppercase', marginBottom: 8,
  },

  input: {
    borderWidth: 1, borderColor: colors.outlineVariant,
    borderRadius: radius.lg, paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 16 : 14,
    ...typography.bodyMd, color: colors.onSurface,
    backgroundColor: colors.white,
  },
  inputFocused: { 
    borderColor: colors.primary, 
    borderWidth: 2,
    paddingHorizontal: 15, // compensate for thicker border
    backgroundColor: '#f8fafc', 
  },

  // GPS
  gpsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  gpsBtn: {
    width: 56, height: 56, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.outlineVariant,
    backgroundColor: colors.white, justifyContent: 'center', alignItems: 'center',
    ...shadows.sm
  },

  // GP code badge
  gpCodeRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.primaryContainer, borderRadius: radius.sm,
    paddingHorizontal: 12, paddingVertical: 10, marginBottom: 8,
  },
  gpCodeLabel: { ...typography.labelSm, color: colors.primary, letterSpacing: 1 },
  gpCodeValue: { ...typography.headlineSm, color: colors.primaryDark },

  // Phone
  phoneWrapper: {
    flexDirection: 'row', borderWidth: 1, borderColor: colors.outlineVariant,
    borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.white,
  },
  phonePrefix: {
    paddingHorizontal: 16, justifyContent: 'center',
    backgroundColor: '#f1f5f9',
  },
  phonePrefixText: { ...typography.bodyMd, fontWeight: '700', color: colors.onSurfaceVariant },
  phoneDivider: { width: 1, backgroundColor: colors.outlineVariant },
  phoneInput: {
    flex: 1, paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 16 : 14,
    ...typography.bodyMd, color: colors.onSurface,
  },

  // Photo Capture
  captureBtn: {
    height: 140,
    borderWidth: 2, borderColor: colors.primaryContainer,
    borderStyle: 'dashed', borderRadius: radius.lg,
    backgroundColor: colors.surfaceContainerLow,
    justifyContent: 'center', alignItems: 'center',
    gap: spacing.sm,
  },
  captureBtnText: {
    ...typography.labelMd, color: colors.primary, fontWeight: '700',
  },
  photoScroll: {
    marginTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  photoWrapper: {
    marginRight: spacing.md,
    position: 'relative',
  },
  capturedPhotoThumb: {
    width: 120, height: 120,
    borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.outlineVariant,
  },
  removePhotoBtn: {
    position: 'absolute', top: -6, right: -6,
    backgroundColor: colors.error,
    borderRadius: 12, width: 24, height: 24,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: colors.white,
  },
  addMorePhotoBtn: {
    width: 120, height: 120,
    borderRadius: radius.md,
    borderWidth: 2, borderColor: colors.primary,
    borderStyle: 'dashed',
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
  },

  actionBar: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceContainerLow,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
  },
  submitBtn: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.primary,
  },
  submitText: {
    color: '#fff', ...typography.labelMd, fontWeight: '800', letterSpacing: 1.2,
  },
  draftBtn: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  draftText: {
    color: colors.primary, ...typography.labelMd, fontWeight: '800', letterSpacing: 1.2,
  },

  // Modal
  modalBg: { flex: 1, backgroundColor: 'rgba(15,23,42,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { width: '85%', backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.xl, ...shadows.lg },
  modalTitle: { ...typography.headlineSm, marginBottom: spacing.lg, textTransform: 'capitalize', color: colors.onSurface },
  modalBtnRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.md },
  modalBtnCancel: { paddingVertical: spacing.sm, paddingHorizontal: spacing.lg },
  modalBtnSave: { backgroundColor: colors.primary, paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, borderRadius: radius.md, minWidth: 80, alignItems: 'center' },
  modalBtnText: { ...typography.bodyMd, fontWeight: '600', color: colors.primary },
});
