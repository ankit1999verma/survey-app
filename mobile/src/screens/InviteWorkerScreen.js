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

const InviteWorkerScreen = () => {
  const navigation = useNavigation();
  const { showAlert: alert } = useAlert();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [contactNo, setContactNo] = useState('');
  const [focusedField, setFocusedField] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleInvite = async () => {
    if (!name || !email || !contactNo) {
      alert('Missing Fields', 'Please fill in all the required fields to invite a worker.');
      return;
    }
    
    setIsLoading(true);
    try {
      await api.post('/admin/invite-worker', {
        name,
        username: email,
        contactNo
      });
      
      alert('Invite Sent', `An account has been created for ${name}. Their randomly generated password has been sent to ${email}.`, [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      alert('Invite Failed', error.response?.data || 'An error occurred while inviting the worker. Please try again.');
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
              <Feather name="user-plus" size={36} color={colors.primary} />
            </View>
            <Text style={styles.appName}>Invite Team Member</Text>
            <Text style={styles.appSubtitle}>Add a surveyor to your company</Text>
          </View>

          {/* Invite Card */}
          <View style={styles.card}>
            
            {/* Worker Name */}
            <Text style={styles.fieldLabel}>WORKER NAME</Text>
            <View style={[styles.inputWrapper, focusedField === 'name' && styles.inputFocused]}>
              <Feather name="user" size={20} color={focusedField === 'name' ? colors.primary : colors.outline} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="John Doe"
                value={name}
                onChangeText={setName}
                placeholderTextColor={colors.placeholder}
                onFocus={() => setFocusedField('name')}
                onBlur={() => setFocusedField(null)}
              />
            </View>

            {/* Email/Username */}
            <Text style={styles.fieldLabel}>WORKER EMAIL</Text>
            <View style={[styles.inputWrapper, focusedField === 'email' && styles.inputFocused]}>
              <Feather name="mail" size={20} color={focusedField === 'email' ? colors.primary : colors.outline} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="john@example.com"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholderTextColor={colors.placeholder}
                onFocus={() => setFocusedField('email')}
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

            {/* Invite Button */}
            <TouchableOpacity
              style={[styles.loginBtn, isLoading && styles.loginBtnDisabled]}
              onPress={handleInvite}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.loginBtnText}>Send Invite Email</Text>
              )}
            </TouchableOpacity>
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

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    ...shadows.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
  },

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
  },
  inputIcon: { marginRight: 12 },
  input: { 
    flex: 1, 
    padding: 0, 
    ...typography.bodyLg, 
    color: colors.onSurface 
  },

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
});

export default InviteWorkerScreen;
