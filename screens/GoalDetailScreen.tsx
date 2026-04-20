import { useState } from 'react';

import { Feather } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';

import { AppSidebar } from '../components/AppSidebar';
import { Theme } from '../theme';

type GoalDetailScreenProps = {
  goalTasks: Array<{
    id: string;
    title: string;
    meta: string;
    isCompleted: boolean;
  }>;
  goalStatus: 'Paused' | 'Active';
  goalTitle: string;
  theme: Theme;
  onBackToGoalEntry: () => void;
  onBackToGoals: () => void;
  onAddTask: (taskTitle: string) => void;
  onGoToChat: () => void;
  onGoToGoalHistory: () => void;
  onGoToNewTask: () => void;
  onGoToSearch: () => void;
  onGoToTasksView: () => void;
  onRenameGoal: (nextTitle: string) => void;
  onRenameTask: (taskId: string, nextTitle: string) => void;
  onRemoveTask: (taskId: string) => void;
  onToggleTaskCompleted: (taskId: string) => void;
  onToggleGoalStatus: () => void;
  onToggleTheme: () => void;
};

export function GoalDetailScreen({
  goalTasks,
  goalStatus,
  goalTitle,
  theme,
  onBackToGoalEntry,
  onBackToGoals,
  onAddTask,
  onGoToChat,
  onGoToGoalHistory,
  onGoToNewTask,
  onGoToSearch,
  onGoToTasksView,
  onRenameGoal,
  onRenameTask,
  onRemoveTask,
  onToggleTaskCompleted,
  onToggleGoalStatus,
  onToggleTheme,
}: GoalDetailScreenProps) {
  const { height, width } = useWindowDimensions();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isRenamingGoal, setIsRenamingGoal] = useState(false);
  const [draftGoalTitle, setDraftGoalTitle] = useState(goalTitle);
  const [draftTaskTitle, setDraftTaskTitle] = useState('');
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [activeTaskMenuId, setActiveTaskMenuId] = useState<string | null>(null);
  const [renamingTaskId, setRenamingTaskId] = useState<string | null>(null);
  const [draftTaskRename, setDraftTaskRename] = useState('');
  const isCompact = width <= 430 || height <= 860;
  const isDark = theme.logoMode === 'dark';
  const palette = {
    header: isDark ? 'rgba(18, 18, 18, 0.94)' : 'rgba(255,255,255,0.96)',
    headerBorder: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(207, 214, 227, 0.8)',
    headerButton: isDark ? '#222222' : '#FFFFFF',
    headerButtonBorder: isDark ? 'rgba(255,255,255,0.1)' : '#D2D8E3',
    headerText: isDark ? '#D4D4D4' : '#181A21',
    card: isDark ? 'rgba(20, 20, 20, 0.94)' : 'rgba(255,255,255,0.94)',
    cardBorder: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(229, 233, 240, 0.95)',
    taskCard: isDark ? '#1B1B1B' : '#FFFFFF',
    taskCardBorder: isDark ? 'rgba(255,255,255,0.08)' : '#E1E6EF',
    text: isDark ? '#D4D4D4' : '#1D212A',
    muted: isDark ? '#959595' : '#9AA4B4',
    chip: isDark ? '#232323' : '#FFFFFF',
    chipBorder: isDark ? 'rgba(255,255,255,0.08)' : '#D9DEE8',
  };

  function handleSaveGoalTitle() {
    const nextTitle = draftGoalTitle.trim();

    if (!nextTitle) {
      return;
    }

    onRenameGoal(nextTitle);
    setIsRenamingGoal(false);
  }

  function handleCreateTask() {
    const nextTitle = draftTaskTitle.trim();

    if (!nextTitle) {
      return;
    }

    onAddTask(nextTitle);
    setDraftTaskTitle('');
    setIsCreatingTask(false);
  }

  function handleStartTaskRename(taskId: string, currentTitle: string) {
    setActiveTaskMenuId(null);
    setRenamingTaskId(taskId);
    setDraftTaskRename(currentTitle);
  }

  function handleSaveTaskRename(taskId: string) {
    const nextTitle = draftTaskRename.trim();

    if (!nextTitle) {
      return;
    }

    onRenameTask(taskId, nextTitle);
    setRenamingTaskId(null);
    setDraftTaskRename('');
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

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, isCompact && styles.cardCompact, { backgroundColor: palette.card, borderColor: palette.cardBorder }]}>
          <View style={[styles.topActionRow, styles.topActionRowElevated]}>
            <Pressable style={[styles.backPill, isCompact && styles.backPillCompact]} onPress={onBackToGoals}>
              <Text style={[styles.backPillText, isCompact && styles.backPillTextCompact]}>Back to goals</Text>
            </Pressable>

            <View style={[styles.menuAnchor, styles.menuAnchorElevated]}>
              <Pressable style={[styles.moreButton, { backgroundColor: palette.headerButton, borderColor: palette.headerButtonBorder }]} onPress={() => setIsMenuOpen((current) => !current)}>
                <Feather name="more-horizontal" size={24} color={palette.headerText} />
              </Pressable>

              {isMenuOpen ? (
                <View style={[styles.menuPanel, styles.menuPanelElevated]}>
                  <Pressable
                    style={styles.menuItem}
                    onPress={() => {
                      setDraftGoalTitle(goalTitle);
                      setIsRenamingGoal(true);
                      setIsMenuOpen(false);
                    }}
                  >
                    <Text style={styles.menuItemText}>Rename Goal</Text>
                  </Pressable>

                  <Pressable
                    style={styles.menuItem}
                    onPress={() => {
                      setIsMenuOpen(false);
                      onGoToGoalHistory();
                    }}
                  >
                    <Text style={styles.menuItemText}>View Goal History</Text>
                  </Pressable>

                  <Pressable
                    style={styles.menuItem}
                    onPress={() => {
                      setIsMenuOpen(false);
                      onToggleGoalStatus();
                    }}
                  >
                    <Text style={styles.menuItemText}>{goalStatus === 'Paused' ? 'Resume Goal' : 'Pause Goal'}</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          </View>

          <Text style={[styles.goalTitle, isCompact && styles.goalTitleCompact, { color: palette.text }]}>{goalTitle}</Text>

          {isRenamingGoal ? (
            <View style={styles.renameRow}>
              <TextInput
                value={draftGoalTitle}
                onChangeText={setDraftGoalTitle}
                placeholder="Rename goal"
                style={styles.renameInput}
                placeholderTextColor="#9AA4B4"
              />

              <Pressable style={styles.renameAction} onPress={handleSaveGoalTitle}>
                <Text style={styles.renameActionText}>Save</Text>
              </Pressable>

              <Pressable style={styles.renameActionSecondary} onPress={() => setIsRenamingGoal(false)}>
                <Text style={styles.renameActionSecondaryText}>Cancel</Text>
              </Pressable>
            </View>
          ) : null}

          <View style={[styles.dotRow, isCompact && styles.dotRowCompact]}>
            {Array.from({ length: 7 }).map((_, index) => (
              <View key={`detail-dot-${index}`} style={[styles.progressDot, isCompact && styles.progressDotCompact]} />
            ))}
          </View>

          <View style={[styles.goalStatusPill, goalStatus === 'Active' && styles.goalStatusPillActive]}>
            <Text style={[styles.goalStatusText, goalStatus === 'Active' && styles.goalStatusTextActive]}>{goalStatus}</Text>
          </View>

          <View style={styles.divider} />

          <Pressable
            style={[styles.addTaskPill, isCompact && styles.addTaskPillCompact]}
            onPress={() => setIsCreatingTask(true)}
          >
            <Text style={[styles.addTaskPillText, isCompact && styles.addTaskPillTextCompact]}>+ Add a task for {goalTitle}</Text>
          </Pressable>

          {isCreatingTask ? (
            <View style={styles.renameRow}>
              <TextInput
                value={draftTaskTitle}
                onChangeText={setDraftTaskTitle}
                placeholder="Add a task"
                style={styles.renameInput}
                placeholderTextColor="#9AA4B4"
              />

              <Pressable style={styles.renameAction} onPress={handleCreateTask}>
                <Text style={styles.renameActionText}>Add Task</Text>
              </Pressable>

              <Pressable
                style={styles.renameActionSecondary}
                onPress={() => {
                  setDraftTaskTitle('');
                  setIsCreatingTask(false);
                }}
              >
                <Text style={styles.renameActionSecondaryText}>Cancel</Text>
              </Pressable>
            </View>
          ) : null}

          <View style={[styles.taskList, isCompact && styles.taskListCompact]}>
            {goalTasks.map((task) => (
              <View key={task.id} style={[styles.taskCard, isCompact && styles.taskCardCompact, { backgroundColor: palette.taskCard, borderColor: palette.taskCardBorder }]}>
                <View style={styles.taskRow}>
                  <View style={styles.dragGrip}>
                    <View style={styles.dragDot} />
                    <View style={styles.dragDot} />
                    <View style={styles.dragDot} />
                  </View>

                  <Pressable style={[styles.checkbox, task.isCompleted && styles.checkboxCompleted]} onPress={() => onToggleTaskCompleted(task.id)}>
                    {task.isCompleted ? <Feather name="check" size={18} color="#FFFFFF" /> : null}
                  </Pressable>

                  <View style={styles.taskBody}>
                    {renamingTaskId === task.id ? (
                      <View style={styles.taskRenameWrap}>
                        <TextInput
                          value={draftTaskRename}
                          onChangeText={setDraftTaskRename}
                          placeholder="Rename task"
                          placeholderTextColor="#9AA4B4"
                          style={styles.taskRenameInput}
                        />

                        <View style={styles.taskRenameActions}>
                          <Pressable style={styles.taskRenamePrimary} onPress={() => handleSaveTaskRename(task.id)}>
                            <Text style={styles.taskRenamePrimaryText}>Save</Text>
                          </Pressable>

                          <Pressable
                            style={styles.taskRenameSecondary}
                            onPress={() => {
                              setRenamingTaskId(null);
                              setDraftTaskRename('');
                            }}
                          >
                            <Text style={styles.taskRenameSecondaryText}>Cancel</Text>
                          </Pressable>
                        </View>
                      </View>
                    ) : (
                      <Text style={[styles.taskTitle, isCompact && styles.taskTitleCompact, { color: palette.text }, task.isCompleted && styles.taskTitleCompleted]}>{task.title}</Text>
                    )}

                    <View style={styles.metaRow}>
                      {task.meta ? <Text style={[styles.taskMeta, isCompact && styles.taskMetaCompact, { color: palette.muted }]}>{task.meta}</Text> : null}
                      <View style={[styles.goalChip, { backgroundColor: palette.chip, borderColor: palette.chipBorder }]}>
                        <View style={styles.goalChipDot} />
                        <Text style={[styles.goalChipText, isCompact && styles.goalChipTextCompact, { color: palette.muted }]}>{goalTitle}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.taskMenuAnchor}>
                    <Pressable style={styles.taskMoreButton} onPress={() => setActiveTaskMenuId((current) => (current === task.id ? null : task.id))}>
                    <Feather name="more-vertical" size={20} color="#9AA4B4" />
                    </Pressable>

                    {activeTaskMenuId === task.id ? (
                      <View style={styles.taskMenuPanel}>
                        <Pressable style={styles.taskMenuItem} onPress={() => handleStartTaskRename(task.id, task.title)}>
                          <Text style={styles.taskMenuItemText}>Rename Task</Text>
                        </Pressable>

                        <Pressable style={styles.taskMenuItem} onPress={() => {
                          setActiveTaskMenuId(null);
                          onToggleTaskCompleted(task.id);
                        }}>
                          <Text style={styles.taskMenuItemText}>{task.isCompleted ? 'Mark Incomplete' : 'Mark Complete'}</Text>
                        </Pressable>

                        <Pressable style={styles.taskMenuItem} onPress={() => {
                          setActiveTaskMenuId(null);
                          onRemoveTask(task.id);
                        }}>
                          <Text style={styles.taskMenuItemText}>Delete Task</Text>
                        </Pressable>
                      </View>
                    ) : null}
                  </View>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.userBadge}>
            <Text style={styles.userBadgeText}>N</Text>
          </View>
        </View>
      </ScrollView>

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
          onBackToGoals();
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
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 6,
    paddingBottom: 26,
  },
  card: {
    borderRadius: 38,
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderWidth: 1,
    borderColor: 'rgba(229, 233, 240, 0.95)',
    paddingHorizontal: 30,
    paddingTop: 32,
    paddingBottom: 88,
    shadowColor: '#AAB6D6',
    shadowOpacity: 0.16,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 18 },
  },
  cardCompact: {
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 72,
  },
  topActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topActionRowElevated: {
    zIndex: 50,
    elevation: 20,
  },
  backPill: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D9DEE8',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  backPillCompact: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  backPillText: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '500',
    color: '#2C313B',
  },
  backPillTextCompact: {
    fontSize: 16,
    lineHeight: 20,
  },
  menuAnchor: {
    position: 'relative',
  },
  menuAnchorElevated: {
    zIndex: 60,
    elevation: 24,
  },
  moreButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 1,
    borderColor: '#E0E5EE',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuPanel: {
    position: 'absolute',
    top: 68,
    right: 0,
    width: 320,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEF1F5',
    paddingVertical: 20,
    shadowColor: '#AAB6D6',
    shadowOpacity: 0.16,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 16 },
    zIndex: 80,
    elevation: 30,
  },
  menuPanelElevated: {
    zIndex: 80,
    elevation: 30,
  },
  menuItem: {
    paddingHorizontal: 30,
    paddingVertical: 16,
  },
  menuItemText: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '400',
    color: '#1E222B',
    letterSpacing: -0.4,
  },
  goalTitle: {
    marginTop: 28,
    fontSize: 39,
    lineHeight: 44,
    fontWeight: '800',
    color: '#191C24',
    letterSpacing: -1.4,
  },
  goalTitleCompact: {
    marginTop: 22,
    fontSize: 30,
    lineHeight: 35,
    letterSpacing: -1,
  },
  renameRow: {
    marginTop: 16,
    gap: 10,
  },
  renameInput: {
    minHeight: 52,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#DCE2EC',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    fontSize: 18,
    lineHeight: 22,
    color: '#1D212A',
  },
  renameAction: {
    alignSelf: 'flex-start',
    borderRadius: 14,
    backgroundColor: '#4650F4',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  renameActionText: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 18,
    fontWeight: '700',
  },
  renameActionSecondary: {
    alignSelf: 'flex-start',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DCE2EC',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
  },
  renameActionSecondaryText: {
    color: '#697487',
    fontSize: 15,
    lineHeight: 18,
    fontWeight: '600',
  },
  dotRow: {
    marginTop: 14,
    flexDirection: 'row',
    gap: 8,
  },
  dotRowCompact: {
    marginTop: 12,
    gap: 6,
  },
  progressDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#D6DCE6',
  },
  progressDotCompact: {
    width: 11,
    height: 11,
    borderRadius: 6,
  },
  goalStatusPill: {
    marginTop: 16,
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: '#E6E9EF',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  goalStatusPillActive: {
    backgroundColor: '#E9F6EE',
  },
  goalStatusText: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '600',
    color: '#768092',
  },
  goalStatusTextActive: {
    color: '#3E8462',
  },
  divider: {
    marginTop: 28,
    height: 1,
    backgroundColor: '#E8ECF3',
  },
  addTaskPill: {
    marginTop: 22,
    minHeight: 68,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#DCE2EC',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  addTaskPillCompact: {
    minHeight: 58,
    borderRadius: 20,
    paddingHorizontal: 18,
  },
  addTaskPillText: {
    fontSize: 24,
    lineHeight: 30,
    color: '#A1A9B9',
    letterSpacing: -0.5,
  },
  addTaskPillTextCompact: {
    fontSize: 18,
    lineHeight: 24,
  },
  taskList: {
    marginTop: 40,
    gap: 22,
  },
  taskListCompact: {
    marginTop: 26,
    gap: 16,
  },
  taskCard: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#E1E6EF',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  taskCardCompact: {
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  dragGrip: {
    width: 18,
    alignItems: 'center',
    gap: 4,
  },
  dragDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#B6BECF',
  },
  checkbox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#D5DBE5',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxCompleted: {
    backgroundColor: '#4650F4',
    borderColor: '#4650F4',
  },
  taskBody: {
    flex: 1,
    gap: 8,
  },
  taskRenameWrap: {
    gap: 8,
  },
  taskRenameInput: {
    minHeight: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DCE2EC',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    fontSize: 17,
    lineHeight: 21,
    color: '#1D212A',
  },
  taskRenameActions: {
    flexDirection: 'row',
    gap: 8,
  },
  taskRenamePrimary: {
    borderRadius: 12,
    backgroundColor: '#4650F4',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  taskRenamePrimaryText: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 16,
    fontWeight: '700',
  },
  taskRenameSecondary: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DCE2EC',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  taskRenameSecondaryText: {
    color: '#697487',
    fontSize: 14,
    lineHeight: 16,
    fontWeight: '600',
  },
  taskTitle: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '800',
    color: '#1D212A',
    letterSpacing: -0.8,
  },
  taskTitleCompleted: {
    color: '#96A0B1',
    textDecorationLine: 'line-through',
  },
  taskTitleCompact: {
    fontSize: 22,
    lineHeight: 26,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  taskMeta: {
    fontSize: 17,
    lineHeight: 22,
    color: '#9AA4B4',
    letterSpacing: -0.2,
  },
  taskMetaCompact: {
    fontSize: 14,
    lineHeight: 18,
  },
  goalChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D9DEE8',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  goalChipDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4685FF',
  },
  goalChipText: {
    fontSize: 16,
    lineHeight: 20,
    color: '#677386',
  },
  goalChipTextCompact: {
    fontSize: 14,
    lineHeight: 18,
  },
  taskMoreButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1,
    borderColor: '#E1E6EF',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFBFD',
  },
  taskMenuAnchor: {
    position: 'relative',
  },
  taskMenuPanel: {
    position: 'absolute',
    top: 62,
    right: 0,
    width: 180,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEF1F5',
    paddingVertical: 10,
    shadowColor: '#AAB6D6',
    shadowOpacity: 0.16,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    zIndex: 20,
  },
  taskMenuItem: {
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  taskMenuItemText: {
    fontSize: 16,
    lineHeight: 20,
    color: '#1E222B',
  },
  userBadge: {
    position: 'absolute',
    left: 0,
    bottom: 18,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#202229',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userBadgeText: {
    fontSize: 24,
    lineHeight: 28,
    color: '#FFFFFF',
  },
});
