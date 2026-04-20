import { useEffect, useRef, useState } from 'react';

import { Feather, Ionicons } from '@expo/vector-icons';
import {
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AppSidebar } from '../components/AppSidebar';
import { Theme } from '../theme';

type ChatMessage = {
  id: string;
  role: 'ai' | 'user';
  kind: 'text' | 'summary';
  text?: string;
  goal?: string;
  task?: string;
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
  onBack: () => void;
  onGoToGoal: () => void;
  onGoToNewTask: () => void;
  onGoToSearch: () => void;
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

function createInitialSections(goalText: string, taskText: string): ChatSection[] {
  const seeded = [
    {
      daysAgo: 0,
      key: 'today',
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
    {
      daysAgo: 1,
      key: 'yesterday',
      data: [
        {
          id: 'yesterday-ai',
          role: 'ai' as const,
          kind: 'text' as const,
          text: 'I can help you turn that into a simple outreach rhythm for the week.',
          sentAt: createMessageDate(1, 16, 42),
        },
      ],
    },
    {
      daysAgo: 2,
      key: 'weekday-1',
      data: [
        {
          id: 'weekday-1-user',
          role: 'user' as const,
          kind: 'text' as const,
          text: 'Give me one investor-facing task I can finish in under 30 minutes.',
          sentAt: createMessageDate(2, 11, 18),
          status: 'delivered' as const,
        },
      ],
    },
    {
      daysAgo: 4,
      key: 'weekday-2',
      data: [
        {
          id: 'weekday-2-ai',
          role: 'ai' as const,
          kind: 'text' as const,
          text: 'Start with a small step that gives you signal quickly, not a perfect long-term plan.',
          sentAt: createMessageDate(4, 9, 6),
        },
      ],
    },
    {
      daysAgo: 8,
      key: 'older',
      data: [
        {
          id: 'older-user',
          role: 'user' as const,
          kind: 'text' as const,
          text: 'I want to build more consistency around founder outreach.',
          sentAt: createMessageDate(8, 14, 7),
          status: 'read' as const,
        },
      ],
    },
  ];

  return seeded.map((section) => {
    const date = subDays(section.daysAgo);

    return {
      key: section.key,
      date,
      title: getSectionTitle(date),
      data: section.data,
    };
  });
}

function buildAiReply(input: string) {
  return `Good prompt. Start by turning "${input}" into one step you can finish today, then I can help you tighten it.`;
}

export function ChatScreen({ theme, goalText, taskText, onBack, onGoToGoal, onGoToNewTask, onGoToSearch, onGoToTasksView, onToggleTheme }: ChatScreenProps) {
  const [sections, setSections] = useState<ChatSection[]>(() => createInitialSections(goalText, taskText));
  const [draft, setDraft] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptPreview, setTranscriptPreview] = useState('');
  const [hasError, setHasError] = useState(false);
  const listRef = useRef<SectionList<ChatMessage, ChatSection> | null>(null);
  const isInitialRender = useRef(true);
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

    const latestSection = sections[0];

    if (!latestSection) {
      return;
    }

    requestAnimationFrame(() => {
      listRef.current?.scrollToLocation({
        sectionIndex: 0,
        itemIndex: Math.max(latestSection.data.length - 1, 0),
        viewPosition: 1,
        animated: true,
      });
    });
  }, [sections]);

  function appendMessages(userInput: string) {
    const now = new Date();
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      kind: 'text',
      text: userInput,
      sentAt: now,
      status: 'delivered',
    };
    const aiMessage: ChatMessage = {
      id: `ai-${Date.now() + 1}`,
      role: 'ai',
      kind: 'text',
      text: buildAiReply(userInput),
      sentAt: new Date(now.getTime() + 60 * 1000),
    };

    setSections((current) => {
      const todayDate = subDays(0);
      const todayTitle = getSectionTitle(todayDate);
      const next = [...current];

      if (next.length > 0 && next[0].title === todayTitle) {
        next[0] = {
          ...next[0],
          data: [...next[0].data, userMessage, aiMessage],
        };
        return next;
      }

      return [
        {
          key: `today-${Date.now()}`,
          title: todayTitle,
          date: todayDate,
          data: [userMessage, aiMessage],
        },
        ...next,
      ];
    });
  }

  function handleSend() {
    if (!hasDraft) {
      return;
    }

    appendMessages(draft.trim());
    setDraft('');
    setHasError(false);
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
        onScrollToIndexFailed={({ sectionIndex, index }) => {
          setTimeout(() => {
            listRef.current?.scrollToLocation({
              sectionIndex,
              itemIndex: index,
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
                    disabled={!hasDraft}
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