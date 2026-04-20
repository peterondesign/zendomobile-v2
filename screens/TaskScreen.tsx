import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

import { BrandLogo } from '../components/BrandLogo';
import { Theme } from '../theme';

const taskSuggestions = [
  'Research industry-specific investor networks',
  'Attend relevant industry conferences',
  'Join online investment forums',
];

type TaskScreenProps = {
  theme: Theme;
  isCompact: boolean;
  value: string;
  onChangeText: (value: string) => void;
  onToggleTheme: () => void;
  onBack: () => void;
  onContinue: () => void;
};

export function TaskScreen({
  theme,
  isCompact,
  value,
  onChangeText,
  onToggleTheme,
  onBack,
  onContinue,
}: TaskScreenProps) {
  const hasValue = value.trim().length > 0;

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Pressable onPress={onBack}>
          <Text style={[styles.backButtonText, { color: theme.backText }]}>Back</Text>
        </Pressable>

        <Pressable style={styles.themeButton} onPress={onToggleTheme}>
          <Text style={[styles.themeIcon, { color: theme.iconColor }]}>{theme.themeIcon}</Text>
        </Pressable>
      </View>

      <View style={[styles.taskScreen, isCompact && styles.taskScreenCompact]}>
        <View style={[styles.taskHeaderRow, isCompact && styles.taskHeaderRowCompact]}>
          <View style={styles.smallLogoWrap}>
            <BrandLogo width={26} height={18} mode={theme.logoMode} />
          </View>
        </View>

        <View style={[styles.taskIntro, isCompact && styles.taskIntroCompact]}>
          <Text style={[styles.taskTitle, isCompact && styles.taskTitleCompact, { color: theme.heading }]}>Pick a first step</Text>
          <Text style={[styles.taskSubtitle, isCompact && styles.taskSubtitleCompact, { color: theme.mutedText }]}>One action to start today.</Text>
        </View>

        <View
          style={[
            styles.taskCard,
            isCompact && styles.taskCardCompact,
            {
              backgroundColor: theme.cardBackground,
              borderColor: theme.cardBorder,
              shadowColor: theme.pageGlow,
            },
          ]}
        >
          <Text style={[styles.taskLabel, isCompact && styles.taskLabelCompact, { color: theme.label }]}>FIRST TASK</Text>

          <View
            style={[
              styles.textAreaShell,
              isCompact && styles.textAreaShellCompact,
              { backgroundColor: theme.textAreaBackground },
            ]}
          >
            <TextInput
              multiline
              value={value}
              onChangeText={onChangeText}
              placeholder="Do the first easy step"
              placeholderTextColor={theme.textAreaPlaceholder}
              style={[styles.taskInput, isCompact && styles.taskInputCompact, { color: theme.textAreaText }]}
              textAlignVertical="top"
            />
          </View>

          <View style={[styles.suggestionsList, isCompact && styles.suggestionsListCompact]}>
            {taskSuggestions.map((suggestion) => (
              <Pressable
                key={suggestion}
                onPress={() => onChangeText(suggestion)}
                style={[styles.suggestionChip, isCompact && styles.suggestionChipCompact, { backgroundColor: theme.chipBackground }]}
              >
                <Text
                  style={[
                    styles.suggestionChipText,
                    isCompact && styles.suggestionChipTextCompact,
                    { color: theme.chipText },
                  ]}
                >
                  {suggestion}
                </Text>
              </Pressable>
            ))}
          </View>

          {hasValue ? (
            <Pressable onPress={onContinue} style={styles.buttonPressable}>
              <LinearGradient
                colors={theme.primaryGradient}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={[styles.continueButton, isCompact && styles.continueButtonCompact]}
              >
                <Text
                  style={[
                    styles.continueButtonText,
                    isCompact && styles.continueButtonTextCompact,
                    { color: theme.primaryText },
                  ]}
                >
                  Continue
                </Text>
              </LinearGradient>
            </Pressable>
          ) : (
            <View style={[styles.continueButton, isCompact && styles.continueButtonCompact, { backgroundColor: theme.buttonDisabled }]}> 
              <Text
                style={[
                  styles.continueButtonText,
                  isCompact && styles.continueButtonTextCompact,
                  { color: theme.buttonDisabledText },
                ]}
              >
                Continue
              </Text>
            </View>
          )}
        </View>
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
  backButtonText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
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
  taskScreen: {
    flex: 1,
    paddingTop: 18,
  },
  taskScreenCompact: {
    paddingTop: 6,
  },
  taskHeaderRow: {
    marginTop: 10,
  },
  taskHeaderRowCompact: {
    marginTop: 2,
  },
  smallLogoWrap: {
    width: 40,
    alignItems: 'flex-start',
  },
  taskIntro: {
    marginTop: 66,
    marginBottom: 34,
    gap: 18,
  },
  taskIntroCompact: {
    marginTop: 28,
    marginBottom: 18,
    gap: 8,
  },
  taskTitle: {
    fontSize: 56,
    lineHeight: 60,
    fontWeight: '800',
    letterSpacing: -1.8,
    maxWidth: 650,
  },
  taskTitleCompact: {
    fontSize: 32,
    lineHeight: 36,
    letterSpacing: -1,
    maxWidth: 320,
  },
  taskSubtitle: {
    fontSize: 29,
    lineHeight: 38,
    fontWeight: '400',
    letterSpacing: -1,
  },
  taskSubtitleCompact: {
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  taskCard: {
    borderRadius: 36,
    paddingHorizontal: 38,
    paddingTop: 34,
    paddingBottom: 28,
    borderWidth: 1,
    shadowOpacity: 0.22,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 18 },
  },
  taskCardCompact: {
    flex: 1,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  taskLabel: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 26,
  },
  taskLabelCompact: {
    fontSize: 13,
    lineHeight: 16,
    letterSpacing: 0.5,
    marginBottom: 14,
  },
  textAreaShell: {
    minHeight: 470,
    borderRadius: 30,
    paddingHorizontal: 30,
    paddingVertical: 28,
  },
  textAreaShellCompact: {
    minHeight: 0,
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  taskInput: {
    minHeight: 410,
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '700',
    letterSpacing: -0.7,
  },
  taskInputCompact: {
    minHeight: 0,
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  suggestionsList: {
    marginTop: 28,
    gap: 18,
    alignItems: 'flex-start',
  },
  suggestionsListCompact: {
    marginTop: 14,
    gap: 10,
  },
  suggestionChip: {
    borderRadius: 999,
    paddingHorizontal: 28,
    paddingVertical: 18,
    maxWidth: '100%',
  },
  suggestionChipCompact: {
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  suggestionChipText: {
    fontSize: 21,
    lineHeight: 28,
    fontWeight: '500',
    letterSpacing: -0.5,
  },
  suggestionChipTextCompact: {
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: -0.1,
  },
  buttonPressable: {
    borderRadius: 41,
    marginTop: 34,
  },
  continueButton: {
    minHeight: 82,
    borderRadius: 41,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonCompact: {
    marginTop: 18,
    minHeight: 58,
    borderRadius: 29,
  },
  continueButtonText: {
    fontSize: 25,
    lineHeight: 30,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  continueButtonTextCompact: {
    fontSize: 16,
    lineHeight: 20,
    letterSpacing: -0.2,
  },
});