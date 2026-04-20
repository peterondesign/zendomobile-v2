import { useState } from 'react';

import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ColorSchemeName,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';

import { BrandLogo } from './components/BrandLogo';

type ThemeName = 'light' | 'dark';

type Theme = {
  statusBar: 'light' | 'dark';
  backgroundGradient: [string, string];
  haloColor: string;
  themeIcon: string;
  iconColor: string;
  primaryGradient: [string, string];
  primaryText: string;
  secondaryBorder: string;
  secondaryBackground: string;
  secondaryText: string;
  logoMode: ThemeName;
};

const themes: Record<ThemeName, Theme> = {
  light: {
    statusBar: 'dark',
    backgroundGradient: ['#E9F1FF', '#F8F4EE'],
    haloColor: 'rgba(104, 116, 252, 0.10)',
    themeIcon: '☾',
    iconColor: '#101114',
    primaryGradient: ['#4650F4', '#4047E8'],
    primaryText: '#FFFFFF',
    secondaryBorder: '#7B82FF',
    secondaryBackground: 'rgba(255, 255, 255, 0.18)',
    secondaryText: '#4450F0',
    logoMode: 'light',
  },
  dark: {
    statusBar: 'light',
    backgroundGradient: ['#09111F', '#15192B'],
    haloColor: 'rgba(98, 114, 255, 0.18)',
    themeIcon: '☀',
    iconColor: '#E8ECFF',
    primaryGradient: ['#6A75FF', '#5562FF'],
    primaryText: '#F7F8FF',
    secondaryBorder: 'rgba(141, 153, 255, 0.68)',
    secondaryBackground: 'rgba(255, 255, 255, 0.05)',
    secondaryText: '#C7D0FF',
    logoMode: 'dark',
  },
};

function resolveThemeName(
  colorScheme: ColorSchemeName,
  preference: ThemeName | null,
): ThemeName {
  if (preference) {
    return preference;
  }

  return colorScheme === 'dark' ? 'dark' : 'light';
}

export default function App() {
  const colorScheme = useColorScheme();
  const [themePreference, setThemePreference] = useState<ThemeName | null>(null);
  const themeName = resolveThemeName(colorScheme, themePreference);
  const theme = themes[themeName];

  function toggleTheme() {
    setThemePreference((current) => {
      const nextTheme = resolveThemeName(colorScheme, current);
      return nextTheme === 'light' ? 'dark' : 'light';
    });
  }

  return (
    <LinearGradient
      colors={theme.backgroundGradient}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.background}
    >
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style={theme.statusBar} />

        <View style={styles.container}>
          <View style={styles.topBar}>
            <Pressable style={styles.themeButton} onPress={toggleTheme}>
              <Text style={[styles.themeIcon, { color: theme.iconColor }]}>
                {theme.themeIcon}
              </Text>
            </Pressable>
          </View>

          <View style={styles.hero}>
            <View
              style={[
                styles.logoHalo,
                { backgroundColor: theme.haloColor },
              ]}
            />
            <BrandLogo width={96} height={66.4} mode={theme.logoMode} />
          </View>

          <View style={styles.actions}>
            <Pressable style={styles.actionPressable}>
              <LinearGradient
                colors={theme.primaryGradient}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.primaryButton}
              >
                <Text style={[styles.primaryButtonText, { color: theme.primaryText }]}>
                  Get started
                </Text>
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
            >
              <Text style={[styles.secondaryButtonText, { color: theme.secondaryText }]}>
                I already have an account
              </Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 12,
    paddingBottom: 24,
  },
  topBar: {
    alignItems: 'flex-end',
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
