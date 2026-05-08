import { useEffect, useMemo, useRef, useState } from 'react';

import { Feather, Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AppSidebar } from '../components/AppSidebar';
import { Theme } from '../theme';

type GoalPromptItem = {
  goalId: string;
  goalTitle: string;
  phrase: string;
  action: string;
};

type EveningGoalItem = {
  goalId: string;
  goalTitle: string;
  action: string;
  suggestions: string[];
};

type GoalProgressItem = {
  goalId: string;
  goalTitle: string;
  status: string;
  summary?: string;
};

type GoalSnapItem = {
  id: string;
  title: string;
  status: string;
  tasks: { id: string; title: string; isCompleted: boolean }[];
};

type ChatMessage = {
  id: string;
  role: 'ai' | 'user';
  kind: 'text' | 'summary' | 'checkin' | 'event' | 'morning' | 'evening' | 'progress';
  text?: string;
  goal?: string;
  task?: string;
  goals?: GoalSnapItem[];
  promptGoals?: GoalPromptItem[];
  eveningGoals?: EveningGoalItem[];
  progressGoals?: GoalProgressItem[];
  eventAction?: string;
  eventTitle?: string;
  sentAt?: Date;
  status?: 'sent' | 'delivered' | 'read';
};

type ChatSection = {
  key: string;
  title: string;
  date: Date;
  data: ChatMessage[];
};

type ChatScreenProps = {
  theme: Theme;
  goalText: string;
  taskText: string;
  goals?: GoalSnapItem[];
  messages: Array<{
    id: string;
    content: string;
    sender: string;
    created_at?: string;
  }>;
  isSending?: boolean;
  onBack: () => void;
  onGoToGoal: () => void;
  onGoToNewTask: () => void;
  onGoToSearch: () => void;
  onSendMessage: (content: string) => Promise<void> | void;
  onCreateGoalTask: (goalId: string, title: string) => Promise<void>;
  onCompleteGoalTask: (goalId: string, title: string) => Promise<void>;
  onGoToTasksView: () => void;
  onToggleTheme: () => void;
};

const waveformHeights = [8, 14, 20, 12, 18, 24, 16, 10, 18, 12, 22, 14];

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function subDays(daysAgo: number) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() - daysAgo);
  return date;
}

function createMessageDate(daysAgo: number, hour: number, minute: number) {
  const date = subDays(daysAgo);
  date.setHours(hour, minute, 0, 0);
  return date;
}

