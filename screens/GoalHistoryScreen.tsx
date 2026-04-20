import { useState } from 'react';

import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { AppSidebar } from '../components/AppSidebar';
import { Theme } from '../theme';

type GoalHistoryScreenProps = {
  goalTitle: string;
  theme: Theme;
  onBackToGoalDetail: () => void;
  onBackToGoalEntry: () => void;
  onGoToChat: () => void;
  onGoToGoalsView: () => void;
  onGoToNewTask: () => void;
  onGoToSearch: () => void;
  onGoToTasksView: () => void;
  onToggleTheme: () => void;
};

export function GoalHistoryScreen({
  goalTitle,
  theme,
  onBackToGoalDetail,
  onBackToGoalEntry,
  onGoToChat,
  onGoToGoalsView,
  onGoToNewTask,
  onGoToSearch,
  onGoToTasksView,
  onToggleTheme,
}: GoalHistoryScreenProps) {
  const { height, width } = useWindowDimensions();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showInfoCard, setShowInfoCard] = useState(true);
  const isCompact = width <= 430 || height <= 860;
  const isDark = theme.logoMode === 'dark';
  const palette = {
    header: isDark ? 'rgba(18, 18, 18, 0.94)' : 'rgba(255,255,255,0.96)',
    headerBorder: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(207, 214, 227, 0.8)',
    headerButton: isDark ? '#222222' : '#FFFFFF',
    headerButtonBorder: isDark ? 'rgba(255,255,255,0.1)' : '#D2D8E3',
    headerText: isDark ? '#D4D4D4' : '#181A21',
    title: isDark ? '#D4D4D4' : '#1D212A',
    muted: isDark ? '#939393' : '#717B8E',
    divider: isDark ? 'rgba(255,255,255,0.08)' : '#E7EBF2',
    buttonBackground: isDark ? '#222222' : '#FFFFFF',
    buttonBorder: isDark ? 'rgba(255,255,255,0.08)' : '#DCE1EA',
    buttonIcon: isDark ? '#D4D4D4' : '#17191E',
    infoCard: isDark ? '#1A1A1A' : '#FFFFFF',
    infoCardBorder: isDark ? 'rgba(255,255,255,0.08)' : '#E7EBF2',
    gridDot: isDark ? '#2F2F2F' : '#E0E5EE',
    gridHighlight: isDark ? '#6C7CFF' : '#4D63FF',
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { backgroundColor: palette.header, borderBottomColor: palette.headerBorder }]}> 
        <View style={styles.headerLeft}>
          <Pressable style={[styles.headerIconButton, { backgroundColor: palette.headerButton, borderColor: palette.headerButtonBorder }]} onPress={() => setIsSidebarOpen(true)}>
            <View style={styles.stackIcon}>
              <View style={[styles.stackBar, { borderColor: palette.headerText }]} />
              <View style={[styles.stackBar, { borderColor: palette.headerText }]} />
            </View>
          </Pressable>

          <Text style={[styles.headerTitle, { color: palette.headerText }]}>Goals</Text>
        </View>
      </View>

      <View style={[styles.content, isCompact && styles.contentCompact]}>
        <View style={styles.activityPanel}>
          <View style={styles.activityHeader}>
            <View>
              <Text style={[styles.activityTitle, { color: palette.title }]}>{goalTitle}</Text>
              <Text style={[styles.activitySubtitle, { color: palette.muted }]}>Activity</Text>
            </View>

            <Pressable style={[styles.closeButton, { backgroundColor: palette.buttonBackground, borderColor: palette.buttonBorder }]} onPress={onBackToGoalDetail}>
              <Feather name="x" size={26} color={palette.buttonIcon} />
            </Pressable>
          </View>

          <View style={[styles.activityDivider, { backgroundColor: palette.divider }]} />

          <View style={[styles.monthRow, isCompact && styles.monthRowCompact]}>
            <Text style={[styles.monthText, isCompact && styles.monthTextCompact, { color: palette.muted }]}>Feb</Text>
            <Text style={[styles.monthText, isCompact && styles.monthTextCompact, { color: palette.muted }]}>Mar</Text>
            <Text style={[styles.monthText, isCompact && styles.monthTextCompact, { color: palette.muted }]}>Apr</Text>
          </View>

          <View style={[styles.gridWrap, isCompact && styles.gridWrapCompact]}>
            <View style={[styles.weekdayColumn, isCompact && styles.weekdayColumnCompact]}>
              <Text style={[styles.weekdayText, isCompact && styles.weekdayTextCompact, { color: palette.muted }]}>Mon</Text>
              <Text style={[styles.weekdayText, isCompact && styles.weekdayTextCompact, { color: palette.muted }]}>Wed</Text>
              <Text style={[styles.weekdayText, isCompact && styles.weekdayTextCompact, { color: palette.muted }]}>Fri</Text>
            </View>

            <View style={[styles.gridColumn, isCompact && styles.gridColumnCompact]}>
              {Array.from({ length: 6 }).map((_, rowIndex) => (
                <View key={`goal-history-row-${rowIndex}`} style={[styles.gridRow, isCompact && styles.gridRowCompact]}>
                  {Array.from({ length: 10 }).map((__, colIndex) => (
                    <View
                      key={`goal-history-dot-${rowIndex}-${colIndex}`}
                      style={[
                        styles.gridDot,
                        { backgroundColor: palette.gridDot },
                        isCompact && styles.gridDotCompact,
                        rowIndex === 0 && colIndex === 0 ? [styles.gridDotHighlight, { backgroundColor: palette.gridHighlight }] : null,
                      ]}
                    />
                  ))}
                </View>
              ))}
            </View>
          </View>
        </View>

        {showInfoCard ? (
          <View style={[styles.infoCard, isCompact && styles.infoCardCompact, { backgroundColor: palette.infoCard, borderColor: palette.infoCardBorder }]}>
            <View style={styles.infoHeader}>
              <View>
                <Text style={[styles.infoDate, isCompact && styles.infoDateCompact, { color: palette.title }]}>Sun, 22 Feb</Text>
                <Text style={[styles.infoSubtitle, isCompact && styles.infoSubtitleCompact, { color: palette.muted }]}>Completed tasks</Text>
              </View>

              <Pressable style={[styles.closeButton, { backgroundColor: palette.buttonBackground, borderColor: palette.buttonBorder }]} onPress={() => setShowInfoCard(false)}>
                <Feather name="x" size={24} color={palette.buttonIcon} />
              </Pressable>
            </View>

            <Text style={[styles.infoText, isCompact && styles.infoTextCompact, { color: palette.muted }]}>No completed tasks.</Text>
          </View>
        ) : null}
      </View>

      <AppSidebar
        activeItem="goals"
        onBack={() => {
          setIsSidebarOpen(false);
          onBackToGoalEntry();
        }}
        onClose={() => setIsSidebarOpen(false)}
        onSelectChat={() => {
          setIsSidebarOpen(false);
          onGoToChat();
        }}
        onSelectGoals={() => {
          setIsSidebarOpen(false);
          onGoToGoalsView();
        }}
        onSelectNewTask={() => {
          setIsSidebarOpen(false);
          onGoToNewTask();
        }}
        onSelectSearch={() => {
          setIsSidebarOpen(false);
          onGoToSearch();
        }}
        onSelectTasks={() => {
          setIsSidebarOpen(false);
          onGoToTasksView();
        }}
        onToggleTheme={onToggleTheme}
        theme={theme}
        title="Goals"
        visible={isSidebarOpen}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    height: 96,
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 14,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(207, 214, 227, 0.8)',
    justifyContent: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  headerIconButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D2D8E3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stackIcon: {
    width: 22,
    height: 20,
    flexDirection: 'row',
    gap: 4,
  },
  stackBar: {
    flex: 1,
    borderRadius: 3,
    borderWidth: 3,
    borderColor: '#181A21',
  },
  headerTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
    color: '#181A21',
    letterSpacing: -0.6,
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 18,
  },
  contentCompact: {
    paddingHorizontal: 18,
    paddingTop: 14,
  },
  activityPanel: {
    borderRadius: 0,
    backgroundColor: 'transparent',
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  activityTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
    color: '#1D212A',
    letterSpacing: -0.7,
  },
  activitySubtitle: {
    marginTop: 4,
    fontSize: 18,
    lineHeight: 24,
    color: '#717B8E',
  },
  closeButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1,
    borderColor: '#DCE1EA',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityDivider: {
    marginTop: 28,
    height: 1,
    backgroundColor: '#E7EBF2',
    marginHorizontal: -30,
  },
  monthRow: {
    marginTop: 34,
    paddingLeft: 56,
    flexDirection: 'row',
    gap: 48,
  },
  monthRowCompact: {
    marginTop: 24,
    paddingLeft: 36,
    gap: 28,
  },
  monthText: {
    fontSize: 18,
    lineHeight: 22,
    color: '#7B8597',
  },
  monthTextCompact: {
    fontSize: 15,
    lineHeight: 18,
  },
  gridWrap: {
    marginTop: 26,
    flexDirection: 'row',
    gap: 18,
  },
  gridWrapCompact: {
    marginTop: 18,
    gap: 12,
  },
  weekdayColumn: {
    paddingTop: 24,
    gap: 28,
  },
  weekdayColumnCompact: {
    paddingTop: 18,
    gap: 20,
  },
  weekdayText: {
    fontSize: 18,
    lineHeight: 22,
    color: '#7B8597',
  },
  weekdayTextCompact: {
    fontSize: 15,
    lineHeight: 18,
  },
  gridColumn: {
    gap: 8,
  },
  gridColumnCompact: {
    gap: 6,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 8,
  },
  gridRowCompact: {
    gap: 6,
  },
  gridDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#EBEFF5',
  },
  gridDotCompact: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  gridDotHighlight: {
    borderWidth: 3,
    borderColor: '#9AA5B7',
    backgroundColor: '#F7F9FC',
  },
  infoCard: {
    marginTop: 42,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 30,
    paddingTop: 28,
    paddingBottom: 30,
    shadowColor: '#AAB6D6',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
  },
  infoCardCompact: {
    marginTop: 30,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 22,
  },
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  infoDate: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
    color: '#1D212A',
    letterSpacing: -0.7,
  },
  infoDateCompact: {
    fontSize: 20,
    lineHeight: 24,
  },
  infoSubtitle: {
    marginTop: 2,
    fontSize: 18,
    lineHeight: 24,
    color: '#717B8E',
  },
  infoSubtitleCompact: {
    fontSize: 16,
    lineHeight: 20,
  },
  infoText: {
    marginTop: 36,
    fontSize: 24,
    lineHeight: 30,
    color: '#1D212A',
    letterSpacing: -0.5,
  },
  infoTextCompact: {
    marginTop: 24,
    fontSize: 20,
    lineHeight: 26,
  },
});
