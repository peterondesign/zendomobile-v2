import { Pressable, StyleSheet, Text, View } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

import { BrandLogo } from '../components/BrandLogo';
import { Theme } from '../theme';

type LandingScreenProps = {
  isBusy?: boolean;
  primaryActionLabel?: string;
  secondaryActionLabel?: string;
  theme: Theme;
  onPrimaryAction: () => void;
  onSecondaryAction: () => void;
  onToggleTheme: () => void;
};

export function LandingScreen({
  isBusy = false,
  primaryActionLabel = 'Get started',
  secondaryActionLabel = 'I already have an account',
  theme,
  onPrimaryAction,
  onSecondaryAction,
  onToggleTheme,
}: LandingScreenProps) {
  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <View />

        <Pressable style={styles.themeButton} onPress={onToggleTheme}>
          <Text style={[styles.themeIcon, { color: theme.iconColor }]}>{theme.themeIcon}</Text>
        </Pressable>
      </View>

      <View style={styles.hero}>
        <View />
        <BrandLogo width={96} height={66.4} mode={theme.logoMode} />
      </View>

      <View style={styles.actions}>
        <Pressable style={styles.actionPressable} onPress={onPrimaryAction} disabled={isBusy}>
          <LinearGradient
            colors={theme.primaryGradient}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.primaryButton}
          >
            <Text style={[styles.primaryButtonText, { color: theme.primaryText }]}>{isBusy ? 'Connecting...' : primaryActionLabel}</Text>
          </LinearGradient>
        </Pressable>

        <Pressable
          style={[
            styles.actionPressable,
            styles.secondaryButton,
            {
              borderColor: theme.secondaryBorder,
              backgroundColor: theme.secondaryBackground,
            },
          ]}
          onPress={onSecondaryAction}
          disabled={isBusy}
        >
          <Text style={[styles.secondaryButtonText, { color: theme.secondaryText }]}>{secondaryActionLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 12,
    paddingBottom: 24,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  themeButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeIcon: {
    fontSize: 20,
    fontWeight: '500',
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 84,
  },
  logoHalo: {
    position: 'absolute',
    width: 118,
    height: 118,
    borderRadius: 59,
    transform: [{ scaleX: 1.25 }, { scaleY: 0.92 }],
  },
  actions: {
    gap: 16,
  },
  actionPressable: {
    borderRadius: 34,
  },
  primaryButton: {
    minHeight: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  secondaryButton: {
    minHeight: 66,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});