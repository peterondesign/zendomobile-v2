import { useState } from 'react';

import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, StyleSheet, useColorScheme, useWindowDimensions } from 'react-native';

import { GoalScreen } from './screens/GoalScreen';
import { LandingScreen } from './screens/LandingScreen';
import { TaskScreen } from './screens/TaskScreen';
import { ChatScreen } from './screens/ChatScreen';
import { TasksViewScreen } from './screens/TasksViewScreen';
import { DayRingViewScreen } from './screens/DayRingViewScreen';
import { GoalsViewScreen } from './screens/GoalsViewScreen';
import { GoalDetailScreen } from './screens/GoalDetailScreen';
import { GoalHistoryScreen } from './screens/GoalHistoryScreen';
import { SearchScreen } from './screens/SearchScreen';
import { resolveThemeName, ThemeName, themes } from './theme';

type ScreenName = 'landing' | 'goal' | 'task' | 'chat' | 'tasks-view' | 'day-ring' | 'goals-view' | 'goal-detail' | 'goal-history' | 'search';
type GoalStatus = 'Paused' | 'Active';

type GoalItem = {
  id: string;
  title: string;
  status: GoalStatus;
};

type GoalTaskItem = {
  id: string;
  title: string;
  meta: string;
  isCompleted: boolean;
};

const initialGoals: GoalItem[] = [
  { id: 'goal-better-health', title: 'Better health', status: 'Paused' },
  { id: 'goal-community-lisbon', title: 'Community in Lisbon', status: 'Paused' },
  { id: 'goal-zendo-5000', title: '$5000 from Zendo', status: 'Paused' },
  { id: 'goal-work', title: 'Work', status: 'Paused' },
];

const initialGoalTasks: Record<string, GoalTaskItem[]> = {
  'goal-better-health': [
    { id: 'task-choose-workout', title: 'Choose workout type', meta: '05 Mar · 19:00-19:30', isCompleted: false },
    { id: 'task-prepare-gear', title: 'Prepare workout gear', meta: '26 Feb · 20:00-20:15', isCompleted: false },
    { id: 'task-reflect', title: 'Reflect on workout experience', meta: '05 Mar', isCompleted: false },
    { id: 'task-walk', title: 'Walk', meta: '', isCompleted: false },
    { id: 'task-workout', title: 'Workout', meta: '', isCompleted: false },
  ],
  'goal-community-lisbon': [
    { id: 'task-meetup', title: 'Find one meetup this week', meta: '06 Mar · 18:00', isCompleted: false },
  ],
  'goal-zendo-5000': [
    { id: 'task-revenue-review', title: 'Review weekly revenue', meta: '08 Mar · 10:00', isCompleted: false },
  ],
  'goal-work': [
    { id: 'task-priorities', title: 'Set top three priorities', meta: 'Tomorrow · 09:00', isCompleted: false },
  ],
};

