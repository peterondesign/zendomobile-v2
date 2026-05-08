import { useEffect, useMemo, useRef, useState } from 'react';

import { Feather, Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppSidebar } from '../components/AppSidebar';
import { Theme } from '../theme';

type TasksViewScreenProps = {
  focusComposerVersion: number;
  theme: Theme;
  goalText: string;
  taskText: string;
  tasks: Array<{
    id: string;
    title: string;
    goalTitle: string;
    isCompleted: boolean;
    meta: string;
  }>;
  onBackToTaskEntry: () => void;
  onGoToChat: () => void;
  onGoToDayRing: () => void;
  onGoToGoal: () => void;
  onGoToSearch: () => void;
  onCreateTask: (title: string) => Promise<void> | void;
  onRenameTask: (taskId: string, title: string) => Promise<void> | void;
  onRemoveTask: (taskId: string) => Promise<void> | void;
  onArchiveTask: (taskId: string) => Promise<void> | void;
  onScheduleTask: (taskId: string, dueDateOnly: string | null) => Promise<void> | void;
  onToggleTaskCompleted: (taskId: string, completed: boolean) => Promise<void> | void;
  onReorderActiveTasks: (activeTaskIds: string[]) => Promise<void> | void;
  onToggleTheme: () => void;
};

type TaskMenuAction = 'move_up' | 'move_down' | 'rename' | 'toggle_complete' | 'schedule_today' | 'schedule_tomorrow' | 'clear_schedule' | 'archive' | 'delete';

