import React, { useState, useContext } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, StatusBar, Platform, KeyboardAvoidingView, ScrollView
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, radius, typography, shadows } from '../theme';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

const LoginScreen = () => {
  const navigation = useNavigation();
  const [username, setUsername] = useState(__DEV__ ? 'admin' : '');
  const [password, setPassword] = useState(__DEV__ ? 'admin123' : '');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const { login, isLoading } = useContext(AuthContext);
  const { showAlert: alert } = useAlert();

  const handleLogin = async () => {
    if (!username || !password) {
      alert('Missing Fields', 'Please enter your username and password.');
      return;
    }
    try {
      await login(username, password);
    } catch (error) {
      if (error.response && error.response.status === 403) {
        alert('Subscription Inactive', error.response.data || 'Your subscription is inactive. Please contact marketing to activate.');
      } else {
        alert('Access Denied', 'Invalid credentials. Please try again.');
      }
    }
  };

  return (
    <LinearGradient colors={[colors.surfaceContainerLow, '#E2E8F0', '#CBD5E1']} style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      <KeyboardAvoidingView 
        style={styles.keyboardView} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? -20 : 0}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          bounces={false}
          showsVerticalScrollIndicator={false}
        >
          
          {/* Logo / Title Area */}
          <View style={styles.brandContainer}>
            <View style={styles.logoBox}>
              <Feather name="map-pin" size={36} color={colors.primary} />
            </View>
            <Text style={styles.appName}>GramSync Pro</Text>
            <Text style={styles.appSubtitle}>Rural Network Survey</Text>
          </View>

          {/* Login Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Sign In</Text>
            <Text style={styles.cardSubtitle}>
              Authorized personnel login for survey data synchronization.
            </Text>

            {/* Username / Email / Phone */}
            <Text style={styles.fieldLabel}>EMAIL OR PHONE NUMBER</Text>
            <View style={[styles.inputWrapper, focusedField === 'username' && styles.inputFocused]}>
              <Feather name="user" size={20} color={focusedField === 'username' ? colors.primary : colors.outline} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="john@acme.com or +91..."
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
              <Feather name="lock" size={20} color={focusedField === 'password' ? colors.primary : colors.outline} style={styles.inputIcon} />
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
                <Feather name={passwordVisible ? "eye-off" : "eye"} size={20} color={colors.outline} />
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
                <Text style={styles.loginBtnText}>Login</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.forgotBtn}>
              <Text style={styles.forgotText}>Forgot credentials?</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.registerBtn}
              onPress={() => navigation.navigate('Register')}
            >
              <Text style={styles.registerText}>Register Your Company</Text>
            </TouchableOpacity>
          </View>

          {/* Session Info */}
          <View style={styles.sessionBanner}>
            <Feather name="info" size={16} color={colors.onSurfaceVariant} style={styles.sessionIcon} />
            <Text style={styles.sessionText}>Your session will persist until manual logout.</Text>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Authorized usage only. © 2026 GramSync Pro.</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: spacing.lg, paddingTop: 60, paddingBottom: 40 },

  // Brand
  brandContainer: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  logoBox: {
    width: 72, height: 72,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.md,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: spacing.md,
    ...shadows.md,
  },
  appName: {
    ...typography.displayLg,
    color: colors.primaryDark,
    textAlign: 'center',
  },
  appSubtitle: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: spacing.xs,
    letterSpacing: 1,
  },

  // Card
  card: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    borderRadius: radius.xxl,
    padding: spacing.xl,
    ...shadows.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  cardTitle: {
    ...typography.headlineSm, color: colors.onSurface,
    fontWeight: '700', marginBottom: 8,
  },
  cardSubtitle: {
    ...typography.bodyMd, color: colors.onSurfaceVariant,
    marginBottom: spacing.xl,
    lineHeight: 22,
  },

  // Fields
  fieldLabel: {
    ...typography.labelSm, color: colors.onSurfaceVariant,
    letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 8,
    fontWeight: '700',
  },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    height: 56, borderWidth: 1.5, borderColor: colors.outlineVariant,
    borderRadius: radius.lg, backgroundColor: colors.surface,
    paddingHorizontal: spacing.md, marginBottom: spacing.lg,
  },
  inputFocused: { 
    borderColor: colors.primary, 
    backgroundColor: colors.white,
    ...shadows.sm
  },
  inputIcon: { marginRight: 12 },
  input: { 
    flex: 1, 
    padding: 0, 
    ...typography.bodyLg, 
    color: colors.onSurface 
  },
  eyeBtn: { padding: 8, marginRight: -4 },

  // Buttons
  loginBtn: {
    height: 56, backgroundColor: colors.primary,
    borderRadius: radius.lg,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: spacing.lg, marginTop: spacing.sm,
    ...shadows.md,
  },
  loginBtnDisabled: { opacity: 0.7 },
  loginBtnText: {
    ...typography.labelMd,
    color: colors.white,
    marginLeft: spacing.sm,
    fontSize: 16,
  },
  forgotBtn: { alignSelf: 'center', paddingVertical: 8 },
  forgotText: {
    ...typography.labelLg, color: colors.primary,
    fontWeight: '600',
  },
  registerBtn: { alignSelf: 'center', paddingVertical: 8, marginTop: spacing.sm },
  registerText: {
    ...typography.labelLg, color: colors.onSurfaceVariant,
    fontWeight: '600', textDecorationLine: 'underline'
  },

  // Session banner
  sessionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.xl,
    justifyContent: 'center',
    marginTop: spacing.xl,
    ...shadows.primary,
  },
  sessionText: {
    ...typography.labelMd, color: colors.white,
    flex: 1, lineHeight: 20,
  },

  // Footer
  footer: { marginTop: spacing.xl, alignItems: 'center' },
  footerText: {
    textAlign: 'center', 
    ...typography.labelSm, color: colors.outline, letterSpacing: 1.5,
  },
});

export default LoginScreen;