function formatMessageTime(date?: Date) {
  if (!date) {
    return '';
  }

  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getSectionTitle(date: Date) {
  const today = startOfDay(new Date());
  const target = startOfDay(date);
  const diffDays = Math.floor((today.getTime() - target.getTime()) / 86400000);

  if (diffDays === 0) {
    return 'Today';
  }

  if (diffDays === 1) {
    return 'Yesterday';
  }

  if (diffDays < 7) {
    return target.toLocaleDateString('en-US', { weekday: 'long' });
  }

  const weekday = target.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
  const month = target.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();

  return `${weekday} ${target.getDate()} ${month}`;
}

function buildSections(messages: ChatScreenProps['messages'], goalText: string, taskText: string, goals?: GoalSnapItem[]): ChatSection[] {
  const grouped = new Map<string, ChatSection>();
  const sortedMessages = [...messages].sort((left, right) => {
    const leftDate = new Date(left.created_at ?? 0).getTime();
    const rightDate = new Date(right.created_at ?? 0).getTime();
    return leftDate - rightDate;
  });

  for (const message of sortedMessages) {
    const date = message.created_at ? new Date(message.created_at) : new Date();
    const title = getSectionTitle(date);
    const key = `${title}-${date.toISOString().slice(0, 10)}`;

    let parsed: Record<string, string> | null = null;
    try {
      const trimmed = message.content.trim();
      if (trimmed.startsWith('{')) {
        parsed = JSON.parse(trimmed);
      }
    } catch {
      // not JSON, treat as plain text
    }

    const isUserAction = parsed?.kind === 'user_action';
    const isMorningPrompt = parsed?.kind === 'morning_prompt';
    const isEveningFollowUp = parsed?.kind === 'evening_follow_up';
    const isProgressSnapshot = parsed?.kind === 'goal_progress_snapshot';

    let normalizedMessage: ChatMessage;
    if (isUserAction) {
      normalizedMessage = {
        id: message.id,
        role: 'ai',
        kind: 'event',
        eventAction: (parsed as Record<string, string>)?.action,
        eventTitle: (parsed as Record<string, string>)?.goalTitle ?? (parsed as Record<string, string>)?.taskTitle ?? (parsed as Record<string, string>)?.text,
        sentAt: date,
      };
    } else if (isMorningPrompt) {
      const rawGoals = (parsed as Record<string, unknown>)?.goals;
      normalizedMessage = {
        id: message.id,
        role: 'ai',
        kind: 'morning',
        promptGoals: Array.isArray(rawGoals) ? (rawGoals as GoalPromptItem[]) : [],
        sentAt: date,
      };
    } else if (isEveningFollowUp) {
      const rawGoals = (parsed as Record<string, unknown>)?.goals;
      normalizedMessage = {
        id: message.id,
        role: 'ai',
        kind: 'evening',
        eveningGoals: Array.isArray(rawGoals) ? (rawGoals as EveningGoalItem[]) : [],
        sentAt: date,
      };
    } else if (isProgressSnapshot) {
      const rawGoals = (parsed as Record<string, unknown>)?.goals;
      normalizedMessage = {
        id: message.id,
        role: 'ai',
        kind: 'progress',
        progressGoals: Array.isArray(rawGoals) ? (rawGoals as GoalProgressItem[]) : [],
        sentAt: date,
      };
    } else {
      normalizedMessage = {
        id: message.id,
        role: message.sender === 'user' ? 'user' : 'ai',
        kind: 'text',
        text: message.content,
        sentAt: date,
        status: message.sender === 'user' ? 'delivered' : undefined,
      };
    }

    if (!grouped.has(key)) {
      grouped.set(key, {
        key,
        title,
        date,
        data: [normalizedMessage],
      });
      continue;
    }

    grouped.get(key)?.data.push(normalizedMessage);
  }

  const sections = Array.from(grouped.values()).sort((left, right) => left.date.getTime() - right.date.getTime());

  if (sections.length > 0) {
    return sections;
  }

  if (goals && goals.length > 0) {
    return [
      {
        key: 'today-checkin',
        title: 'Today',
        date: subDays(0),
        data: [
          {
            id: 'today-checkin',
            role: 'ai' as const,
            kind: 'checkin' as const,
            goals,
          },
        ],
      },
    ];
  }

  return [
    {
      key: 'today-summary',
      title: 'Today',
      date: subDays(0),
      data: [
        {
          id: 'today-summary',
          role: 'ai' as const,
          kind: 'summary' as const,
          goal: goalText,
          task: taskText,
        },
      ],
    },
  ];
}

export function ChatScreen({ theme, goalText, taskText, goals, messages, isSending = false, onBack, onGoToGoal, onGoToNewTask, onGoToSearch, onSendMessage, onCreateGoalTask, onCompleteGoalTask, onGoToTasksView, onToggleTheme }: ChatScreenProps) {
  const [draft, setDraft] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptPreview, setTranscriptPreview] = useState('');
  const [hasError, setHasError] = useState(false);
  const [taskDrafts, setTaskDrafts] = useState<Record<string, string>>({});
  // chipKey = `${goalId}::${title}` → 'loading' | 'done' | 'error'
  const [chipStates, setChipStates] = useState<Record<string, 'loading' | 'done' | 'error'>>({});
  const listRef = useRef<SectionList<ChatMessage, ChatSection> | null>(null);
  const isInitialRender = useRef(true);
  const sections = useMemo(() => buildSections(messages, goalText, taskText, goals), [goalText, goals, messages, taskText]);
  const isDark = theme.logoMode === 'dark';
  const palette = {
    header: isDark ? 'rgba(18, 18, 18, 0.94)' : 'rgba(255,255,255,0.96)',
    headerBorder: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(207, 214, 227, 0.8)',
    headerButton: isDark ? '#222222' : '#FFFFFF',
    headerButtonBorder: isDark ? 'rgba(255,255,255,0.1)' : '#D2D8E3',
    headerText: isDark ? '#D4D4D4' : '#181A21',
    badgeBorder: isDark ? '#141414' : '#FFFFFF',
    sectionPill: isDark ? '#1E1E1E' : 'rgba(255,255,255,0.95)',
    sectionPillBorder: isDark ? 'rgba(255,255,255,0.08)' : '#D2D8E3',
    sectionText: isDark ? '#8C8C8C' : '#7A8498',
    aiBubble: isDark ? '#1D1D1D' : 'rgba(255,255,255,0.82)',
    aiText: isDark ? '#D4D4D4' : '#1C2028',
    aiMeta: isDark ? '#737373' : '#7E889A',
    summaryText: isDark ? '#D4D4D4' : '#22252C',
    summaryMuted: isDark ? '#8F8F8F' : '#6E778B',
    summaryValue: isDark ? '#B3B3B3' : '#70798B',
    summaryUnderline: isDark ? '#4A4A4A' : '#98A0B1',
    footer: isDark ? 'rgba(18, 18, 18, 0.94)' : 'rgba(255,255,255,0.96)',
    footerBorder: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(207, 214, 227, 0.8)',
    composer: isDark ? '#1A1A1A' : '#FFFFFF',
    composerBorder: isDark ? 'rgba(255,255,255,0.08)' : '#D8DEEA',
    input: isDark ? '#D4D4D4' : '#252A34',
    inputPlaceholder: isDark ? '#7E7E7E' : '#7A8498',
    circle: isDark ? '#232323' : 'transparent',
    circleIcon: isDark ? '#8E8E8E' : '#70798B',
    waveformLabel: isDark ? '#8E8E8E' : '#6E778B',
  };

  const hasDraft = draft.trim().length > 0;

  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }

    const lastSectionIndex = sections.length - 1;
    const latestSection = sections[lastSectionIndex];

    if (!latestSection) {
      return;
    }

    requestAnimationFrame(() => {
      listRef.current?.scrollToLocation({
        sectionIndex: lastSectionIndex,
        itemIndex: Math.max(latestSection.data.length - 1, 0),
        viewPosition: 1,
        animated: true,
      });
    });
  }, [sections]);

  async function handleSend() {
    if (!hasDraft) {
      return;
    }

    const nextDraft = draft.trim();

    try {
      await onSendMessage(nextDraft);
      setDraft('');
      setHasError(false);
    } catch {
      setHasError(true);
    }
  }

  function handleStartTranscribing() {
    setIsTranscribing(true);
    setTranscriptPreview('');
    setHasError(false);
  }

  function handleCancelTranscribing() {
    setIsTranscribing(false);
    setTranscriptPreview('');
    setHasError(false);
  }

  function handleDoneTranscribing() {
    if (!transcriptPreview.trim()) {
      setHasError(true);
      return;
    }

    setDraft(transcriptPreview.trim());
    setTranscriptPreview('');
    setIsTranscribing(false);
    setHasError(false);
  }

  function handleWaveformTap() {
    setTranscriptPreview('Can you help me sequence my investor outreach for this week?');
    setHasError(false);
  }

  function handleOpenSidebar() {
    setIsSidebarOpen(true);
  }

  function handleCloseSidebar() {
    setIsSidebarOpen(false);
  }

  function handleBackToTask() {
    setIsSidebarOpen(false);
    onBack();
  }

  async function handleMorningChip(goalId: string, action: string) {
    const key = `${goalId}::${action}`;
    if (chipStates[key] === 'loading' || chipStates[key] === 'done') return;
    setChipStates((prev) => ({ ...prev, [key]: 'loading' }));
    try {
      await onCreateGoalTask(goalId, action);
      setChipStates((prev) => ({ ...prev, [key]: 'done' }));
    } catch {
      setChipStates((prev) => ({ ...prev, [key]: 'error' }));
    }
  }

  async function handleEveningChip(goalId: string, suggestion: string) {
    const key = `${goalId}::${suggestion}`;
    if (chipStates[key] === 'loading' || chipStates[key] === 'done') return;
    setChipStates((prev) => ({ ...prev, [key]: 'loading' }));
    try {
      await onCompleteGoalTask(goalId, suggestion);
      setChipStates((prev) => ({ ...prev, [key]: 'done' }));
    } catch {
      setChipStates((prev) => ({ ...prev, [key]: 'error' }));
    }
  }

  function renderEmptyGoalState(message: string) {
    return <Text style={[styles.emptyStateText, { color: palette.aiMeta }]}>{message}</Text>;
  }

  const accentColor = hasError ? '#EE5D5D' : isFocused || isTranscribing ? '#4D63FF' : 'transparent';

  return (
    <View style={styles.container}>
      <View style={[styles.header, { backgroundColor: palette.header, borderBottomColor: palette.headerBorder }]}> 
        <View style={styles.headerLeft}>
          <Pressable style={[styles.headerIconButton, { backgroundColor: palette.headerButton, borderColor: palette.headerButtonBorder }]} onPress={handleOpenSidebar}>
            <View style={styles.stackIcon}>
              <View style={[styles.stackBar, { borderColor: palette.headerText }]} />
              <View style={[styles.stackBar, { borderColor: palette.headerText }]} />
            </View>
            <View style={[styles.badge, { borderColor: palette.badgeBorder }]}> 
              <Text style={styles.badgeText}>1</Text>
            </View>
          </Pressable>
          <Text style={[styles.headerTitle, { color: palette.headerText }]}>Chat</Text>
        </View>

        <Pressable style={[styles.headerIconButton, { backgroundColor: palette.headerButton, borderColor: palette.headerButtonBorder }]}> 
          <Feather name="more-horizontal" size={24} color={palette.headerText} />
        </Pressable>
      </View>

      <SectionList
        ref={listRef}
        sections={sections}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled
        contentContainerStyle={styles.chatContent}
        showsVerticalScrollIndicator={false}
        onScrollToIndexFailed={() => {
          const lastSectionIndex = sections.length - 1;
          const lastSection = sections[lastSectionIndex];
          if (!lastSection) return;
          setTimeout(() => {
            listRef.current?.scrollToLocation({
              sectionIndex: lastSectionIndex,
              itemIndex: Math.max(lastSection.data.length - 1, 0),
              viewPosition: 1,
              animated: true,
            });
          }, 120);
        }}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeaderWrap}>
            <View style={[styles.sectionHeaderPill, { backgroundColor: palette.sectionPill, borderColor: palette.sectionPillBorder }]}>
              <Text style={[styles.sectionHeaderText, { color: palette.sectionText }]}>{section.title}</Text>
            </View>
          </View>
        )}
        renderItem={({ item }) => {
          if (item.kind === 'checkin') {
            const innerBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)';
            const innerBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
            const hasGoals = (item.goals?.length ?? 0) > 0;
            return (
              <View style={styles.checkinOuter}>
                {/* Check-in input card */}
                <View style={[styles.checkinCard, { backgroundColor: palette.aiBubble, borderColor: innerBorder }]}>
                  <Text style={[styles.checkinQuestion, { color: palette.summaryText }]}>
                    What did you do today for these goals?
                  </Text>
                  {!hasGoals && renderEmptyGoalState('No active goals yet.')}
                  {item.goals?.map((goal) => (
                    <View key={goal.id} style={styles.checkinGoalBlock}>
                      <Text style={[styles.checkinGoalLabel, { color: palette.aiMeta }]}>{goal.title}</Text>
                      <View style={[styles.checkinGoalInner, { backgroundColor: innerBg, borderColor: innerBorder }]}>
                        {goal.tasks.length > 0 && (
                          <View style={styles.checkinChipsRow}>
                            {goal.tasks.map((task) => (
                              <View key={task.id} style={[styles.taskChip, { borderColor: innerBorder }]}>
                                <Text style={[styles.taskChipText, { color: palette.summaryText }]} numberOfLines={1}>
                                  {task.title}
                                </Text>
                              </View>
                            ))}
                          </View>
                        )}
                        <View style={[styles.addTaskRow, goal.tasks.length > 0 && { borderTopWidth: 1, borderTopColor: innerBorder }]}>
                          <TextInput
                            value={taskDrafts[goal.id] ?? ''}
                            onChangeText={(text) => setTaskDrafts((prev) => ({ ...prev, [goal.id]: text }))}
                            placeholder="Add task"
                            placeholderTextColor={palette.inputPlaceholder}
                            style={[styles.addTaskInput, { color: palette.input }]}
                          />
                          <Pressable style={styles.addTaskIconBtn}>
                            <Feather name="mic" size={18} color={palette.circleIcon} />
                          </Pressable>
                          <Pressable
                            style={styles.addTaskIconBtn}
                            onPress={() => {
                              const text = taskDrafts[goal.id]?.trim();
                              if (text) {
                                onGoToNewTask();
                                setTaskDrafts((prev) => ({ ...prev, [goal.id]: '' }));
                              }
                            }}
                          >
                            <Ionicons
                              name="send-outline"
                              size={18}
                              color={(taskDrafts[goal.id] ?? '').trim() ? '#4D63FF' : palette.circleIcon}
                            />
                          </Pressable>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>

                {/* Goal progress section */}
                <View style={styles.progressSection}>
                  <Text style={[styles.progressIntro, { color: palette.aiMeta }]}>
                    Here's your goal progress snapshot for today.
                  </Text>
                  <Text style={[styles.progressTitle, { color: palette.summaryText }]}>Goal progress</Text>
                  <Text style={[styles.progressSubtitle, { color: palette.aiMeta }]}>
                    Here's how you are doing with your goals so far.
                  </Text>
                  <View style={[styles.progressCard, { backgroundColor: palette.aiBubble, borderColor: innerBorder }]}>
                    {!hasGoals && renderEmptyGoalState('No active goals yet.')}
                    {item.goals?.map((goal, index) => (
                      <View
                        key={goal.id}
                        style={[
                          styles.progressRow,
                          index < (item.goals?.length ?? 0) - 1 && { borderBottomWidth: 1, borderBottomColor: innerBorder },
                        ]}
                      >
                        <View style={styles.progressRowTop}>
                          <Text style={[styles.progressGoalTitle, { color: palette.summaryText }]} numberOfLines={1}>
                            {goal.title}
                          </Text>
                          <View style={[styles.statusBadge, goal.status === 'Active' ? styles.statusBadgeActive : styles.statusBadgePaused]}>
                            <Text style={[styles.statusBadgeText, goal.status === 'Active' ? styles.statusBadgeTextActive : styles.statusBadgeTextPaused]}>
                              {goal.status}
                            </Text>
                          </View>
                        </View>
                        <Text style={[styles.aiSummaryText, { color: palette.aiMeta }]}>AI summary unavailable right now.</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            );
          }

          if (item.kind === 'evening') {
            const innerBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)';
            const innerBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
            const hasGoals = (item.eveningGoals?.length ?? 0) > 0;
            return (
              <View style={[styles.morningCard, { backgroundColor: palette.aiBubble, borderColor: innerBorder }]}>
                <Text style={[styles.morningQuestion, { color: palette.summaryText }]}>
                  What did you do today for these goals?
                </Text>
                {!hasGoals && renderEmptyGoalState('No active goals yet.')}
                {item.eveningGoals?.map((g) => (
                  <View key={g.goalId} style={styles.checkinGoalBlock}>
                    <Text style={[styles.checkinGoalLabel, { color: palette.aiMeta }]}>{g.goalTitle}</Text>
                    <View style={[styles.checkinGoalInner, { backgroundColor: innerBg, borderColor: innerBorder }]}>
                      {g.suggestions.length > 0 && (
                        <View style={styles.checkinChipsRow}>
                          {g.suggestions.map((suggestion) => {
                            const key = `${g.goalId}::${suggestion}`;
                            const chipState = chipStates[key];
                            const isDone = chipState === 'done';
                            const isLoading = chipState === 'loading';
                            const isChipError = chipState === 'error';
                            return (
                              <Pressable
                                key={key}
                                style={[
                                  styles.taskChip,
                                  { borderColor: innerBorder },
                                  isDone && styles.chipDone,
                                  isChipError && styles.chipError,
                                ]}
                                onPress={() => void handleEveningChip(g.goalId, suggestion)}
                                disabled={isLoading || isDone}
                              >
                                {isLoading ? (
                                  <ActivityIndicator size="small" color={palette.summaryText} />
                                ) : isDone ? (
                                  <Feather name="check" size={13} color="#34C759" />
                                ) : (
                                  <Text style={[
                                    styles.taskChipText,
                                    { color: isChipError ? '#EE5D5D' : palette.summaryText },
                                  ]} numberOfLines={2}>
                                    {isChipError ? 'Retry' : suggestion}
                                  </Text>
                                )}
                              </Pressable>
                            );
                          })}
                        </View>
                      )}
                      <View style={[styles.addTaskRow, g.suggestions.length > 0 && { borderTopWidth: 1, borderTopColor: innerBorder }]}>
                        <TextInput
                          value={taskDrafts[g.goalId] ?? ''}
                          onChangeText={(text) => setTaskDrafts((prev) => ({ ...prev, [g.goalId]: text }))}
                          placeholder="Add task"
                          placeholderTextColor={palette.inputPlaceholder}
                          style={[styles.addTaskInput, { color: palette.input }]}
                        />
                        <Pressable style={styles.addTaskIconBtn}>
                          <Feather name="mic" size={18} color={palette.circleIcon} />
                        </Pressable>
                        <Pressable
                          style={styles.addTaskIconBtn}
                          onPress={() => {
                            const text = taskDrafts[g.goalId]?.trim();
                            if (text) {
                              onSendMessage(text);
                              setTaskDrafts((prev) => ({ ...prev, [g.goalId]: '' }));
                            }
                          }}
                        >
                          <Ionicons
                            name="send-outline"
                            size={18}
                            color={(taskDrafts[g.goalId] ?? '').trim() ? '#4D63FF' : palette.circleIcon}
                          />
                        </Pressable>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            );
          }

          if (item.kind === 'morning') {
            const innerBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)';
            const innerBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
            const hasGoals = (item.promptGoals?.length ?? 0) > 0;
            return (
              <View style={[styles.morningCard, { backgroundColor: palette.aiBubble, borderColor: innerBorder }]}>
                <Text style={[styles.morningQuestion, { color: palette.summaryText }]}>
                  What do you want to do today for these goals?
                </Text>
                {!hasGoals && renderEmptyGoalState('No active goals yet.')}
                {item.promptGoals?.map((g) => (
                  <View key={g.goalId} style={styles.checkinGoalBlock}>
                    <Text style={[styles.checkinGoalLabel, { color: palette.aiMeta }]}>{g.goalTitle}</Text>
                    <View style={[styles.checkinGoalInner, { backgroundColor: innerBg, borderColor: innerBorder }]}>
                      <View style={styles.checkinChipsRow}>
                        {(() => {
                          const key = `${g.goalId}::${g.action}`;
                          const chipState = chipStates[key];
                          const isDone = chipState === 'done';
                          const isLoading = chipState === 'loading';
                          const isChipError = chipState === 'error';
                          return (
                            <Pressable
                              key={key}
                              style={[
                                styles.taskChip,
                                { borderColor: innerBorder },
                                isDone && styles.chipDone,
                                isChipError && styles.chipError,
                              ]}
                              onPress={() => void handleMorningChip(g.goalId, g.action)}
                              disabled={isLoading || isDone}
                            >
                              {isLoading ? (
                                <ActivityIndicator size="small" color={palette.summaryText} />
                              ) : isDone ? (
                                <Feather name="check" size={13} color="#34C759" />
                              ) : (
                                <Text style={[
                                  styles.taskChipText,
                                  { color: isChipError ? '#EE5D5D' : palette.summaryText },
                                ]} numberOfLines={2}>
                                  {isChipError ? 'Retry' : g.action}
                                </Text>
                              )}
                            </Pressable>
                          );
                        })()}
                      </View>
                      <View style={[styles.addTaskRow, { borderTopWidth: 1, borderTopColor: innerBorder }]}>
                        <TextInput
                          value={taskDrafts[g.goalId] ?? ''}
                          onChangeText={(text) => setTaskDrafts((prev) => ({ ...prev, [g.goalId]: text }))}
                          placeholder="Add task"
                          placeholderTextColor={palette.inputPlaceholder}
                          style={[styles.addTaskInput, { color: palette.input }]}
                        />
                        <Pressable style={styles.addTaskIconBtn}>
                          <Feather name="mic" size={18} color={palette.circleIcon} />
                        </Pressable>
                        <Pressable
                          style={styles.addTaskIconBtn}
                          onPress={() => {
                            const text = taskDrafts[g.goalId]?.trim();
                            if (text) {
                              onSendMessage(text);
                              setTaskDrafts((prev) => ({ ...prev, [g.goalId]: '' }));
                            }
                          }}
                        >
                          <Ionicons
                            name="send-outline"
                            size={18}
                            color={(taskDrafts[g.goalId] ?? '').trim() ? '#4D63FF' : palette.circleIcon}
                          />
                        </Pressable>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            );
          }

          if (item.kind === 'progress') {
            const innerBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
            const hasGoals = (item.progressGoals?.length ?? 0) > 0;
            return (
              <View style={styles.progressSection}>
                <Text style={[styles.progressIntro, { color: palette.aiMeta }]}>
                  Here's your goal progress snapshot for today.
                </Text>
                <Text style={[styles.progressTitle, { color: palette.summaryText }]}>Goal progress</Text>
                <Text style={[styles.progressSubtitle, { color: palette.aiMeta }]}>
                  Here's how you are doing with your goals so far.
                </Text>
                <View style={[styles.progressCard, { backgroundColor: palette.aiBubble, borderColor: innerBorder }]}>
                  {!hasGoals && renderEmptyGoalState('No active goals yet.')}
                  {item.progressGoals?.map((g, index) => {
                    const isOnTrack = !g.status || g.status === 'on_track';
                    const isActive = g.status === 'active';
                    return (
                      <View
                        key={g.goalId}
                        style={[
                          styles.progressRow,
                          index < (item.progressGoals?.length ?? 0) - 1 && { borderBottomWidth: 1, borderBottomColor: innerBorder },
                        ]}
                      >
                        <View style={styles.progressRowTop}>
                          <Text style={[styles.progressGoalTitle, { color: palette.aiMeta }]} numberOfLines={1}>
                            {g.goalTitle}
                          </Text>
                          <View style={[
                            styles.statusBadge,
                            isOnTrack ? styles.statusBadgeOnTrack : isActive ? styles.statusBadgeActive : styles.statusBadgePaused,
                          ]}>
                            <Text style={[
                              styles.statusBadgeText,
                              isOnTrack ? styles.statusBadgeTextOnTrack : isActive ? styles.statusBadgeTextActive : styles.statusBadgeTextPaused,
                            ]}>
                              {isOnTrack ? 'On Track' : isActive ? 'Active' : 'Paused'}
                            </Text>
                          </View>
                        </View>
                        <Text style={[styles.progressSummaryText, { color: palette.summaryText }]}>
                          {g.summary ?? 'AI summary unavailable right now.'}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            );
          }

          if (item.kind === 'event') {
            const isGoal = item.eventAction === 'goal_created';
            const label = isGoal ? 'Goal created' : 'Task created';
            const iconName: 'target' | 'check-circle' = isGoal ? 'target' : 'check-circle';
            return (
              <View style={styles.eventRow}>
                <View style={[styles.eventCard, { backgroundColor: palette.aiBubble, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)' }]}>
                  <View style={styles.eventIconWrap}>
                    <Feather name={iconName} size={14} color={isGoal ? '#4D63FF' : '#34C759'} />
                  </View>
                  <View style={styles.eventBody}>
                    <Text style={[styles.eventLabel, { color: palette.aiMeta }]}>{label}</Text>
                    <Text style={[styles.eventTitle, { color: palette.summaryText }]} numberOfLines={2}>{item.eventTitle}</Text>
                  </View>
                  <Text style={[styles.eventTime, { color: palette.aiMeta }]}>{formatMessageTime(item.sentAt)}</Text>
                </View>
              </View>
            );
          }

          if (item.kind === 'summary') {
            return (
              <View style={styles.summaryMessage}>
                <Text style={[styles.summaryQuestion, { color: palette.summaryText }]}>What is one goal you want to achieve?</Text>

                <Text style={[styles.summaryLine, { color: palette.summaryMuted }]}> 
                  Goal created:{' '}
                  <Text style={[styles.summaryValue, { color: palette.summaryValue, textDecorationColor: palette.summaryUnderline }]}>{item.goal}</Text>
                </Text>

                <Text style={[styles.summaryLine, { color: palette.summaryMuted }]}> 
                  Task created:{' '}
                  <Text style={[styles.summaryValue, { color: palette.summaryValue, textDecorationColor: palette.summaryUnderline }]}>{item.task}</Text>
                </Text>
              </View>
            );
          }

          const isUser = item.role === 'user';
          const timeLabel = formatMessageTime(item.sentAt);

          return (
            <View style={[styles.messageRow, isUser ? styles.messageRowUser : styles.messageRowAi]}>
              <View
                style={[
                  styles.messageBubble,
                  isUser ? styles.userBubble : styles.aiBubble,
                  !isUser && { backgroundColor: palette.aiBubble },
                ]}
              >
                <Text style={[styles.messageText, isUser ? styles.userText : styles.aiText, !isUser && { color: palette.aiText }]}>{item.text}</Text>

                <View style={styles.metaRow}>
                  <Text style={[styles.metaText, isUser ? styles.userMetaText : styles.aiMetaText, !isUser && { color: palette.aiMeta }]}>
                    {timeLabel}
                  </Text>

                  {isUser ? (
                    <Ionicons
                      name="checkmark-done"
                      size={15}
                      color={item.status === 'read' ? '#9DDDFF' : 'rgba(255,255,255,0.78)'}
                    />
                  ) : null}
                </View>
              </View>
            </View>
          );
        }}
      />

      <View style={[styles.footer, { backgroundColor: palette.footer, borderTopColor: palette.footerBorder }]}> 
        <View style={[styles.composerWrap, { backgroundColor: palette.composer, borderColor: palette.composerBorder }]}> 
          <View style={[styles.composerAccent, { backgroundColor: accentColor }]} />

          <View style={styles.composerBody}>
            {isTranscribing ? (
              <Pressable style={styles.waveformArea} onPress={handleWaveformTap}>
                <View style={styles.waveformBars}>
                  {waveformHeights.map((height, index) => (
                    <View
                      key={`${height}-${index}`}
                      style={[styles.waveBar, { height, opacity: transcriptPreview ? 1 : 0.55 }]}
                    />
                  ))}
                </View>
                <Text style={[styles.waveformLabel, { color: palette.waveformLabel }]}>
                  {transcriptPreview || 'Listening... tap waveform to simulate transcript'}
                </Text>
              </Pressable>
            ) : (
              <TextInput
                value={draft}
                onChangeText={(next) => {
                  setDraft(next);
                  if (hasError) {
                    setHasError(false);
                  }
                }}
                placeholder="Ask anything"
                placeholderTextColor={palette.inputPlaceholder}
                style={[styles.textInput, { color: palette.input }]}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
              />
            )}

            <View style={styles.actionRow}>
              {isTranscribing ? (
                <>
                  <Pressable style={[styles.circleButton, isDark && { backgroundColor: palette.circle, borderColor: palette.composerBorder }]} onPress={handleCancelTranscribing}>
                    <Feather name="x" size={20} color={palette.circleIcon} />
                  </Pressable>
                  <Pressable style={[styles.circleButton, isDark && { backgroundColor: palette.circle, borderColor: palette.composerBorder }]} onPress={handleDoneTranscribing}>
                    <Feather name="check" size={20} color={palette.circleIcon} />
                  </Pressable>
                </>
              ) : (
                <>
                  <Pressable style={[styles.circleButton, isDark && { backgroundColor: palette.circle, borderColor: palette.composerBorder }]} onPress={handleStartTranscribing}>
                    <Feather name="mic" size={20} color={palette.circleIcon} />
                  </Pressable>
                  <Pressable
                    style={[styles.circleButton, hasDraft && styles.circleButtonActive]}
                    onPress={handleSend}
                    disabled={!hasDraft || isSending}
                  >
                    <Ionicons
                      name="send-outline"
                      size={20}
                      color={hasDraft ? '#4D63FF' : '#A3ACBC'}
                    />
                  </Pressable>
                </>
              )}
            </View>
          </View>
        </View>

        {hasError ? <Text style={styles.errorText}>Error. Try again.</Text> : null}
      </View>

      <AppSidebar
        activeItem="chat"
        onBack={handleBackToTask}
        onClose={handleCloseSidebar}
        onSelectGoals={() => {
          setIsSidebarOpen(false);
          onGoToGoal();
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
        title="Chat"
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    position: 'relative',
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
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FF564A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  headerTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
    color: '#181A21',
    letterSpacing: -0.6,
  },
  chatContent: {
    paddingTop: 14,
    paddingHorizontal: 16,
    paddingBottom: 150,
    gap: 10,
  },
  sectionHeaderWrap: {
    alignItems: 'center',
    paddingVertical: 18,
    backgroundColor: 'transparent',
  },
  sectionHeaderPill: {
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderWidth: 1,
    borderColor: '#D2D8E3',
  },
  sectionHeaderText: {
    fontSize: 15,
    lineHeight: 18,
    fontWeight: '500',
    color: '#7A8498',
  },
  summaryMessage: {
    paddingHorizontal: 8,
    paddingVertical: 20,
    gap: 26,
  },
  summaryQuestion: {
    fontSize: 22,
    lineHeight: 30,
    fontWeight: '400',
    color: '#22252C',
    letterSpacing: -0.6,
  },
  summaryLine: {
    fontSize: 18,
    lineHeight: 28,
    fontWeight: '400',
    color: '#6E778B',
    letterSpacing: -0.4,
  },
  summaryValue: {
    color: '#70798B',
    textDecorationLine: 'underline',
    textDecorationColor: '#98A0B1',
  },
  // ── Check-in card ──────────────────────────────────────────────────────────
  morningCard: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 14,
    gap: 18,
    marginBottom: 4,
  },
  morningQuestion: {
    fontSize: 20,
    lineHeight: 27,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  checkinOuter: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 20,
  },
  checkinCard: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 14,
    gap: 18,
  },
  checkinQuestion: {
    fontSize: 20,
    lineHeight: 27,
    fontWeight: '600',
    letterSpacing: -0.5,
  },
  checkinGoalBlock: {
    gap: 8,
  },
  checkinGoalLabel: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '500',
    letterSpacing: -0.1,
  },
  checkinGoalInner: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  checkinChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 10,
  },
  taskChip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipDone: {
    borderColor: 'rgba(52,199,89,0.4)',
    backgroundColor: 'rgba(52,199,89,0.08)',
    opacity: 0.9,
  },
  chipError: {
    borderColor: 'rgba(238,93,93,0.4)',
    backgroundColor: 'rgba(238,93,93,0.08)',
  },
  emptyStateText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    paddingHorizontal: 4,
  },
  taskChipText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    maxWidth: 200,
  },
  addTaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 6,
  },
  addTaskInput: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  addTaskIconBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // ── Goal progress section ───────────────────────────────────────────────────
  progressSection: {
    gap: 6,
  },
  progressIntro: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
    paddingHorizontal: 4,
  },
  progressTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
    paddingHorizontal: 4,
    marginTop: 4,
  },
  progressSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
    paddingHorizontal: 4,
    marginBottom: 6,
  },
  progressCard: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  progressRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 4,
  },
  progressRowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  progressGoalTitle: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '500',
    flex: 1,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusBadgeActive: {
    backgroundColor: 'rgba(77, 99, 255, 0.12)',
  },
  statusBadgePaused: {
    backgroundColor: 'rgba(122, 132, 152, 0.15)',
  },
  statusBadgeOnTrack: {
    backgroundColor: 'rgba(52, 199, 89, 0.15)',
  },
  statusBadgeText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
  statusBadgeTextActive: {
    color: '#4D63FF',
  },
  statusBadgeTextPaused: {
    color: '#7A8498',
  },
  statusBadgeTextOnTrack: {
    color: '#34C759',
  },
  aiSummaryText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
  },
  progressSummaryText: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '400',
  },
  eventRow: {
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  eventIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(77,99,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventBody: {
    flex: 1,
    gap: 1,
  },
  eventLabel: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  eventTitle: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '500',
  },
  eventTime: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '400',
    alignSelf: 'flex-end',
  },
  messageRow: {
    marginBottom: 14,
    flexDirection: 'row',
  },
  messageRowAi: {
    justifyContent: 'flex-start',
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  messageBubble: {
    maxWidth: '82%',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  aiBubble: {
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderTopLeftRadius: 8,
  },
  userBubble: {
    backgroundColor: '#4650F4',
    borderTopRightRadius: 8,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  metaRow: {
    marginTop: 8,
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '500',
    letterSpacing: 0,
  },
  aiText: {
    color: '#1C2028',
  },
  userText: {
    color: '#FFFFFF',
  },
  aiMetaText: {
    color: '#7E889A',
  },
  userMetaText: {
    color: 'rgba(255,255,255,0.78)',
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
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D8DEEA',
    overflow: 'hidden',
  },
  composerAccent: {
    height: 4,
    width: '100%',
  },
  composerBody: {
    minHeight: 78,
    paddingLeft: 18,
    paddingRight: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 19,
    lineHeight: 24,
    color: '#252A34',
    paddingVertical: 14,
  },
  waveformArea: {
    flex: 1,
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  waveformBars: {
    height: 28,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  waveBar: {
    width: 5,
    borderRadius: 999,
    backgroundColor: '#4D63FF',
  },
  waveformLabel: {
    fontSize: 15,
    lineHeight: 20,
    color: '#6E778B',
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
    backgroundColor: '#F4F1EB',
    borderWidth: 1,
    borderColor: '#DDD7CB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleButtonActive: {
    backgroundColor: '#EEF1FF',
    borderColor: '#C9D2FF',
  },
  errorText: {
    marginTop: 8,
    marginLeft: 18,
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '600',
    color: '#EE5D5D',
  },
});