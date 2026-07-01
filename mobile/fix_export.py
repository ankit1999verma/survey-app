import re

with open('src/screens/DashboardScreen.js', 'r') as f:
    content = f.read()

# 1. Update imports
content = content.replace("import * as FileSystem from 'expo-file-system/legacy';", "import * as FileSystem from 'expo-file-system/legacy';\nimport { getStates, getDistricts, getBlocks } from '../utils/localDB';\nimport WheelPickerField from '../components/WheelPickerField';")
content = content.replace("Alert, ActivityIndicator, ScrollView, StatusBar, Platform", "Alert, ActivityIndicator, ScrollView, StatusBar, Platform, Modal")

# 2. Add State Variables
state_vars = """  const [isSyncing, setIsSyncing] = useState(false);
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
"""
content = content.replace("  const [isSyncing, setIsSyncing] = useState(false);\n  const [lastSync, setLastSync] = useState(null);", state_vars)

# 3. Functions
funcs = """  const openExportModal = async () => {
    try {
      const s = await getStates();
      setStatesList(s || []);
      setExportModalVisible(true);
    } catch (e) {
      console.log('Failed to load states for export', e);
    }
  };

  const onExportStateChange = async (name) => {
    const s = statesList.find(x => x.name === name);
    setExpStateName(name);
    setExpStateId(s?.id || null);
    setExpDistrictName(''); setExpDistrictId(null);
    setExpBlockName(''); setExpBlockId(null);
    if (s?.id) {
      const d = await getDistricts(s.id);
      setDistrictsList(d || []);
    } else {
      setDistrictsList([]);
    }
  };

  const onExportDistrictChange = async (name) => {
    const d = districtsList.find(x => x.name === name);
    setExpDistrictName(name);
    setExpDistrictId(d?.id || null);
    setExpBlockName(''); setExpBlockId(null);
    if (d?.id) {
      const b = await getBlocks(d.id);
      setBlocksList(b || []);
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
"""

content = re.sub(r'  const handleExportExcel = async \(\) => \{.*?(?=\n  const handleLogout)', funcs, content, flags=re.DOTALL)


# 4. Modify Button
content = content.replace("onPress={handleExportExcel}", "onPress={openExportModal}")


# 5. Add Modal before closing SafeAreaView
modal_ui = """      <Modal visible={exportModalVisible} transparent animationType="slide" onRequestClose={() => setExportModalVisible(false)}>
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
                items={statesList.map(s => ({ label: s.name, value: s.name }))}
                placeholder="All States"
                onChange={onExportStateChange}
              />
              <WheelPickerField
                label="DISTRICT"
                value={expDistrictName}
                items={districtsList.map(d => ({ label: d.name, value: d.name }))}
                placeholder={expStateId ? "All Districts" : "— Select state first —"}
                disabled={!expStateId}
                onChange={onExportDistrictChange}
              />
              <WheelPickerField
                label="BLOCK"
                value={expBlockName}
                items={blocksList.map(b => ({ label: b.name, value: b.name }))}
                placeholder={expDistrictId ? "All Blocks" : "— Select district first —"}
                disabled={!expDistrictId}
                onChange={onExportBlockChange}
              />
              <TouchableOpacity style={styles.downloadBtn} onPress={handleExportExcel}>
                <Feather name="download" size={20} color="#fff" />
                <Text style={styles.downloadBtnText}>Download Excel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};
"""
content = content.replace("    </SafeAreaView>\n  );\n};\n", modal_ui)

styles = """  modalOverlay: {
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
});"""

content = content.replace("});", styles)

with open('src/screens/DashboardScreen.js', 'w') as f:
    f.write(content)