export default function App() {
  const colorScheme = useColorScheme();
  const { height, width } = useWindowDimensions();
  const [themePreference, setThemePreference] = useState<ThemeName | null>(null);
  const [screen, setScreen] = useState<ScreenName>('landing');
  const [goalText, setGoalText] = useState('Find investor for my startup');
  const [goals, setGoals] = useState<GoalItem[]>(initialGoals);
  const [goalTasksByGoal, setGoalTasksByGoal] = useState<Record<string, GoalTaskItem[]>>(initialGoalTasks);
  const [selectedGoalId, setSelectedGoalId] = useState(initialGoals[0].id);
  const [taskText, setTaskText] = useState('');
  const [taskComposerFocusVersion, setTaskComposerFocusVersion] = useState(0);
  const themeName = resolveThemeName(colorScheme, themePreference);
  const theme = themes[themeName];
  const isCompactLayout = width <= 430 || height <= 860;
  const selectedGoal = goals.find((goal) => goal.id === selectedGoalId) ?? goals[0];

  function toggleTheme() {
    setThemePreference((current) => {
      const nextTheme = resolveThemeName(colorScheme, current);
      return nextTheme === 'light' ? 'dark' : 'light';
    });
  }

  function openNewTaskComposer() {
    setTaskComposerFocusVersion((current) => current + 1);
    setScreen('tasks-view');
  }

  return (
    <LinearGradient
      colors={theme.backgroundGradient}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.background}
    >
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style={theme.statusBar} />

        {screen === 'landing' ? (
          <LandingScreen theme={theme} onToggleTheme={toggleTheme} onContinue={() => setScreen('goal')} />
        ) : null}

        {screen === 'goal' ? (
          <GoalScreen
            theme={theme}
            isCompact={isCompactLayout}
            value={goalText}
            onChangeText={setGoalText}
            onToggleTheme={toggleTheme}
            onBack={() => setScreen('landing')}
            onContinue={() => {
              if (goalText.trim()) {
                setScreen('task');
              }
            }}
          />
        ) : null}

        {screen === 'task' ? (
          <TaskScreen
            theme={theme}
            isCompact={isCompactLayout}
            value={taskText}
            onChangeText={setTaskText}
            onToggleTheme={toggleTheme}
            onBack={() => setScreen('goal')}
            onContinue={() => {
              if (taskText.trim()) {
                setScreen('chat');
              }
            }}
          />
        ) : null}

        {screen === 'tasks-view' ? (
          <TasksViewScreen
            focusComposerVersion={taskComposerFocusVersion}
            theme={theme}
            goalText={goalText}
            taskText={taskText}
            onBackToTaskEntry={() => setScreen('task')}
            onGoToChat={() => setScreen('chat')}
            onGoToDayRing={() => setScreen('day-ring')}
            onGoToGoal={() => setScreen('goals-view')}
            onGoToSearch={() => setScreen('search')}
            onToggleTheme={toggleTheme}
          />
        ) : null}

        {screen === 'day-ring' ? (
          <DayRingViewScreen
            theme={theme}
            onBackToTaskEntry={() => setScreen('task')}
            onGoToChat={() => setScreen('chat')}
            onGoToGoal={() => setScreen('goals-view')}
            onGoToNewTask={openNewTaskComposer}
            onGoToSearch={() => setScreen('search')}
            onGoToTasksView={() => setScreen('tasks-view')}
            onToggleTheme={toggleTheme}
          />
        ) : null}

        {screen === 'goals-view' ? (
          <GoalsViewScreen
            goals={goals}
            theme={theme}
            onBackToGoalEntry={() => setScreen('goal')}
            onCreateNewGoal={(goalTitle) => {
              const goalId = `goal-${Date.now()}`;

              setGoals((current) => [
                {
                  id: goalId,
                  title: goalTitle,
                  status: 'Paused',
                },
                ...current,
              ]);
              setGoalTasksByGoal((current) => ({
                ...current,
                [goalId]: [],
              }));
              setSelectedGoalId(goalId);
              setScreen('goal-detail');
            }}
            onGoToChat={() => setScreen('chat')}
            onGoToGoalDetail={(goalId) => {
              setSelectedGoalId(goalId);
              setScreen('goal-detail');
            }}
            onGoToNewTask={openNewTaskComposer}
            onGoToSearch={() => setScreen('search')}
            onGoToTasksView={() => setScreen('tasks-view')}
            onToggleTheme={toggleTheme}
          />
        ) : null}

        {screen === 'goal-detail' ? (
          <GoalDetailScreen
            goalStatus={selectedGoal.status}
            goalTasks={goalTasksByGoal[selectedGoal.id] ?? []}
            goalTitle={selectedGoal.title}
            theme={theme}
            onBackToGoalEntry={() => setScreen('goal')}
            onBackToGoals={() => setScreen('goals-view')}
            onGoToChat={() => setScreen('chat')}
            onGoToGoalHistory={() => setScreen('goal-history')}
            onGoToNewTask={openNewTaskComposer}
            onGoToSearch={() => setScreen('search')}
            onGoToTasksView={() => setScreen('tasks-view')}
            onAddTask={(taskTitle) => {
              setGoalTasksByGoal((current) => ({
                ...current,
                [selectedGoal.id]: [
                  ...(current[selectedGoal.id] ?? []),
                  {
                    id: `task-${Date.now()}`,
                    title: taskTitle,
                    meta: '',
                    isCompleted: false,
                  },
                ],
              }));
            }}
            onRenameGoal={(nextTitle) => {
              setGoals((current) =>
                current.map((goal) =>
                  goal.id === selectedGoal.id ? { ...goal, title: nextTitle } : goal,
                ),
              );
            }}
            onRenameTask={(taskId, nextTitle) => {
              setGoalTasksByGoal((current) => ({
                ...current,
                [selectedGoal.id]: (current[selectedGoal.id] ?? []).map((task) =>
                  task.id === taskId ? { ...task, title: nextTitle } : task,
                ),
              }));
            }}
            onRemoveTask={(taskId) => {
              setGoalTasksByGoal((current) => ({
                ...current,
                [selectedGoal.id]: (current[selectedGoal.id] ?? []).filter((task) => task.id !== taskId),
              }));
            }}
            onToggleTaskCompleted={(taskId) => {
              setGoalTasksByGoal((current) => ({
                ...current,
                [selectedGoal.id]: (current[selectedGoal.id] ?? []).map((task) =>
                  task.id === taskId ? { ...task, isCompleted: !task.isCompleted } : task,
                ),
              }));
            }}
            onToggleGoalStatus={() => {
              setGoals((current) =>
                current.map((goal) =>
                  goal.id === selectedGoal.id
                    ? { ...goal, status: goal.status === 'Paused' ? 'Active' : 'Paused' }
                    : goal,
                ),
              );
            }}
            onToggleTheme={toggleTheme}
          />
        ) : null}

        {screen === 'goal-history' ? (
          <GoalHistoryScreen
            goalTitle={selectedGoal.title}
            theme={theme}
            onBackToGoalDetail={() => setScreen('goal-detail')}
            onBackToGoalEntry={() => setScreen('goal')}
            onGoToChat={() => setScreen('chat')}
            onGoToGoalsView={() => setScreen('goals-view')}
            onGoToNewTask={openNewTaskComposer}
            onGoToSearch={() => setScreen('search')}
            onGoToTasksView={() => setScreen('tasks-view')}
            onToggleTheme={toggleTheme}
          />
        ) : null}

        {screen === 'search' ? (
          <SearchScreen
            goalText={goalText}
            goals={goals}
            goalTasksByGoal={goalTasksByGoal}
            taskText={taskText}
            theme={theme}
            onGoToChat={() => setScreen('chat')}
            onGoToGoalsView={() => setScreen('goals-view')}
            onGoToNewTask={openNewTaskComposer}
            onGoToTasksView={() => setScreen('tasks-view')}
            onToggleTheme={toggleTheme}
          />
        ) : null}

        {screen === 'chat' ? (
          <ChatScreen
            theme={theme}
            goalText={goalText}
            taskText={taskText}
            onBack={() => setScreen('task')}
            onGoToGoal={() => setScreen('goals-view')}
            onGoToNewTask={openNewTaskComposer}
            onGoToSearch={() => setScreen('search')}
            onGoToTasksView={() => setScreen('tasks-view')}
            onToggleTheme={toggleTheme}
          />
        ) : null}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
});