function toLocalIsoDate(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function TasksViewScreen({
  focusComposerVersion,
  theme,
  goalText,
  taskText,
  tasks,
  onBackToTaskEntry,
  onGoToChat,
  onGoToDayRing,
  onGoToGoal,
  onGoToSearch,
  onCreateTask,
  onRenameTask,
  onRemoveTask,
  onArchiveTask,
  onScheduleTask,
  onToggleTaskCompleted,
  onReorderActiveTasks,
  onToggleTheme,
}: TasksViewScreenProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
  const [activeTaskMenuId, setActiveTaskMenuId] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(true);
  const [draft, setDraft] = useState('');
  const [renamingTaskId, setRenamingTaskId] = useState<string | null>(null);
  const [draftRenameText, setDraftRenameText] = useState('');
  const [orderedTasks, setOrderedTasks] = useState(tasks);
  const composerRef = useRef<TextInput | null>(null);
  const isDark = theme.logoMode === 'dark';
  const palette = {
    header: isDark ? 'rgba(18, 18, 18, 0.94)' : 'rgba(255,255,255,0.96)',
    headerBorder: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(207, 214, 227, 0.8)',
    headerButton: isDark ? '#222222' : '#FFFFFF',
    headerButtonBorder: isDark ? 'rgba(255,255,255,0.1)' : '#D2D8E3',
    headerText: isDark ? '#D4D4D4' : '#181A21',
    taskCard: isDark ? 'rgba(20, 20, 20, 0.94)' : 'rgba(255,255,255,0.94)',
    taskCardBorder: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(229, 233, 240, 0.95)',
    taskText: isDark ? '#D4D4D4' : '#1F232C',
    taskMuted: isDark ? '#959595' : '#7B8597',
    checkbox: isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF',
    checkboxBorder: isDark ? 'rgba(255,255,255,0.1)' : '#D3D9E5',
    chipBackground: isDark ? '#232323' : '#F4F6FA',
    chipBorder: isDark ? 'rgba(255,255,255,0.08)' : '#D9DEE8',
    chipText: isDark ? '#A0A0A0' : '#7D8596',
    menuButton: isDark ? '#222222' : '#F8F7F3',
    menuButtonBorder: isDark ? 'rgba(255,255,255,0.08)' : '#E0E4EB',
    menuPanel: isDark ? '#1A1A1A' : '#FFFFFF',
    menuPanelBorder: isDark ? 'rgba(255,255,255,0.08)' : '#EEF1F5',
    menuText: isDark ? '#D4D4D4' : '#1E222B',
    footer: isDark ? 'rgba(18, 18, 18, 0.94)' : 'rgba(255,255,255,0.96)',
    footerBorder: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(207, 214, 227, 0.8)',
    composer: isDark ? '#1A1A1A' : '#FFFFFF',
    composerBorder: isDark ? 'rgba(255,255,255,0.08)' : '#D8DEEA',
    input: isDark ? '#D4D4D4' : '#252A34',
    placeholder: isDark ? '#7E7E7E' : '#8A93A5',
    circle: isDark ? '#232323' : '#F7F6F1',
    circleBorder: isDark ? 'rgba(255,255,255,0.08)' : '#E3E1DA',
    circleActive: isDark ? 'rgba(106, 117, 255, 0.18)' : '#EEF1FF',
    circleActiveBorder: isDark ? 'rgba(106, 117, 255, 0.36)' : '#C9D2FF',
    sectionLabel: isDark ? '#6F7683' : '#7D8596',
    emptyText: isDark ? '#7E7E7E' : '#8A93A5',
    completedCardBorder: isDark ? 'rgba(52,199,89,0.28)' : 'rgba(52,199,89,0.32)',
    completedCardBackground: isDark ? 'rgba(20,28,22,0.94)' : 'rgba(245,255,248,0.96)',
  };
  const activeTasks = useMemo(() => orderedTasks.filter((task) => !task.isCompleted), [orderedTasks]);
  const completedTasks = useMemo(() => orderedTasks.filter((task) => task.isCompleted), [orderedTasks]);

  useEffect(() => {
    if (!focusComposerVersion) {
      return;
    }

    requestAnimationFrame(() => {
      composerRef.current?.focus();
    });
  }, [focusComposerVersion]);

  useEffect(() => {
    setOrderedTasks(tasks);
  }, [tasks]);

  function handleOpenSidebar() {
    setIsSidebarOpen(true);
    setIsHeaderMenuOpen(false);
    setActiveTaskMenuId(null);
  }

  function handleCloseSidebar() {
    setIsSidebarOpen(false);
  }

  function handleGoToDayRing() {
    setIsHeaderMenuOpen(false);
    requestAnimationFrame(() => {
      onGoToDayRing();
    });
  }

  const canSend = draft.trim().length > 0;

  async function handleCreateTaskFromComposer() {
    if (!canSend) {
      return;
    }

    const nextDraft = draft.trim();
    setDraft('');
    await onCreateTask(nextDraft);
  }

  function handleFocusComposer() {
    setIsSidebarOpen(false);
    requestAnimationFrame(() => {
      composerRef.current?.focus();
    });
  }

  async function handleTaskMenuAction(taskId: string, action: string) {
    const task = orderedTasks.find((item) => item.id === taskId);
    setActiveTaskMenuId(null);

    if (!task) {
      return;
    }

    if (action === 'rename') {
      setRenamingTaskId(task.id);
      setDraftRenameText(task.title);
      return;
    }

    if (action === 'delete') {
      await onRemoveTask(task.id);
      return;
    }

    if (action === 'archive') {
      await onArchiveTask(task.id);
      return;
    }

    if (action === 'schedule_today') {
      await onScheduleTask(task.id, toLocalIsoDate(0));
      return;
    }

    if (action === 'schedule_tomorrow') {
      await onScheduleTask(task.id, toLocalIsoDate(1));
      return;
    }

    if (action === 'clear_schedule') {
      await onScheduleTask(task.id, null);
      return;
    }

    if (action === 'move_up' || action === 'move_down') {
      const currentIndex = activeTasks.findIndex((item) => item.id === task.id);
      if (currentIndex === -1) {
        return;
      }

      const targetIndex = action === 'move_up' ? currentIndex - 1 : currentIndex + 1;
      if (targetIndex < 0 || targetIndex >= activeTasks.length) {
        return;
      }

      const nextActiveTasks = [...activeTasks];
      const [movedTask] = nextActiveTasks.splice(currentIndex, 1);
      nextActiveTasks.splice(targetIndex, 0, movedTask);

      const previousTasks = orderedTasks;
      const nextOrderedTasks = [...nextActiveTasks, ...completedTasks];
      setOrderedTasks(nextOrderedTasks);

      try {
        await onReorderActiveTasks(nextActiveTasks.map((item) => item.id));
      } catch {
        setOrderedTasks(previousTasks);
      }
      return;
    }

    await onToggleTaskCompleted(task.id, !task.isCompleted);
  }

  async function handleSaveRename() {
    if (!renamingTaskId) {
      return;
    }

    const text = draftRenameText.trim();
    if (!text) {
      return;
    }

    const id = renamingTaskId;
    setRenamingTaskId(null);
    setDraftRenameText('');
    await onRenameTask(id, text);
  }

  function handleCancelRename() {
    setRenamingTaskId(null);
    setDraftRenameText('');
  }

  function getTaskMenuItems(task: TasksViewScreenProps['tasks'][number]) {
    const activeIndex = activeTasks.findIndex((item) => item.id === task.id);
    const items: Array<{ action: TaskMenuAction; label: string; disabled?: boolean; tone?: 'normal' | 'danger' }> = [];

    if (!task.isCompleted) {
      items.push({ action: 'move_up', label: 'Move up', disabled: activeIndex <= 0 });
      items.push({ action: 'move_down', label: 'Move down', disabled: activeIndex === -1 || activeIndex >= activeTasks.length - 1 });
    }

    items.push({ action: 'rename', label: 'Rename' });
    items.push({ action: 'toggle_complete', label: task.isCompleted ? 'Mark Incomplete' : 'Mark Complete' });
    items.push({ action: 'schedule_today', label: 'Schedule for today' });
    items.push({ action: 'schedule_tomorrow', label: 'Schedule for tomorrow' });
    items.push({ action: 'clear_schedule', label: 'Clear schedule' });
    items.push({ action: 'archive', label: 'Archive' });
    items.push({ action: 'delete', label: 'Delete', tone: 'danger' });

    return items;
  }

  function renderTaskRow(task: TasksViewScreenProps['tasks'][number]) {
    const isCompleted = task.isCompleted;
    const isMenuOpen = activeTaskMenuId === task.id;
    const menuItems = getTaskMenuItems(task);

    return (
      <View
        key={task.id}
        style={[
          styles.taskCard,
          isMenuOpen && styles.taskCardRaised,
          {
            backgroundColor: isCompleted ? palette.completedCardBackground : palette.taskCard,
            borderColor: isCompleted ? palette.completedCardBorder : palette.taskCardBorder,
          },
        ]}
      >
        <View style={styles.taskRow}>
          <View style={styles.dragGrip}>
            <View style={[styles.dragDot, { backgroundColor: palette.taskMuted }]} />
            <View style={[styles.dragDot, { backgroundColor: palette.taskMuted }]} />
            <View style={[styles.dragDot, { backgroundColor: palette.taskMuted }]} />
          </View>

          <Pressable
            style={[
              styles.checkbox,
              { backgroundColor: palette.checkbox, borderColor: isCompleted ? '#34C759' : palette.checkboxBorder },
              isCompleted && styles.checkboxDone,
            ]}
            onPress={() => void onToggleTaskCompleted(task.id, !task.isCompleted)}
          >
            {isCompleted ? <Feather name="check" size={18} color="#FFFFFF" /> : null}
          </Pressable>

          <View style={styles.taskBody}>
            {renamingTaskId === task.id ? (
              <View style={styles.inlineRenameRow}>
                <TextInput
                  autoFocus
                  value={draftRenameText}
                  onChangeText={setDraftRenameText}
                  style={[styles.inlineRenameInput, { color: palette.taskText, borderBottomColor: '#4D63FF' }]}
                  onSubmitEditing={() => void handleSaveRename()}
                  returnKeyType="done"
                  selectTextOnFocus
                />
                <View style={styles.inlineRenameActions}>
                  <Pressable style={styles.inlineRenameCancel} onPress={handleCancelRename}>
                    <Text style={[styles.inlineRenameCancelText, { color: palette.taskMuted }]}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.inlineRenameSave, { backgroundColor: palette.circleActive, borderColor: palette.circleActiveBorder }]}
                    onPress={() => void handleSaveRename()}
                  >
                    <Text style={styles.inlineRenameSaveText}>Save</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <Text style={[styles.taskTitle, { color: palette.taskText }, isCompleted && styles.taskTitleDone]}>{task.title}</Text>
            )}

            {task.meta ? <Text style={[styles.taskSchedule, { color: palette.taskMuted }]}>{task.meta}</Text> : null}

            <View style={[styles.goalChip, { backgroundColor: palette.chipBackground, borderColor: palette.chipBorder }]}> 
              <Text style={[styles.goalChipText, { color: palette.chipText }]} numberOfLines={1}>
                {task.goalTitle || goalText.trim() || 'No goal'}
              </Text>
            </View>
          </View>

          <View style={[styles.menuAnchor, isMenuOpen && styles.menuAnchorRaised]}>
            <Pressable
              style={[styles.menuButton, { backgroundColor: palette.menuButton, borderColor: palette.menuButtonBorder }]}
              onPress={() => setActiveTaskMenuId((current) => (current === task.id ? null : task.id))}
            >
              <Feather name="more-vertical" size={22} color={palette.taskMuted} />
            </Pressable>

            {isMenuOpen ? (
              <View style={[styles.menuPanel, { backgroundColor: palette.menuPanel, borderColor: palette.menuPanelBorder }]}> 
                {menuItems.map((item, index) => (
                  <Pressable
                    key={item.action}
                    style={[
                      styles.menuItem,
                      index < menuItems.length - 1 && styles.menuItemBorder,
                      item.disabled && styles.menuItemDisabled,
                    ]}
                    onPress={() => {
                      if (item.disabled) {
                        return;
                      }
                      void handleTaskMenuAction(task.id, item.action);
                    }}
                    disabled={item.disabled}
                  >
                    <Text style={[
                      styles.menuItemText,
                      { color: item.tone === 'danger' ? '#EE5D5D' : palette.menuText },
                      item.disabled && styles.menuItemTextDisabled,
                    ]}>
                      {item.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { backgroundColor: palette.header, borderBottomColor: palette.headerBorder }]}> 
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Pressable style={[styles.headerIconButton, { backgroundColor: palette.headerButton, borderColor: palette.headerButtonBorder }]} onPress={handleOpenSidebar}>
              <View style={styles.stackIcon}>
                <View style={[styles.stackBar, { borderColor: palette.headerText }]} />
                <View style={[styles.stackBar, { borderColor: palette.headerText }]} />
              </View>
            </Pressable>
            <Text style={[styles.headerTitle, { color: palette.headerText }]}>Tasks</Text>
          </View>

          <View style={[styles.headerMenuAnchor, isHeaderMenuOpen && styles.headerMenuAnchorRaised]}>
            <Pressable style={[styles.headerIconButton, { backgroundColor: palette.headerButton, borderColor: palette.headerButtonBorder }]} onPress={() => setIsHeaderMenuOpen((current) => !current)}>
              <Feather name="more-horizontal" size={22} color={palette.headerText} />
            </Pressable>

            {isHeaderMenuOpen ? (
              <View style={[styles.headerMenuPanel, { backgroundColor: palette.menuPanel, borderColor: palette.menuPanelBorder }]}>
                <Pressable
                  style={styles.headerMenuItem}
                  onPress={handleGoToDayRing}
                >
                  <Text style={[styles.headerMenuItemText, { color: palette.menuText }]}>Day Ring View</Text>
                </Pressable>
                <Pressable
                  style={[styles.headerMenuItem, styles.headerMenuItemLast]}
                  onPress={() => {
                    setShowCompleted((current) => !current);
                    setIsHeaderMenuOpen(false);
                  }}
                >
                  <Text style={[styles.headerMenuItemText, { color: palette.menuText }]}>
                    {showCompleted ? 'Hide completed tasks' : 'Show completed tasks'}
                  </Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner} showsVerticalScrollIndicator={false}>
        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionTitle, { color: palette.sectionLabel }]}>Active</Text>
          {activeTasks.length > 0 ? activeTasks.map(renderTaskRow) : (
            <Text style={[styles.emptyStateText, { color: palette.emptyText }]}>
              {taskText.trim() ? `No active tasks. Last drafted task: ${taskText.trim()}` : 'No active tasks.'}
            </Text>
          )}
        </View>

        {showCompleted ? (
          <View style={styles.sectionBlock}>
            <Text style={[styles.sectionTitle, { color: palette.sectionLabel }]}>Completed</Text>
            {completedTasks.length > 0 ? completedTasks.map(renderTaskRow) : (
              <Text style={[styles.emptyStateText, { color: palette.emptyText }]}>No completed tasks yet.</Text>
            )}
          </View>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: palette.footer, borderTopColor: palette.footerBorder }]}> 
        <View style={[styles.composerWrap, { backgroundColor: palette.composer, borderColor: palette.composerBorder }]}> 
          <TextInput
            ref={composerRef}
            value={draft}
            onChangeText={setDraft}
            placeholder="Add task"
            placeholderTextColor={palette.placeholder}
            style={[styles.textInput, { color: palette.input }]}
          />

          <View style={styles.actionRow}>
            <Pressable style={[styles.circleButton, { backgroundColor: palette.circle, borderColor: palette.circleBorder }]}> 
              <Feather name="mic" size={22} color={palette.placeholder} />
            </Pressable>

            <Pressable style={[styles.circleButton, { backgroundColor: palette.circle, borderColor: palette.circleBorder }, canSend && styles.circleButtonActive, canSend && { backgroundColor: palette.circleActive, borderColor: palette.circleActiveBorder }]} onPress={handleCreateTaskFromComposer}>
              <Ionicons name="send-outline" size={22} color={canSend ? '#4D63FF' : '#B3B8C3'} />
            </Pressable>
          </View>
        </View>
      </View>

      <AppSidebar
        activeItem="tasks"
        onBack={() => {
          setIsSidebarOpen(false);
          onBackToTaskEntry();
        }}
        onClose={handleCloseSidebar}
        onSelectChat={() => {
          setIsSidebarOpen(false);
          onGoToChat();
        }}
        onSelectGoals={() => {
          setIsSidebarOpen(false);
          onGoToGoal();
        }}
        onSelectNewTask={handleFocusComposer}
        onSelectSearch={() => {
          setIsSidebarOpen(false);
          onGoToSearch();
        }}
        onSelectTasks={handleCloseSidebar}
        onToggleTheme={onToggleTheme}
        theme={theme}
        title="Tasks"
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
    zIndex: 40,
    elevation: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  headerMenuAnchor: {
    position: 'relative',
    zIndex: 60,
  },
  headerMenuAnchorRaised: {
    zIndex: 120,
  },
  headerMenuPanel: {
    position: 'absolute',
    top: 60,
    right: 0,
    minWidth: 220,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7EBF2',
    overflow: 'hidden',
    zIndex: 140,
    elevation: 30,
    shadowColor: '#09101D',
    shadowOpacity: 0.26,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 18 },
  },
  headerMenuItem: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(127, 138, 156, 0.18)',
  },
  headerMenuItemLast: {
    borderBottomWidth: 0,
  },
  headerMenuItemText: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
    color: '#1A1D24',
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
    paddingHorizontal: 18,
    paddingTop: 24,
    zIndex: 5,
  },
  contentInner: {
    paddingBottom: 140,
    gap: 22,
  },
  sectionBlock: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: 2,
  },
  emptyStateText: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '500',
    paddingHorizontal: 2,
  },
  taskCard: {
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderWidth: 1,
    borderColor: 'rgba(229, 233, 240, 0.95)',
    shadowColor: '#AAB6D6',
    shadowOpacity: 0.18,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 18 },
    paddingHorizontal: 18,
    paddingVertical: 20,
    marginBottom: 12,
    zIndex: 1,
  },
  taskCardRaised: {
    zIndex: 70,
    elevation: 18,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  dragGrip: {
    width: 18,
    paddingTop: 18,
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
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: '#D3D9E5',
    backgroundColor: '#FFFFFF',
    marginTop: 12,
  },
  checkboxDone: {
    backgroundColor: '#4650F4',
    borderColor: '#34C759',
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskBody: {
    flex: 1,
    paddingTop: 6,
    gap: 14,
  },
  taskTitle: {
    fontSize: 21,
    lineHeight: 25,
    fontWeight: '800',
    letterSpacing: -0.8,
    color: '#1F232C',
    maxWidth: 220,
  },
  taskTitleDone: {
    textDecorationLine: 'line-through',
    color: '#8F98A8',
  },
  taskSchedule: {
    fontSize: 14,
    lineHeight: 18,
    color: '#7B8597',
    letterSpacing: -0.2,
  },
  goalChip: {
    alignSelf: 'flex-start',
    maxWidth: 168,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D9DEE8',
    backgroundColor: '#F4F6FA',
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  goalChipText: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '500',
    color: '#7D8596',
  },
  menuAnchor: {
    position: 'relative',
    paddingTop: 6,
    zIndex: 20,
  },
  menuAnchorRaised: {
    zIndex: 90,
  },
  menuButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 1,
    borderColor: '#E0E4EB',
    backgroundColor: '#F8F7F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuPanel: {
    position: 'absolute',
    top: 64,
    right: -10,
    width: 220,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEF1F5',
    paddingVertical: 6,
    overflow: 'hidden',
    zIndex: 120,
    elevation: 28,
    shadowColor: '#09101D',
    shadowOpacity: 0.24,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 16 },
  },
  menuItem: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  menuItemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(127, 138, 156, 0.16)',
  },
  menuItemDisabled: {
    opacity: 0.45,
  },
  menuItemText: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
    color: '#1E222B',
    letterSpacing: -0.1,
  },
  menuItemTextDisabled: {
    color: '#8E97A8',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(207, 214, 227, 0.8)',
    zIndex: 50,
    elevation: 20,
  },
  composerWrap: {
    minHeight: 82,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D8DEEA',
    backgroundColor: '#FFFFFF',
    paddingLeft: 28,
    paddingRight: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 18,
    lineHeight: 22,
    color: '#252A34',
    paddingVertical: 16,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  circleButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F7F6F1',
    borderWidth: 1,
    borderColor: '#E3E1DA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleButtonActive: {
    backgroundColor: '#EEF1FF',
    borderColor: '#C9D2FF',
  },
  inlineRenameRow: {
    gap: 10,
  },
  inlineRenameInput: {
    fontSize: 21,
    lineHeight: 25,
    fontWeight: '800',
    letterSpacing: -0.8,
    borderBottomWidth: 2,
    paddingVertical: 2,
    paddingHorizontal: 0,
  },
  inlineRenameActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  inlineRenameCancel: {
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  inlineRenameCancelText: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600',
  },
  inlineRenameSave: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 999,
    borderWidth: 1,
  },
  inlineRenameSaveText: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
    color: '#4D63FF',
  },
});