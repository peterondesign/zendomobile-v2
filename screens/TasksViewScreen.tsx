import { useEffect, useRef, useState } from 'react';

import { Feather, Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppSidebar } from '../components/AppSidebar';
import { Theme } from '../theme';

type TasksViewScreenProps = {
  focusComposerVersion: number;
  theme: Theme;
  goalText: string;
  taskText: string;
  onBackToTaskEntry: () => void;
  onGoToChat: () => void;
  onGoToDayRing: () => void;
  onGoToGoal: () => void;
  onGoToSearch: () => void;
  onToggleTheme: () => void;
};

const menuItems = ['Schedule', 'Change goal', 'Rename', 'More'];

export function TasksViewScreen({
  focusComposerVersion,
  theme,
  goalText,
  taskText,
  onBackToTaskEntry,
  onGoToChat,
  onGoToDayRing,
  onGoToGoal,
  onGoToSearch,
  onToggleTheme,
}: TasksViewScreenProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [displayTaskText, setDisplayTaskText] = useState(taskText.trim() || 'Research potential investors in your industry');
  const [displayGoalText, setDisplayGoalText] = useState(goalText.trim() || 'Find investor for my startup');
  const [scheduledLabel, setScheduledLabel] = useState<string | null>(null);
  const [isTaskDone, setIsTaskDone] = useState(false);
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
  };

  useEffect(() => {
    if (!focusComposerVersion) {
      return;
    }

    requestAnimationFrame(() => {
      composerRef.current?.focus();
    });
  }, [focusComposerVersion]);

  function handleOpenSidebar() {
    setIsSidebarOpen(true);
    setIsMenuOpen(false);
    setIsHeaderMenuOpen(false);
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

  function handleCreateTaskFromComposer() {
    if (!canSend) {
      return;
    }

    setDisplayTaskText(draft.trim());
    setDraft('');
    setIsTaskDone(false);
  }

  function handleFocusComposer() {
    setIsSidebarOpen(false);
    requestAnimationFrame(() => {
      composerRef.current?.focus();
    });
  }

  function handleTaskMenuAction(action: string) {
    setIsMenuOpen(false);

    if (action === 'Schedule') {
      setScheduledLabel((current) => (current ? null : 'Sun, 22 Feb · 14:00'));
      return;
    }

    if (action === 'Change goal') {
      onGoToGoal();
      return;
    }

    if (action === 'Rename') {
      setDisplayTaskText((current) => (current.endsWith(' - updated') ? current.replace(' - updated', '') : `${current} - updated`));
      return;
    }

    setIsTaskDone((current) => !current);
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

          <View style={styles.headerMenuAnchor}>
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
              </View>
            ) : null}
          </View>
        </View>
      </View>

      <View style={styles.content}>
        <View style={[styles.taskCard, { backgroundColor: palette.taskCard, borderColor: palette.taskCardBorder }]}> 
          <View style={[styles.taskRow, styles.taskRowElevated]}>
            <View style={styles.dragGrip}>
              <View style={[styles.dragDot, { backgroundColor: palette.taskMuted }]} />
              <View style={[styles.dragDot, { backgroundColor: palette.taskMuted }]} />
              <View style={[styles.dragDot, { backgroundColor: palette.taskMuted }]} />
            </View>

            <View style={[styles.checkbox, { backgroundColor: palette.checkbox, borderColor: palette.checkboxBorder }, isTaskDone && styles.checkboxDone]} />

            <View style={styles.taskBody}>
              <Text style={[styles.taskTitle, { color: palette.taskText }, isTaskDone && styles.taskTitleDone]}>{displayTaskText}</Text>

              {scheduledLabel ? <Text style={[styles.taskSchedule, { color: palette.taskMuted }]}>{scheduledLabel}</Text> : null}

              <View style={[styles.goalChip, { backgroundColor: palette.chipBackground, borderColor: palette.chipBorder }]}>
                <Text style={[styles.goalChipText, { color: palette.chipText }]} numberOfLines={1}>
                  {displayGoalText}
                </Text>
              </View>
            </View>

            <View style={styles.menuAnchor}>
              <Pressable style={[styles.menuButton, { backgroundColor: palette.menuButton, borderColor: palette.menuButtonBorder }]} onPress={() => setIsMenuOpen((current) => !current)}>
                <Feather name="more-vertical" size={22} color={palette.taskMuted} />
              </Pressable>

              {isMenuOpen ? (
                <View style={[styles.menuPanel, { backgroundColor: palette.menuPanel, borderColor: palette.menuPanelBorder }]}>
                  {menuItems.map((item) => (
                    <Pressable key={item} style={styles.menuItem} onPress={() => handleTaskMenuAction(item)}>
                      <Text style={[styles.menuItemText, { color: palette.menuText }]}>{item}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </View>
          </View>
        </View>
      </View>

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
  },
  headerMenuPanel: {
    position: 'absolute',
    top: 60,
    right: 0,
    minWidth: 172,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7EBF2',
    zIndex: 20,
    elevation: 8,
    shadowColor: '#AFB9CB',
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  headerMenuItem: {
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  headerMenuItemText: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '500',
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
    paddingTop: 80,
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
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  taskRowElevated: {
    zIndex: 2,
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
    borderColor: '#4650F4',
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
    width: 190,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEF1F5',
    paddingVertical: 10,
    shadowColor: '#AAB6D6',
    shadowOpacity: 0.16,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 16 },
  },
  menuItem: {
    paddingHorizontal: 30,
    paddingVertical: 17,
  },
  menuItemText: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '400',
    color: '#1E222B',
    letterSpacing: -0.3,
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
});