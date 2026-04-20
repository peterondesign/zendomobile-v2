import { ColorSchemeName } from 'react-native';

export type ThemeName = 'light' | 'dark';

export type Theme = {
  statusBar: 'light' | 'dark';
  backgroundGradient: [string, string];
  haloColor: string;
  pageGlow: string;
  themeIcon: string;
  iconColor: string;
  primaryGradient: [string, string];
  primaryText: string;
  secondaryBorder: string;
  secondaryBackground: string;
  secondaryText: string;
  heading: string;
  mutedText: string;
  label: string;
  cardBackground: string;
  cardBorder: string;
  textAreaBackground: string;
  textAreaText: string;
  textAreaPlaceholder: string;
  chipBackground: string;
  chipText: string;
  buttonDisabled: string;
  buttonDisabledText: string;
  backText: string;
  logoMode: ThemeName;
};

export const themes: Record<ThemeName, Theme> = {
  light: {
    statusBar: 'dark',
    backgroundGradient: ['#E9F1FF', '#F8F4EE'],
    haloColor: 'rgba(104, 116, 252, 0.10)',
    pageGlow: 'rgba(110, 136, 255, 0.14)',
    themeIcon: '☾',
    iconColor: '#101114',
    primaryGradient: ['#4650F4', '#4047E8'],
    primaryText: '#FFFFFF',
    secondaryBorder: '#7B82FF',
    secondaryBackground: 'rgba(255, 255, 255, 0.18)',
    secondaryText: '#4450F0',
    heading: '#17191E',
    mutedText: '#7D8596',
    label: '#737A88',
    cardBackground: 'rgba(255, 255, 255, 0.92)',
    cardBorder: 'rgba(255, 255, 255, 0.72)',
    textAreaBackground: '#F7F8FC',
    textAreaText: '#181A20',
    textAreaPlaceholder: '#B1B7C4',
    chipBackground: '#F4F5F8',
    chipText: '#2A2D35',
    buttonDisabled: '#A8AFBD',
    buttonDisabledText: '#FFFFFF',
    backText: '#4047E8',
    logoMode: 'light',
  },
  dark: {
    statusBar: 'light',
    backgroundGradient: ['#060709', '#0f0f11'],
    haloColor: 'rgba(98, 114, 255, 0.18)',
    pageGlow: 'rgba(120, 138, 255, 0.10)',
    themeIcon: '☀',
    iconColor: '#E8ECFF',
    primaryGradient: ['#6A75FF', '#5562FF'],
    primaryText: '#F7F8FF',
    secondaryBorder: 'rgba(141, 153, 255, 0.68)',
    secondaryBackground: 'rgba(255, 255, 255, 0.05)',
    secondaryText: '#C7D0FF',
    heading: '#F4F6FF',
    mutedText: '#96A1BE',
    label: '#A4AEC6',
    cardBackground: 'rgba(17, 24, 39, 0.82)',
    cardBorder: 'rgba(115, 128, 171, 0.18)',
    textAreaBackground: 'rgba(255, 255, 255, 0.05)',
    textAreaText: '#F6F7FB',
    textAreaPlaceholder: '#6F7A97',
    chipBackground: 'rgba(255, 255, 255, 0.06)',
    chipText: '#E5E9F8',
    buttonDisabled: '#7C869A',
    buttonDisabledText: '#EEF1FA',
    backText: '#A9B3FF',
    logoMode: 'dark',
  },
};

export function resolveThemeName(
  colorScheme: ColorSchemeName,
  preference: ThemeName | null,
): ThemeName {
  if (preference) {
    return preference;
  }

  return colorScheme === 'dark' ? 'dark' : 'light';
}