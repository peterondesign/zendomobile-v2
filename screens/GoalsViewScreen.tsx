import { useState } from 'react';

import { Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';

import { AppSidebar } from '../components/AppSidebar';
import { Theme } from '../theme';

type GoalListItem = {
  id: string;
  title: string;
  status: 'Paused' | 'Active';
  taskCount: number;
  completedCount: number;
};

type GoalsViewScreenProps = {
  goals: GoalListItem[];
  theme: Theme;
  onBackToGoalEntry: () => void;
  onCreateNewGoal: (goalTitle: string) => void;
  onGoToChat: () => void;
  onGoToGoalDetail: (goalId: string) => void;
  onGoToNewTask: () => void;
  onGoToSearch: () => void;
  onGoToTasksView: () => void;
  onToggleTheme: () => void;
};

export function GoalsViewScreen({
  goals,
  theme,
  onBackToGoalEntry,
  onCreateNewGoal,
  onGoToChat,
  onGoToGoalDetail,
  onGoToNewTask,
  onGoToSearch,
  onGoToTasksView,
  onToggleTheme,
}: GoalsViewScreenProps) {
  const { height, width } = useWindowDimensions();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCreatingGoal, setIsCreatingGoal] = useState(false);
  const [draftGoalTitle, setDraftGoalTitle] = useState('');
  const isCompact = width <= 430 || height <= 860;
  const isDark = theme.logoMode === 'dark';
  const palette = {
    header: isDark ? 'rgba(18, 18, 18, 0.94)' : 'rgba(255,255,255,0.96)',
    headerBorder: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(207, 214, 227, 0.8)',
    headerButton: isDark ? '#222222' : '#FFFFFF',
    headerButtonBorder: isDark ? 'rgba(255,255,255,0.1)' : '#D2D8E3',
    headerText: isDark ? '#D4D4D4' : '#181A21',
    divider: isDark ? 'rgba(255,255,255,0.08)' : '#E7EBF2',
    goalTitle: isDark ? '#D4D4D4' : '#1B1F27',
    muted: isDark ? '#979797' : '#697487',
    dot: isDark ? '#4A4A4A' : '#D5DBE5',
    inputBackground: isDark ? '#1A1A1A' : '#FFFFFF',
    inputBorder: isDark ? 'rgba(255,255,255,0.08)' : '#DCE2EC',
    statusBackground: isDark ? '#232323' : '#E6E9EF',
    statusText: isDark ? '#A5A5A5' : '#768092',
    secondaryButton: isDark ? '#222222' : '#FFFFFF',
    secondaryButtonText: isDark ? '#A5A5A5' : '#697487',
  };

  function handleCreateGoal() {
    const nextTitle = draftGoalTitle.trim();

    if (!nextTitle) {
      return;
    }

    onCreateNewGoal(nextTitle);
    setDraftGoalTitle('');
    setIsCreatingGoal(false);
  }

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

      <View style={styles.content}>
        <Pressable
          style={[styles.newGoalButton, isCompact && styles.newGoalButtonCompact, { borderColor: palette.divider }]}
          onPress={() => setIsCreatingGoal(true)}
        >
          <Text style={[styles.newGoalText, isCompact && styles.newGoalTextCompact, { color: palette.muted }]}>+ New Goal</Text>
        </Pressable>

        {isCreatingGoal ? (
          <View style={[styles.createGoalPanel, isCompact && styles.createGoalPanelCompact]}>
            <TextInput
              value={draftGoalTitle}
              onChangeText={setDraftGoalTitle}
              placeholder="Name this goal"
              placeholderTextColor={palette.muted}
              style={[styles.createGoalInput, isCompact && styles.createGoalInputCompact, { borderColor: palette.inputBorder, backgroundColor: palette.inputBackground, color: palette.goalTitle }]}
            />

            <View style={styles.createGoalActions}>
              <Pressable style={styles.createGoalPrimaryAction} onPress={handleCreateGoal}>
                <Text style={styles.createGoalPrimaryActionText}>Add Goal</Text>
              </Pressable>

              <Pressable
                style={[styles.createGoalSecondaryAction, { borderColor: palette.inputBorder, backgroundColor: palette.secondaryButton }]}
                onPress={() => {
                  setDraftGoalTitle('');
                  setIsCreatingGoal(false);
                }}
              >
                <Text style={[styles.createGoalSecondaryActionText, { color: palette.secondaryButtonText }]}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        <ScrollView style={styles.goalList} contentContainerStyle={[styles.goalListContent, isCompact && styles.goalListCompact]} showsVerticalScrollIndicator={false}>
          {goals.map((goal) => {
            const dotCount = goal.taskCount > 0 ? Math.min(goal.taskCount, 7) : 7;
            const filledDots = goal.taskCount > 0 ? Math.round((goal.completedCount / goal.taskCount) * dotCount) : 0;
            return (
            <Pressable
              key={goal.id}
              style={[styles.goalRow, isCompact && styles.goalRowCompact, { borderTopColor: palette.divider }]}
              onPress={() => onGoToGoalDetail(goal.id)}
            >
              <View style={[styles.goalTextWrap, isCompact && styles.goalTextWrapCompact]}>
                <Text style={[styles.goalTitle, isCompact && styles.goalTitleCompact, { color: palette.goalTitle }]}>{goal.title}</Text>

                <View style={[styles.dotRow, isCompact && styles.dotRowCompact]}>
                  {Array.from({ length: dotCount }).map((_, index) => (
                    <View
                      key={`${goal.id}-${index}`}
                      style={[styles.progressDot, isCompact && styles.progressDotCompact, { backgroundColor: index < filledDots ? '#34C759' : palette.dot }]}
                    />
                  ))}
                </View>
              </View>

              <View style={[styles.statusPill, isCompact && styles.statusPillCompact, { backgroundColor: palette.statusBackground }, goal.status === 'Active' && styles.statusPillActive]}>
                <Text style={[styles.statusPillText, isCompact && styles.statusPillTextCompact, { color: palette.statusText }, goal.status === 'Active' && styles.statusPillTextActive]}>
                  {goal.status}
                </Text>
              </View>
            </Pressable>
            );
          })}
        </ScrollView>
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
        onSelectGoals={() => setIsSidebarOpen(false)}
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
    paddingTop: 62,
  },
  newGoalButtonCompact: {
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  newGoalButton: {
    alignSelf: 'flex-start',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#B3BCCB',
    borderStyle: 'dashed',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  newGoalText: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '500',
    color: '#697487',
    letterSpacing: -0.4,
  },
  newGoalTextCompact: {
    fontSize: 18,
    lineHeight: 22,
  },
  goalList: {
    flex: 1,
    marginTop: 54,
  },
  goalListContent: {
    paddingBottom: 24,
  },
  goalListCompact: {
    marginTop: 40,
  },
  createGoalPanel: {
    marginTop: 18,
    gap: 12,
  },
  createGoalPanelCompact: {
    marginTop: 14,
    gap: 10,
  },
  createGoalInput: {
    minHeight: 54,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#DCE2EC',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    fontSize: 18,
    lineHeight: 22,
    color: '#1D212A',
  },
  createGoalInputCompact: {
    minHeight: 48,
    borderRadius: 16,
    fontSize: 16,
    lineHeight: 20,
  },
  createGoalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  createGoalPrimaryAction: {
    borderRadius: 14,
    backgroundColor: '#4650F4',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  createGoalPrimaryActionText: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 18,
    fontWeight: '700',
  },
  createGoalSecondaryAction: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DCE2EC',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  createGoalSecondaryActionText: {
    color: '#697487',
    fontSize: 15,
    lineHeight: 18,
    fontWeight: '600',
  },
  goalRow: {
    minHeight: 126,
    borderTopWidth: 1,
    borderTopColor: '#E7EBF2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  goalRowCompact: {
    minHeight: 104,
  },
  goalTextWrap: {
    gap: 12,
    paddingRight: 18,
  },
  goalTextWrapCompact: {
    gap: 9,
    paddingRight: 12,
  },
  goalTitle: {
    fontSize: 29,
    lineHeight: 34,
    fontWeight: '800',
    color: '#1B1F27',
    letterSpacing: -1,
  },
  goalTitleCompact: {
    fontSize: 24,
    lineHeight: 29,
    letterSpacing: -0.8,
  },
  dotRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dotRowCompact: {
    gap: 6,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#D5DBE5',
  },
  progressDotCompact: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusPill: {
    borderRadius: 999,
    backgroundColor: '#E6E9EF',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  statusPillCompact: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statusPillActive: {
    backgroundColor: '#E9F6EE',
  },
  statusPillText: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '500',
    color: '#768092',
  },
  statusPillTextCompact: {
    fontSize: 16,
    lineHeight: 20,
  },
  statusPillTextActive: {
    color: '#3E8462',
  },
});
