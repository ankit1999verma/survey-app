import React, { createContext, useState, useContext, useCallback } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Platform, Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing, typography, shadows } from '../theme';

const AlertContext = createContext();

export const useAlert = () => useContext(AlertContext);

export const AlertProvider = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState({ title: '', message: '', buttons: [] });
  const [scaleAnim] = useState(new Animated.Value(0.9));
  const [fadeAnim] = useState(new Animated.Value(0));

  const showAlert = useCallback((title, message, buttons = []) => {
    setConfig({ title, message, buttons });
    setVisible(true);
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, friction: 8, tension: 60 }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true })
    ]).start();
  }, [scaleAnim, fadeAnim]);

  const hideAlert = useCallback(() => {
    Animated.parallel([
      Animated.timing(scaleAnim, { toValue: 0.9, duration: 150, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true })
    ]).start(() => setVisible(false));
  }, [scaleAnim, fadeAnim]);

  const handleButtonPress = (onPress) => {
    hideAlert();
    if (onPress) setTimeout(onPress, 200);
  };

  const activeButtons = config.buttons.length > 0 ? config.buttons : [{ text: 'OK' }];

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      <Modal visible={visible} transparent animationType="none" onRequestClose={hideAlert}>
        <View style={styles.overlay}>
          <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
          <Animated.View style={[styles.dialog, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
            {/* Header / Icon */}
            <View style={styles.iconContainer}>
              <Feather 
                name={config.title.toLowerCase().includes('error') ? 'alert-triangle' : 
                      config.title.toLowerCase().includes('success') ? 'check-circle' : 
                      config.title.toLowerCase().includes('denied') ? 'x-circle' : 'info'} 
                size={32} 
                color={config.title.toLowerCase().includes('error') ? colors.error : 
                       config.title.toLowerCase().includes('denied') ? colors.error : colors.primary} 
              />
            </View>
            
            <Text style={styles.title}>{config.title}</Text>
            {!!config.message && <Text style={styles.message}>{config.message}</Text>}

            <View style={[styles.buttonContainer, activeButtons.length > 2 && { flexDirection: 'column' }]}>
              {activeButtons.map((btn, index) => {
                const isDestructive = btn.style === 'destructive';
                const isCancel = btn.style === 'cancel';
                const isPrimary = !isDestructive && !isCancel;

                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.button,
                      isPrimary && styles.btnPrimary,
                      isCancel && styles.btnCancel,
                      isDestructive && styles.btnDestructive,
                      activeButtons.length > 2 && { width: '100%' } // Stack if many buttons
                    ]}
                    onPress={() => handleButtonPress(btn.onPress)}
                    activeOpacity={0.8}
                  >
                    <Text style={[
                      styles.btnText,
                      isPrimary && styles.btnTextPrimary,
                      isCancel && styles.btnTextCancel,
                      isDestructive && styles.btnTextDestructive
                    ]}>
                      {btn.text}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>
        </View>
      </Modal>
    </AlertContext.Provider>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  dialog: {
    width: '85%', maxWidth: 360,
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: spacing.xl,
    alignItems: 'center',
    ...shadows.lg,
  },
  iconContainer: {
    width: 64, height: 64,
    borderRadius: 32,
    backgroundColor: colors.surfaceContainerLow,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.titleLg, color: colors.onSurface,
    textAlign: 'center', marginBottom: spacing.sm, fontWeight: '700'
  },
  message: {
    ...typography.bodyMd, color: colors.onSurfaceVariant,
    textAlign: 'center', marginBottom: spacing.xl,
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row', width: '100%', gap: spacing.sm,
  },
  button: {
    flex: 1, paddingVertical: 14, borderRadius: radius.lg,
    justifyContent: 'center', alignItems: 'center',
  },
  btnText: {
    ...typography.labelLg, fontWeight: '700',
  },
  
  // Primary (Default)
  btnPrimary: {
    backgroundColor: colors.primary,
  },
  btnTextPrimary: { color: colors.white },

  // Cancel
  btnCancel: {
    backgroundColor: colors.surfaceContainer,
  },
  btnTextCancel: { color: colors.onSurface },

  // Destructive
  btnDestructive: {
    backgroundColor: colors.errorContainer,
  },
  btnTextDestructive: { color: colors.error },
});
