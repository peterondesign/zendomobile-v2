import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

import { BrandLogo } from '../components/BrandLogo';
import { Theme } from '../theme';

const suggestionChips = ['Career growth', 'Lose weight', 'Start a business'];

type GoalScreenProps = {
  theme: Theme;
  isCompact: boolean;
  value: string;
  onChangeText: (value: string) => void;
  onToggleTheme: () => void;
  onBack: () => void;
  onContinue: () => void;
};

export function GoalScreen({
  theme,
  isCompact,
  value,
  onChangeText,
  onToggleTheme,
  onBack,
  onContinue,
}: GoalScreenProps) {
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

      <View style={[styles.goalScreen, isCompact && styles.goalScreenCompact]}>
        <View style={[styles.goalHeaderRow, isCompact && styles.goalHeaderRowCompact]}>
          <View style={styles.smallLogoWrap}>
            <BrandLogo width={26} height={18} mode={theme.logoMode} />
          </View>
        </View>

        <View style={[styles.goalIntro, isCompact && styles.goalIntroCompact]}>
          <Text style={[styles.goalTitle, isCompact && styles.goalTitleCompact, { color: theme.heading }]}>Hi Peter,</Text>
          <Text
            style={[
              styles.goalSubtitle,
              isCompact && styles.goalSubtitleCompact,
              { color: theme.mutedText },
            ]}
          >
            What is one goal you want to achieve?
          </Text>
        </View>

        <View
          style={[
            styles.goalCard,
            isCompact && styles.goalCardCompact,
            {
              backgroundColor: theme.cardBackground,
              borderColor: theme.cardBorder,
              shadowColor: theme.pageGlow,
            },
          ]}
        >
          <Text style={[styles.goalLabel, isCompact && styles.goalLabelCompact, { color: theme.label }]}>GOAL</Text>

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
              placeholder="Write your goal"
              placeholderTextColor={theme.textAreaPlaceholder}
              style={[styles.goalInput, isCompact && styles.goalInputCompact, { color: theme.textAreaText }]}
              textAlignVertical="top"
            />
          </View>

          <View style={[styles.suggestionsList, isCompact && styles.suggestionsListCompact]}>
            {suggestionChips.map((suggestion) => (
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
  goalScreen: {
    flex: 1,
    paddingTop: 18,
  },
  goalScreenCompact: {
    paddingTop: 6,
  },
  goalHeaderRow: {
    marginTop: 10,
  },
  goalHeaderRowCompact: {
    marginTop: 2,
  },
  smallLogoWrap: {
    width: 40,
    alignItems: 'flex-start',
  },
  goalIntro: {
    marginTop: 66,
    marginBottom: 34,
    gap: 18,
  },
  goalIntroCompact: {
    marginTop: 28,
    marginBottom: 18,
    gap: 8,
  },
  goalTitle: {
    fontSize: 58,
    lineHeight: 62,
    fontWeight: '800',
    letterSpacing: -1.8,
  },
  goalTitleCompact: {
    fontSize: 34,
    lineHeight: 38,
    letterSpacing: -1,
  },
  goalSubtitle: {
    fontSize: 29,
    lineHeight: 38,
    fontWeight: '400',
    letterSpacing: -1,
    maxWidth: 620,
  },
  goalSubtitleCompact: {
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.2,
    maxWidth: 320,
  },
  goalCard: {
    borderRadius: 36,
    paddingHorizontal: 38,
    paddingTop: 34,
    paddingBottom: 28,
    borderWidth: 1,
    shadowOpacity: 0.22,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 18 },
  },
  goalCardCompact: {
    flex: 1,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  goalLabel: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 26,
  },
  goalLabelCompact: {
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
  goalInput: {
    minHeight: 410,
    fontSize: 26,
    lineHeight: 34,
    fontWeight: '700',
    letterSpacing: -0.7,
  },
  goalInputCompact: {
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