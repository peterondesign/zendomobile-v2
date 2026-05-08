import { useEffect, useMemo, useRef, useState } from 'react';

import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Platform, SafeAreaView, StyleSheet, Text, useColorScheme, useWindowDimensions, View } from 'react-native';

import {
  ApiChatMessage,
  ApiGoalHistory,
  ApiTask,
  UnauthorizedError,
  createGoal,
  createTask,
  deleteTask,
  fetchActiveTasks,
  fetchArchivedTasks,
  fetchChatMessages,
  fetchCompletedTasks,
  fetchGoalHistory,
  fetchGoals,
  reorderTasks,
  registerAuthSource,
  setApiAccessTokenProvider,
  sendChatMessage,
  updateGoal,
  updateTask,
} from './api';
import { AuthContext, AuthenticatedUser } from './auth-context';
import {
  NativeAuthSession,
  clearNativeSession,
  loadNativeSession,
  refreshNativeSession,
  startNativeLogin,
  startWebLogin,
  startWebLogout,
} from './auth';

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

function toUiGoalStatus(status: string | undefined): GoalStatus {
  return status === 'active' ? 'Active' : 'Paused';
}

function formatTaskMeta(task: ApiTask) {
  const dueAt = task.dueAt ?? task.due_at;
  const dueDate = task.dueDateOnly ?? task.startDate ?? task.start_date ?? task.due_date;

  if (dueAt) {
    const date = new Date(dueAt);
    return date.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).replace(',', ' ·');
  }

  if (dueDate) {
    const date = new Date(dueDate);
    return date.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
    });
  }

  return '';
}

function isTaskCompleted(task: ApiTask) {
  return task.status === 'done' || task.completed === true || Boolean(task.completedAt ?? task.completed_at);
}

function sortTasks(tasks: ApiTask[]) {
  return [...tasks].sort((left, right) => {
    const leftPosition = left.position ?? Number.MAX_SAFE_INTEGER;
    const rightPosition = right.position ?? Number.MAX_SAFE_INTEGER;

    if (leftPosition !== rightPosition) {
      return leftPosition - rightPosition;
    }

    return new Date(left.createdAt ?? left.created_at ?? 0).getTime() - new Date(right.createdAt ?? right.created_at ?? 0).getTime();
  });
}

function sortCompletedTasks(tasks: ApiTask[]) {
  return [...tasks].sort((left, right) => {
    const leftCompletedAt = new Date(left.completedAt ?? left.completed_at ?? 0).getTime();
    const rightCompletedAt = new Date(right.completedAt ?? right.completed_at ?? 0).getTime();

    if (leftCompletedAt !== rightCompletedAt) {
      return rightCompletedAt - leftCompletedAt;
    }

    return new Date(right.createdAt ?? right.created_at ?? 0).getTime() - new Date(left.createdAt ?? left.created_at ?? 0).getTime();
  });
}

function mergeTaskCollections(activeTasks: ApiTask[], completedTasks: ApiTask[], archivedTasks: ApiTask[]) {
  const mergedById = new Map<string, ApiTask>();

  for (const task of [...sortTasks(activeTasks), ...sortCompletedTasks(completedTasks), ...archivedTasks]) {
    mergedById.set(task.id, task);
  }

  return Array.from(mergedById.values());
}

