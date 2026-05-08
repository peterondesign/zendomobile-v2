import { useMemo, useState } from 'react';

import { Feather } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppSidebar } from '../components/AppSidebar';
import { Theme } from '../theme';

type SearchGoal = {
  id: string;
  title: string;
  status: 'Paused' | 'Active';
};

type SearchTask = {
  id: string;
  title: string;
  meta: string;
  isCompleted: boolean;
};

type SearchScreenProps = {
  goalText: string;
  goals: SearchGoal[];
  goalTasksByGoal: Record<string, SearchTask[]>;
  taskText: string;
  chatMessages: Array<{
    id: string;
    content: string;
    sender: string;
  }>;
  theme: Theme;
  onGoToChat: () => void;
  onGoToGoalsView: () => void;
  onGoToNewTask: () => void;
  onGoToTasksView: () => void;
  onToggleTheme: () => void;
};

type SearchEntry = {
  id: string;
  label: string;
  value: string;
};

export function SearchScreen({
  goalText,
  goals,
  goalTasksByGoal,
  taskText,
  chatMessages,
  theme,
  onGoToChat,
  onGoToGoalsView,
  onGoToNewTask,
  onGoToTasksView,
  onToggleTheme,
}: SearchScreenProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [term, setTerm] = useState('');
  const isDark = theme.logoMode === 'dark';
  const palette = {
    headerButton: isDark ? '#222222' : '#FFFFFF',
    headerButtonBorder: isDark ? 'rgba(255,255,255,0.1)' : '#D7DDE7',
    card: isDark ? 'rgba(20, 20, 20, 0.94)' : 'rgba(255,255,255,0.94)',
    border: isDark ? 'rgba(255,255,255,0.08)' : '#E3E8F0',
    fieldBorder: isDark ? 'rgba(255,255,255,0.1)' : '#D7DDE7',
    fieldBackground: isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF',
    text: isDark ? '#D4D4D4' : '#20242C',
    muted: isDark ? '#969696' : '#7B8597',
    divider: isDark ? 'rgba(255,255,255,0.08)' : '#E8ECF3',
    icon: isDark ? '#D4D4D4' : '#20242C',
  };

  function handleCancelSearch() {
    setTerm('');
    onGoToTasksView();
  }

  const entries = useMemo<SearchEntry[]>(() => {
    const flattenedGoalTasks = Object.values(goalTasksByGoal).flat();

    return [
      { id: 'task-primary', label: 'TASK', value: taskText.trim() || 'Research potential investors in your industry' },
      { id: 'goal-primary', label: 'GOAL', value: goalText.trim() || 'Find investor for my startup' },
      ...chatMessages.map((message) => ({
        id: `chat-${message.id}`,
        label: message.sender === 'user' ? 'MESSAGE' : 'AI',
        value: message.content,
      })),
      ...flattenedGoalTasks.map((task) => ({
        id: `message-${task.id}`,
        label: 'MESSAGE',
        value: `Task created: ${task.title}`,
      })),
      ...goals.map((goal) => ({
        id: `goal-${goal.id}`,
        label: 'GOAL',
        value: goal.title,
      })),
    ];
  }, [chatMessages, goalTasksByGoal, goalText, goals, taskText]);

  const filteredEntries = entries.filter((entry) => {
    const query = term.trim().toLowerCase();

    if (!query) {
      return true;
    }

    return entry.value.toLowerCase().includes(query) || entry.label.toLowerCase().includes(query);
  });

  return (
    <View style={styles.container}>
      <View style={styles.topActions}>
        <Pressable
          style={[styles.iconButton, { backgroundColor: palette.headerButton, borderColor: palette.headerButtonBorder }]}
          onPress={handleCancelSearch}
        >
          <Feather name="x" size={20} color={palette.icon} />
        </Pressable>
      </View>

      <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
        <View style={[styles.searchRow, { borderBottomColor: palette.divider }]}>
          <View style={[styles.searchIconWrap, { backgroundColor: palette.fieldBackground, borderColor: palette.fieldBorder }]}>
            <Feather name="search" size={22} color={palette.icon} />
          </View>

          <TextInput
            value={term}
            onChangeText={setTerm}
            onKeyPress={({ nativeEvent }) => {
              if (nativeEvent.key === 'Escape') {
                handleCancelSearch();
              }
            }}
            placeholder="Search term"
            placeholderTextColor={palette.muted}
            style={[styles.searchInput, { color: palette.text }]}
          />

          {term ? (
            <Pressable
              style={[styles.iconButton, styles.inlineIconButton, { backgroundColor: palette.fieldBackground, borderColor: palette.fieldBorder }]}
              onPress={() => setTerm('')}
            >
              <Feather name="x" size={18} color={palette.icon} />
            </Pressable>
          ) : null}
        </View>

        <ScrollView style={styles.resultsScroll} contentContainerStyle={styles.resultsContent} showsVerticalScrollIndicator={false}>
          {filteredEntries.map((entry) => (
            <View key={entry.id} style={styles.resultRow}>
              <Text style={[styles.resultLabel, { color: palette.muted }]}>{entry.label}</Text>
              <Text style={[styles.resultValue, { color: palette.text }]}>{entry.value}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      <AppSidebar
        activeItem={null}
        onBack={() => {
          setIsSidebarOpen(false);
          onGoToTasksView();
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
        onSelectSearch={() => setIsSidebarOpen(false)}
        onSelectTasks={() => {
          setIsSidebarOpen(false);
          onGoToTasksView();
        }}
        onToggleTheme={onToggleTheme}
        theme={theme}
        title="Search"
        visible={isSidebarOpen}
      />

      <Pressable style={styles.sidebarTrigger} onPress={() => setIsSidebarOpen(true)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  topActions: {
    position: 'absolute',
    top: 54,
    right: 20,
    zIndex: 5,
    flexDirection: 'row',
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineIconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  card: {
    flex: 1,
    marginTop: 110,
    borderTopLeftRadius: 38,
    borderTopRightRadius: 38,
    borderWidth: 1,
    overflow: 'hidden',
  },
  searchRow: {
    minHeight: 110,
    borderBottomWidth: 1,
    paddingHorizontal: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  searchIconWrap: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchInput: {
    flex: 1,
    fontSize: 28,
    lineHeight: 34,
  },
  resultsScroll: {
    flex: 1,
  },
  resultsContent: {
    paddingHorizontal: 48,
    paddingTop: 42,
    paddingBottom: 48,
    gap: 34,
  },
  resultRow: {
    gap: 10,
  },
  resultLabel: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '800',
  },
  resultValue: {
    fontSize: 28,
    lineHeight: 34,
  },
  sidebarTrigger: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 84,
    height: 84,
  },
});