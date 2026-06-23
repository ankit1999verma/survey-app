import React, { useState, useContext } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, StatusBar, Platform
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radius, typography } from '../theme';

const LoginScreen = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const { login, isLoading } = useContext(AuthContext);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Missing Fields', 'Please enter your username and password.');
      return;
    }
    try {
      await login(username, password);
    } catch (error) {
      Alert.alert('Access Denied', 'Invalid credentials. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      {/* App Header Bar */}
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
        <Text style={styles.syncIcon}>⇄</Text>
      </View>
      <View style={styles.headerUnderline} />

      {/* Main Content */}
      <View style={styles.content}>
        {/* Login Card */}
        <View style={styles.card}>
          {/* Lock Icon */}
          <View style={styles.iconContainer}>
            <Text style={styles.lockIcon}>🔒</Text>
          </View>

          <Text style={styles.cardTitle}>Secure Access</Text>
          <Text style={styles.cardSubtitle}>
            Authorized field personnel login for data synchronization and reporting.
          </Text>

          {/* Username */}
          <Text style={styles.fieldLabel}>USERNAME</Text>
          <View style={[styles.inputWrapper, focusedField === 'username' && styles.inputFocused]}>
            <Text style={styles.inputIcon}>👤</Text>
            <TextInput
              style={styles.input}
              placeholder="Field ID or Username"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              placeholderTextColor={colors.placeholder}
              onFocus={() => setFocusedField('username')}
              onBlur={() => setFocusedField(null)}
            />
          </View>

          {/* Password */}
          <Text style={styles.fieldLabel}>PASSWORD</Text>
          <View style={[styles.inputWrapper, focusedField === 'password' && styles.inputFocused]}>
            <Text style={styles.inputIcon}>🔑</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!passwordVisible}
              placeholderTextColor={colors.placeholder}
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
            />
            <TouchableOpacity onPress={() => setPasswordVisible(!passwordVisible)} style={styles.eyeBtn}>
              <Text style={styles.eyeIcon}>{passwordVisible ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.loginBtn, isLoading && styles.loginBtnDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.loginBtnText}>Login →</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity>
            <Text style={styles.forgotText}>Forgot access credentials?</Text>
          </TouchableOpacity>
        </View>

        {/* Session Info */}
        <View style={styles.sessionBanner}>
          <Text style={styles.sessionIcon}>ℹ️</Text>
          <Text style={styles.sessionText}>Your session will persist until manual logout.</Text>
        </View>
      </View>

      {/* Version footer */}
      <Text style={styles.versionText}>V1.0.0-STABLE  •  SECURE MODE</Text>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },

  // Header bar
  headerBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingVertical: 12,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  signalIcon: { flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  bar: { width: 4, backgroundColor: colors.primary, borderRadius: 1 },
  appName: { fontSize: 18, fontWeight: '700', color: colors.primary, letterSpacing: -0.3 },
  syncIcon: { fontSize: 20, color: colors.onSurface },
  headerUnderline: { height: 2, backgroundColor: colors.primary },

  content: { flex: 1, paddingHorizontal: spacing.md, paddingTop: spacing.xl, justifyContent: 'center' },

  // Card
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  iconContainer: {
    width: 64, height: 64, borderRadius: radius.lg,
    backgroundColor: colors.surfaceContainer,
    justifyContent: 'center', alignItems: 'center',
    alignSelf: 'center', marginBottom: spacing.md,
  },
  lockIcon: { fontSize: 28 },
  cardTitle: {
    ...typography.headlineMd, color: colors.onSurface,
    textAlign: 'center', marginBottom: 8,
  },
  cardSubtitle: {
    ...typography.bodyMd, color: colors.muted,
    textAlign: 'center', marginBottom: spacing.lg,
    lineHeight: 22,
  },

  // Fields
  fieldLabel: {
    ...typography.labelSm, color: colors.onSurfaceVariant,
    letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    height: 56, borderWidth: 1, borderColor: colors.outlineVariant,
    borderRadius: radius.md, backgroundColor: colors.white,
    paddingHorizontal: spacing.md, marginBottom: spacing.md,
  },
  inputFocused: { borderWidth: 2, borderColor: colors.primary, backgroundColor: colors.surfaceContainerLow },
  inputIcon: { fontSize: 16, marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: colors.onSurface },
  eyeBtn: { padding: 4 },
  eyeIcon: { fontSize: 16 },

  // Buttons
  loginBtn: {
    height: 56, backgroundColor: colors.primary,
    borderRadius: radius.md,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: spacing.md, marginTop: 4,
  },
  loginBtnDisabled: { opacity: 0.7 },
  loginBtnText: { color: colors.white, fontSize: 18, fontWeight: '700', letterSpacing: 0.5 },
  forgotText: {
    ...typography.labelMd, color: colors.primary,
    textAlign: 'center', textDecorationLine: 'underline',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },

  // Session banner
  sessionBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.lg, padding: spacing.md, gap: 8,
  },
  sessionIcon: { fontSize: 14 },
  sessionText: {
    fontSize: 13, color: colors.onSurfaceVariant,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    flex: 1,
  },

  // Version
  versionText: {
    textAlign: 'center', paddingVertical: spacing.md,
    fontSize: 11, color: colors.outline, letterSpacing: 1.5,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});

export default LoginScreen;