export default function App() {
  const colorScheme = useColorScheme();
  const { height, width } = useWindowDimensions();
  const [themePreference, setThemePreference] = useState<ThemeName | null>(null);
  const [screen, setScreen] = useState<ScreenName>('landing');
  const [goalText, setGoalText] = useState('Find investor for my startup');
  const [goals, setGoals] = useState<GoalItem[]>([]);
  const [tasks, setTasks] = useState<ApiTask[]>([]);
  const [chatMessages, setChatMessages] = useState<ApiChatMessage[]>([]);
  const [goalHistoryByGoalId, setGoalHistoryByGoalId] = useState<Record<string, ApiGoalHistory | null>>({});
  const [selectedGoalId, setSelectedGoalId] = useState('');
  const [taskText, setTaskText] = useState('');
  const [taskComposerFocusVersion, setTaskComposerFocusVersion] = useState(0);
  const [authStatus, setAuthStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');
  const [authUser, setAuthUser] = useState<AuthenticatedUser | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const authSessionRef = useRef<NativeAuthSession | null>(null);
  const themeName = resolveThemeName(colorScheme, themePreference);
  const theme = themes[themeName];
  const isCompactLayout = width <= 430 || height <= 860;
  const selectedGoal = goals.find((goal) => goal.id === selectedGoalId) ?? goals[0] ?? null;
  const todayIsoDate = new Date().toISOString().slice(0, 10);
  const todayLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  const activeTasks = useMemo(
    () => sortTasks(tasks.filter((task) => task.status !== 'archived' && !isTaskCompleted(task))),
    [tasks],
  );
  const dueTodayCount = useMemo(
    () => tasks.filter((task) => (task.dueDateOnly ?? task.due_date ?? '').slice(0, 10) === todayIsoDate).length,
    [tasks, todayIsoDate],
  );
  const selectedGoalTasks = useMemo<GoalTaskItem[]>(() => {
    if (!selectedGoal) {
      return [];
    }

    return sortTasks(
      tasks.filter((task) => (task.goal?.id ?? task.goal_id) === selectedGoal.id && task.status !== 'archived'),
    ).map((task) => ({
      id: task.id,
      title: task.title,
      meta: formatTaskMeta(task),
      isCompleted: isTaskCompleted(task),
    }));
  }, [selectedGoal, tasks]);
  const goalTasksByGoal = useMemo<Record<string, GoalTaskItem[]>>(() => {
    return tasks.reduce<Record<string, GoalTaskItem[]>>((current, task) => {
      const goalId = task.goal?.id ?? task.goal_id;

      if (!goalId || task.status === 'archived') {
        return current;
      }

      current[goalId] = [...(current[goalId] ?? []), {
        id: task.id,
        title: task.title,
        meta: formatTaskMeta(task),
        isCompleted: isTaskCompleted(task),
      }];

      return current;
    }, {});
  }, [tasks]);
  const tasksViewItems = useMemo(
    () => tasks.filter((task) => task.status !== 'archived').map((task) => ({
      id: task.id,
      title: task.title,
      goalTitle: task.goal?.title ?? selectedGoal?.title ?? goalText,
      isCompleted: isTaskCompleted(task),
      meta: formatTaskMeta(task),
    })),
    [goalText, selectedGoal, tasks],
  );

  function resetAppData() {
    setGoals([]);
    setTasks([]);
    setChatMessages([]);
    setGoalHistoryByGoalId({});
    setSelectedGoalId('');
  }

  async function getNativeAccessToken() {
    const currentSession = authSessionRef.current;

    if (!currentSession) {
      return null;
    }

    if (currentSession.refreshToken && currentSession.expiresAt && currentSession.expiresAt - Math.floor(Date.now() / 1000) <= 60) {
      const refreshedSession = await refreshNativeSession(currentSession);
      authSessionRef.current = refreshedSession;
      setAuthUser(refreshedSession.user);
      return refreshedSession.accessToken;
    }

    return currentSession.accessToken;
  }

  async function handleUnauthorizedSession(message = 'Your Auth0 session expired. Sign in again.') {
    console.error('[handleUnauthorizedSession] called with message:', message);
    console.error('[handleUnauthorizedSession] stack trace:', new Error().stack);
    authSessionRef.current = null;
    setApiAccessTokenProvider(null);
    resetAppData();
    setAuthUser(null);
    setAuthStatus('unauthenticated');
    setScreen('landing');
    setErrorMessage(message);

    await clearNativeSession();
  }

  async function handleRequestError(error: unknown, fallbackMessage: string) {
    console.error('[handleRequestError]', { error, fallbackMessage, isUnauthorized: error instanceof UnauthorizedError });
    if (error instanceof UnauthorizedError) {
      await handleUnauthorizedSession();
      return;
    }

    setErrorMessage(error instanceof Error ? error.message : fallbackMessage);
  }

  async function refreshAppData(showSpinner = false, logoutOn401 = true) {
    if (showSpinner) {
      setIsLoading(true);
    }

    try {
      const [nextGoals, nextActiveTasks, nextCompletedTasks, nextArchivedTasks, nextMessages] = await Promise.all([
        fetchGoals(),
        fetchActiveTasks(),
        fetchCompletedTasks(),
        fetchArchivedTasks(),
        fetchChatMessages(),
      ]);

      setGoals(nextGoals.map((goal) => ({
        id: goal.id,
        title: goal.title,
        status: toUiGoalStatus(goal.status),
      })));
      setTasks(mergeTaskCollections(nextActiveTasks, nextCompletedTasks, nextArchivedTasks));
      setChatMessages(nextMessages);
      setErrorMessage(null);

      setSelectedGoalId((current) => {
        if (current && nextGoals.some((goal) => goal.id === current)) {
          return current;
        }

        return nextGoals[0]?.id ?? '';
      });
    } catch (error) {
      if (error instanceof UnauthorizedError && !logoutOn401) {
        console.warn('[refreshAppData] 401 suppressed — staying logged in');
        return;
      }
      await handleRequestError(error, 'Unable to load live app data.');
    } finally {
      if (showSpinner) {
        setIsLoading(false);
      }
    }
  }

  async function loadGoalHistoryForSelectedGoal(goalId: string) {
    try {
      const history = await fetchGoalHistory(goalId);

      setGoalHistoryByGoalId((current) => ({
        ...current,
        [goalId]: history,
      }));
      setErrorMessage(null);
    } catch (error) {
      await handleRequestError(error, 'Unable to load goal history.');
    }
  }

  async function registerAuthSourceIfNeeded() {
    if (Platform.OS === 'web') {
      return;
    }

    await registerAuthSource();
  }

  useEffect(() => {
    async function initializeAuth() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const session = await loadNativeSession();

        if (!session) {
          resetAppData();
          setAuthUser(null);
          setAuthStatus('unauthenticated');
          return;
        }

        authSessionRef.current = session;
        setApiAccessTokenProvider(() => getNativeAccessToken());
        setAuthUser(session.user);
        setAuthStatus('authenticated');
        setScreen('chat');
        try {
          await refreshAppData(false, false);
          await registerAuthSourceIfNeeded();
        } catch {
          // Data load failed but session is valid — stay on chat
        }
      } catch (error) {
        await handleRequestError(error, 'Unable to initialize Auth0 authentication.');
      } finally {
        setIsLoading(false);
      }
    }

    void initializeAuth();
  }, []);

  useEffect(() => {
    if (screen === 'goal-history' && selectedGoalId && !goalHistoryByGoalId[selectedGoalId]) {
      void loadGoalHistoryForSelectedGoal(selectedGoalId);
    }
  }, [goalHistoryByGoalId, screen, selectedGoalId]);

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

  async function handleStartAuth(mode: 'login' | 'signup') {
    setIsAuthenticating(true);
    setErrorMessage(null);

    try {
      if (Platform.OS === 'web') {
        const session = await startWebLogin(mode);

        if (!session) {
          return;
        }

        authSessionRef.current = session;
        setApiAccessTokenProvider(() => getNativeAccessToken());
        setAuthUser(session.user);
        setAuthStatus('authenticated');
        setScreen('chat');
        try { await refreshAppData(true, false); } catch { /* stay on chat even if API fails */ }
        try { await registerAuthSourceIfNeeded(); } catch { /* non-critical */ }
        return;
      }

      const session = await startNativeLogin(mode);

      if (!session) {
        return;
      }

      authSessionRef.current = session;
      setApiAccessTokenProvider(() => getNativeAccessToken());
      setAuthUser(session.user);
      setAuthStatus('authenticated');
      setScreen('chat');
      try { await refreshAppData(true, false); } catch { /* stay on chat even if API fails */ }
      try { await registerAuthSourceIfNeeded(); } catch { /* non-critical */ }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to sign in with Auth0.';
      setErrorMessage(message);
    } finally {
      setIsAuthenticating(false);
    }
  }

  async function handleLogout() {
    setIsAuthenticating(true);
    setErrorMessage(null);

    try {
      if (Platform.OS === 'web') {
        await startWebLogout();
        authSessionRef.current = null;
        setApiAccessTokenProvider(null);
        resetAppData();
        setAuthUser(null);
        setAuthStatus('unauthenticated');
        setScreen('landing');
        return;
      }

      await clearNativeSession();
      authSessionRef.current = null;
      setApiAccessTokenProvider(null);
      resetAppData();
      setAuthUser(null);
      setAuthStatus('unauthenticated');
      setScreen('landing');
    } finally {
      setIsAuthenticating(false);
    }
  }

  async function handleCompleteOnboarding() {
    if (!goalText.trim() || !taskText.trim()) {
      return;
    }

    try {
      const goal = await createGoal(goalText.trim());
      setSelectedGoalId(goal.id);
      await createTask({
        title: taskText.trim(),
        goalId: goal.id,
      });
      await refreshAppData();
      setScreen('chat');
    } catch (error) {
      await handleRequestError(error, 'Unable to create onboarding data.');
    }
  }

  async function handleCreateGoal(goalTitle: string) {
    try {
      const goal = await createGoal(goalTitle);
      setSelectedGoalId(goal.id);
      await refreshAppData();
      setScreen('goal-detail');
    } catch (error) {
      await handleRequestError(error, 'Unable to create goal.');
    }
  }

  async function handleCreateTask(taskTitle: string, goalId?: string | null) {
    try {
      await createTask({
        title: taskTitle,
        goalId: goalId ?? selectedGoal?.id ?? null,
      });
      await refreshAppData();
    } catch (error) {
      await handleRequestError(error, 'Unable to create task.');
    }
  }

  async function handleRenameGoal(nextTitle: string) {
    if (!selectedGoal) {
      return;
    }

    try {
      await updateGoal(selectedGoal.id, { title: nextTitle });
      await refreshAppData();
    } catch (error) {
      await handleRequestError(error, 'Unable to rename goal.');
    }
  }

  async function handleRenameTask(taskId: string, nextTitle: string) {
    try {
      await updateTask(taskId, { title: nextTitle });
      await refreshAppData();
    } catch (error) {
      await handleRequestError(error, 'Unable to rename task.');
    }
  }

  async function handleRemoveTask(taskId: string) {
    try {
      await deleteTask(taskId);
      await refreshAppData();
    } catch (error) {
      await handleRequestError(error, 'Unable to remove task.');
    }
  }

  async function handleArchiveTask(taskId: string) {
    try {
      await updateTask(taskId, { archived: true });
      await refreshAppData();
    } catch (error) {
      await handleRequestError(error, 'Unable to archive task.');
    }
  }

  async function handleScheduleTask(taskId: string, dueDateOnly: string | null) {
    try {
      await updateTask(taskId, { dueDateOnly });
      await refreshAppData();
    } catch (error) {
      await handleRequestError(error, 'Unable to update task schedule.');
    }
  }

  async function handleReorderActiveTasks(activeTaskIds: string[]) {
    try {
      await reorderTasks(activeTaskIds);
      await refreshAppData();
    } catch (error) {
      await handleRequestError(error, 'Unable to reorder tasks.');
      throw error;
    }
  }

  async function handleToggleTaskCompleted(taskId: string, nextCompleted?: boolean) {
    const task = tasks.find((candidate) => candidate.id === taskId);

    if (!task) {
      return;
    }

    try {
      await updateTask(taskId, {
        completed: nextCompleted ?? !isTaskCompleted(task),
      });
      await refreshAppData();
    } catch (error) {
      await handleRequestError(error, 'Unable to update task.');
    }
  }

  async function handleToggleGoalStatus() {
    if (!selectedGoal) {
      return;
    }

    try {
      await updateGoal(selectedGoal.id, {
        status: selectedGoal.status === 'Paused' ? 'active' : 'paused',
      });
      await refreshAppData();
    } catch (error) {
      await handleRequestError(error, 'Unable to update goal.');
    }
  }

  async function handleSendMessage(content: string) {
    setIsSendingChat(true);

    try {
      await sendChatMessage(content);
      await refreshAppData();
    } catch (error) {
      await handleRequestError(error, 'Unable to send chat message.');
      throw error;
    } finally {
      setIsSendingChat(false);
    }
  }

  async function handleCreateGoalTask(goalId: string, title: string) {
    await createTask({ title, goalId });
    await refreshAppData(false, false);
  }

  async function handleCompleteGoalTask(goalId: string, title: string) {
    // Find an open task in this goal matching the title; create one if not found
    const normalizedTitle = title.trim().toLowerCase();
    const existing = tasks.find((t) => {
      const matchesGoal = (t.goal?.id ?? t.goal_id) === goalId;
      const matchesTitle = t.title.trim().toLowerCase() === normalizedTitle;
      const isOpen = !isTaskCompleted(t) && t.status !== 'archived';
      return matchesGoal && matchesTitle && isOpen;
    });

    let taskId: string;
    if (existing) {
      taskId = existing.id;
    } else {
      const created = await createTask({ title, goalId });
      taskId = created.id;
    }

    await updateTask(taskId, { completed: true });
    await refreshAppData(false, false);
  }

  const authContextValue = useMemo(() => ({
    isAuthenticated: authStatus === 'authenticated',
    isAuthenticating,
    user: authUser,
    onLogin: () => {
      void handleStartAuth('login');
    },
    onSignup: () => {
      void handleStartAuth('signup');
    },
    onLogout: () => {
      void handleLogout();
    },
  }), [authStatus, authUser, isAuthenticating]);

  return (
    <AuthContext.Provider value={authContextValue}>
      <LinearGradient
        colors={theme.backgroundGradient}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.background}
      >
        <SafeAreaView style={styles.safeArea}>
          <StatusBar style={theme.statusBar} />

          {errorMessage ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{errorMessage}</Text>
            </View>
          ) : null}

          {isLoading || authStatus === 'loading' ? (
            <View style={styles.loadingPanel}>
              <Text style={[styles.loadingText, { color: theme.heading }]}>Loading Auth0 session...</Text>
            </View>
          ) : null}

          {screen === 'landing' ? (
            <LandingScreen
              isBusy={isAuthenticating || authStatus === 'loading'}
              primaryActionLabel={authStatus === 'authenticated' ? 'Get started' : 'Sign up'}
              secondaryActionLabel={authStatus === 'authenticated' ? 'Continue to my workspace' : 'I already have an account'}
              theme={theme}
              onPrimaryAction={() => {
                if (authStatus === 'authenticated') {
                  setScreen('goal');
                  return;
                }

                void handleStartAuth('signup');
              }}
              onSecondaryAction={() => {
                if (authStatus === 'authenticated') {
                  setScreen('goal');
                  return;
                }

                void handleStartAuth('login');
              }}
              onToggleTheme={toggleTheme}
            />
          ) : null}

          {authStatus === 'authenticated' && screen === 'goal' ? (
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

          {authStatus === 'authenticated' && screen === 'task' ? (
          <TaskScreen
            theme={theme}
            isCompact={isCompactLayout}
            value={taskText}
            onChangeText={setTaskText}
            onToggleTheme={toggleTheme}
            onBack={() => setScreen('goal')}
            onContinue={() => {
              void handleCompleteOnboarding();
            }}
          />
          ) : null}

          {authStatus === 'authenticated' && screen === 'tasks-view' ? (
          <TasksViewScreen
            focusComposerVersion={taskComposerFocusVersion}
            theme={theme}
            goalText={goalText}
            taskText={taskText}
            tasks={tasksViewItems}
            onBackToTaskEntry={() => setScreen('task')}
            onGoToChat={() => setScreen('chat')}
            onGoToDayRing={() => setScreen('day-ring')}
            onGoToGoal={() => setScreen('goals-view')}
            onGoToSearch={() => setScreen('search')}
            onCreateTask={(title) => handleCreateTask(title, selectedGoal?.id ?? null)}
            onRenameTask={handleRenameTask}
            onRemoveTask={handleRemoveTask}
            onArchiveTask={handleArchiveTask}
            onScheduleTask={handleScheduleTask}
            onToggleTaskCompleted={handleToggleTaskCompleted}
            onReorderActiveTasks={handleReorderActiveTasks}
            onToggleTheme={toggleTheme}
          />
          ) : null}

          {authStatus === 'authenticated' && screen === 'day-ring' ? (
          <DayRingViewScreen
            theme={theme}
            todayLabel={todayLabel}
            dueTodayCount={dueTodayCount}
            onBackToTaskEntry={() => setScreen('task')}
            onGoToChat={() => setScreen('chat')}
            onGoToGoal={() => setScreen('goals-view')}
            onGoToNewTask={openNewTaskComposer}
            onGoToSearch={() => setScreen('search')}
            onGoToTasksView={() => setScreen('tasks-view')}
            onToggleTheme={toggleTheme}
          />
          ) : null}

          {authStatus === 'authenticated' && screen === 'goals-view' ? (
          <GoalsViewScreen
            goals={goals.map((goal) => ({
              ...goal,
              taskCount: goalTasksByGoal[goal.id]?.length ?? 0,
              completedCount: goalTasksByGoal[goal.id]?.filter((t) => t.isCompleted).length ?? 0,
            }))}
            theme={theme}
            onBackToGoalEntry={() => setScreen('goal')}
            onCreateNewGoal={(goalTitle) => {
              void handleCreateGoal(goalTitle);
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

          {authStatus === 'authenticated' && screen === 'goal-detail' ? (
          selectedGoal ? (
          <GoalDetailScreen
            goalStatus={selectedGoal.status}
            goalTasks={selectedGoalTasks}
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
              void handleCreateTask(taskTitle, selectedGoal.id);
            }}
            onRenameGoal={(nextTitle) => {
              void handleRenameGoal(nextTitle);
            }}
            onRenameTask={(taskId, nextTitle) => {
              void handleRenameTask(taskId, nextTitle);
            }}
            onRemoveTask={(taskId) => {
              void handleRemoveTask(taskId);
            }}
            onToggleTaskCompleted={(taskId) => {
              void handleToggleTaskCompleted(taskId);
            }}
            onToggleGoalStatus={() => {
              void handleToggleGoalStatus();
            }}
            onToggleTheme={toggleTheme}
          />
          ) : null
          ) : null}

          {authStatus === 'authenticated' && screen === 'goal-history' ? (
          selectedGoal ? (
          <GoalHistoryScreen
            goalTitle={selectedGoal.title}
            history={goalHistoryByGoalId[selectedGoal.id] ?? null}
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
          ) : null
          ) : null}

          {authStatus === 'authenticated' && screen === 'search' ? (
          <SearchScreen
            goalText={goalText}
            goals={goals}
            goalTasksByGoal={goalTasksByGoal}
            taskText={taskText}
            chatMessages={chatMessages}
            theme={theme}
            onGoToChat={() => setScreen('chat')}
            onGoToGoalsView={() => setScreen('goals-view')}
            onGoToNewTask={openNewTaskComposer}
            onGoToTasksView={() => setScreen('tasks-view')}
            onToggleTheme={toggleTheme}
          />
          ) : null}

          {authStatus === 'authenticated' && screen === 'chat' ? (
          <ChatScreen
            theme={theme}
            goalText={goalText}
            taskText={taskText}
            goals={goals.map((g) => ({
              id: g.id,
              title: g.title,
              status: toUiGoalStatus(g.status),
              tasks: (goalTasksByGoal[g.id] ?? []).map((t) => ({
                id: t.id,
                title: t.title,
                isCompleted: t.isCompleted,
              })),
            }))}
            messages={chatMessages}
            isSending={isSendingChat}
            onBack={() => setScreen('task')}
            onGoToGoal={() => setScreen('goals-view')}
            onGoToNewTask={openNewTaskComposer}
            onGoToSearch={() => setScreen('search')}
            onSendMessage={handleSendMessage}
            onCreateGoalTask={handleCreateGoalTask}
            onCompleteGoalTask={handleCompleteGoalTask}
            onGoToTasksView={() => setScreen('tasks-view')}
            onToggleTheme={toggleTheme}
          />
          ) : null}
        </SafeAreaView>
      </LinearGradient>
    </AuthContext.Provider>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  loadingPanel: {
    position: 'absolute',
    top: 24,
    left: 20,
    right: 20,
    zIndex: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.86)',
  },
  loadingText: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  errorBanner: {
    position: 'absolute',
    top: 24,
    left: 20,
    right: 20,
    zIndex: 21,
    borderRadius: 16,
    backgroundColor: 'rgba(125, 16, 16, 0.92)',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  errorBannerText: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
});
