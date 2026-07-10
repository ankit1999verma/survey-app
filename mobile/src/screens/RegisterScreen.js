import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, StatusBar, Platform, KeyboardAvoidingView, ScrollView
} from 'react-native';
import { useAlert } from '../context/AlertContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, radius, typography, shadows } from '../theme';
import api from '../utils/api';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

const RegisterScreen = () => {
  const navigation = useNavigation();
  const { showAlert: alert } = useAlert();
  
  const [companyName, setCompanyName] = useState('');
  const [adminName, setAdminName] = useState('');
  const [contactNo, setContactNo] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    if (!companyName || !adminName || !username || !password) {
      alert('Missing Fields', 'Please fill in all the required fields to register.');
      return;
    }
    
    setIsLoading(true);
    try {
      await api.post('/auth/register-company', {
        companyName,
        adminName,
        adminContactNo: contactNo,
        adminUsername: username,
        adminPassword: password
      });
      
      alert('Registration Successful', 'Your account has been created. An email with your credentials has been sent. Please contact our marketing team to activate your subscription.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      alert('Registration Failed', error.response?.data || 'An error occurred during registration. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient colors={[colors.surfaceContainerLow, '#E2E8F0', '#CBD5E1']} style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      <KeyboardAvoidingView 
        style={styles.keyboardView} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? -20 : 0}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          bounces={false}
          showsVerticalScrollIndicator={false}
        >
          {/* Back Button */}
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={24} color={colors.onSurface} />
          </TouchableOpacity>

          {/* Logo / Title Area */}
          <View style={styles.brandContainer}>
            <View style={styles.logoBox}>
              <Feather name="map-pin" size={36} color={colors.primary} />
            </View>
            <Text style={styles.appName}>GramSync Pro</Text>
            <Text style={styles.appSubtitle}>Register for Field Access</Text>
          </View>

          {/* Registration Card */}
          <View style={styles.card}>
            {/* Company Name */}
            <Text style={styles.fieldLabel}>COMPANY NAME</Text>
            <View style={[styles.inputWrapper, focusedField === 'company' && styles.inputFocused]}>
              <Feather name="briefcase" size={20} color={focusedField === 'company' ? colors.primary : colors.outline} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Acme Corp"
                value={companyName}
                onChangeText={setCompanyName}
                placeholderTextColor={colors.placeholder}
                onFocus={() => setFocusedField('company')}
                onBlur={() => setFocusedField(null)}
              />
            </View>
            
            {/* Admin Name */}
            <Text style={styles.fieldLabel}>ADMIN NAME</Text>
            <View style={[styles.inputWrapper, focusedField === 'admin' && styles.inputFocused]}>
              <Feather name="user" size={20} color={focusedField === 'admin' ? colors.primary : colors.outline} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="John Doe"
                value={adminName}
                onChangeText={setAdminName}
                placeholderTextColor={colors.placeholder}
                onFocus={() => setFocusedField('admin')}
                onBlur={() => setFocusedField(null)}
              />
            </View>

            {/* Contact Number */}
            <Text style={styles.fieldLabel}>CONTACT NUMBER</Text>
            <View style={[styles.inputWrapper, focusedField === 'contact' && styles.inputFocused]}>
              <Feather name="phone" size={20} color={focusedField === 'contact' ? colors.primary : colors.outline} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="+91 9876543210"
                value={contactNo}
                onChangeText={setContactNo}
                keyboardType="phone-pad"
                placeholderTextColor={colors.placeholder}
                onFocus={() => setFocusedField('contact')}
                onBlur={() => setFocusedField(null)}
              />
            </View>

            {/* Email/Username */}
            <Text style={styles.fieldLabel}>EMAIL (USERNAME)</Text>
            <View style={[styles.inputWrapper, focusedField === 'username' && styles.inputFocused]}>
              <Feather name="mail" size={20} color={focusedField === 'username' ? colors.primary : colors.outline} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="john@acme.com"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                keyboardType="email-address"
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

            {/* Register Button */}
            <TouchableOpacity
              style={[styles.loginBtn, isLoading && styles.loginBtnDisabled]}
              onPress={handleRegister}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.loginBtnText}>Register Account</Text>
              )}
            </TouchableOpacity>
          </View>
          <View style={styles.footer}>
            <Text style={styles.footerText}>Secure Field Ops © 2026</Text>
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
  scrollContent: { flexGrow: 1, paddingHorizontal: spacing.lg, paddingTop: 80, paddingBottom: 40 },

  backBtn: {
    position: 'absolute',
    top: spacing.lg,
    left: spacing.sm,
    padding: spacing.sm,
    zIndex: 10,
  },

  // Brand
  brandContainer: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  logoBox: {
    width: 72, height: 72,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
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
    borderRadius: radius.xxl,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    ...shadows.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.xl,
    justifyContent: 'center',
    marginTop: spacing.xl,
    ...shadows.primary,
  },
  loginBtnDisabled: { opacity: 0.7 },
  loginBtnText: {
    ...typography.labelMd,
    color: colors.white,
    marginLeft: spacing.sm,
    fontSize: 16,
  },
  footer: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  footerText: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
  },
});

export default RegisterScreen;
