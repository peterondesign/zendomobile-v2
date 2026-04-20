import { useState } from 'react';

import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppSidebar } from '../components/AppSidebar';
import { Theme } from '../theme';

type DayRingViewScreenProps = {
  theme: Theme;
  onBackToTaskEntry: () => void;
  onGoToChat: () => void;
  onGoToGoal: () => void;
  onGoToNewTask: () => void;
  onGoToSearch: () => void;
  onGoToTasksView: () => void;
  onToggleTheme: () => void;
};

export function DayRingViewScreen({
  theme,
  onBackToTaskEntry,
  onGoToChat,
  onGoToGoal,
  onGoToNewTask,
  onGoToSearch,
  onGoToTasksView,
  onToggleTheme,
}: DayRingViewScreenProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isDark = theme.logoMode === 'dark';
  const palette = {
    page: isDark ? '#111111' : '#F9FAFC',
    header: isDark ? 'rgba(18, 18, 18, 0.94)' : '#D8D8D8',
    headerButton: isDark ? '#222222' : '#FFFFFF',
    headerButtonBorder: isDark ? 'rgba(255,255,255,0.1)' : '#D8DEE8',
    headerText: isDark ? '#D4D4D4' : '#17191E',
    panel: isDark ? '#1A1A1A' : '#FFFFFF',
    panelBorder: isDark ? 'rgba(255,255,255,0.08)' : '#E7EBF2',
    muted: isDark ? '#959595' : '#788295',
    ring: isDark ? '#7D7D7D' : '#B2BAC8',
    ringTrack: isDark ? 'rgba(255,255,255,0.05)' : '#E6EAF1',
    accent: isDark ? '#6C7CFF' : '#4D63FF',
  };

  function handleOpenSidebar() {
    setIsSidebarOpen(true);
    setIsMenuOpen(false);
  }

  function handleGoToListView() {
    setIsMenuOpen(false);
    requestAnimationFrame(() => {
      onGoToTasksView();
    });
  }

  return (
    <View style={[styles.container, { backgroundColor: palette.page }]}> 
      <View style={[styles.header, { backgroundColor: palette.header }]}> 
        <View style={styles.headerRow}>
          <Pressable style={[styles.headerIconButton, { backgroundColor: palette.headerButton, borderColor: palette.headerButtonBorder }]} onPress={handleOpenSidebar}>
            <View style={styles.stackIcon}>
              <View style={[styles.stackBar, { borderColor: palette.headerText }]} />
              <View style={[styles.stackBar, { borderColor: palette.headerText }]} />
            </View>
          </Pressable>

          <Text style={[styles.headerTitle, { color: palette.headerText }]}>Tasks</Text>

          <View style={styles.headerMenuAnchor}>
            <Pressable style={[styles.headerIconButton, { backgroundColor: palette.headerButton, borderColor: palette.headerButtonBorder }]} onPress={() => setIsMenuOpen((current) => !current)}>
              <Feather name="more-horizontal" size={22} color={palette.headerText} />
            </Pressable>

            {isMenuOpen ? (
              <View style={[styles.headerMenuPanel, { backgroundColor: palette.panel, borderColor: palette.panelBorder }]}>
                <Pressable style={styles.headerMenuItem} onPress={handleGoToListView}>
                  <Text style={[styles.headerMenuItemText, { color: palette.headerText }]}>List View</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={[styles.pageTitle, { color: palette.headerText }]}>Today</Text>

          <Pressable style={[styles.collapseButton, { backgroundColor: palette.headerButton, borderColor: palette.headerButtonBorder }]}>
            <Feather name="chevron-down" size={28} color={palette.muted} />
          </Pressable>
        </View>

        <View style={styles.dateNavigator}>
          <Pressable style={[styles.dateArrowButton, { backgroundColor: palette.headerButton, borderColor: palette.headerButtonBorder }]}>
            <Feather name="chevron-left" size={28} color={palette.muted} />
          </Pressable>

          <View style={[styles.datePill, { backgroundColor: palette.headerButton, borderColor: palette.headerButtonBorder }]}>
            <Text style={[styles.datePillText, { color: palette.headerText }]}>Sun, 22 Feb</Text>
          </View>

          <Pressable style={[styles.dateArrowButton, { backgroundColor: palette.headerButton, borderColor: palette.headerButtonBorder }]}>
            <Feather name="chevron-right" size={28} color={palette.muted} />
          </Pressable>
        </View>

        <View style={styles.ringWrap}>
          <View style={[styles.ringArc, { borderColor: palette.ringTrack }]} />

          <View style={[styles.tick, styles.tickStart, { backgroundColor: palette.ring }]} />
          <View style={[styles.tick, styles.tickQuarter, { backgroundColor: palette.ring }]} />
          <View style={[styles.tick, styles.tickMid, { backgroundColor: palette.ring }]} />
          <View style={[styles.tick, styles.tickThreeQuarter, { backgroundColor: palette.ring }]} />
          <View style={[styles.tick, styles.tickEnd, { backgroundColor: palette.ring }]} />

          <Text style={[styles.timeLabel, styles.labelStart, { color: palette.muted }]}>12a</Text>
          <Text style={[styles.timeLabel, styles.labelQuarter, { color: palette.muted }]}>6a</Text>
          <Text style={[styles.timeLabel, styles.labelMid, { color: palette.muted }]}>12p</Text>
          <Text style={[styles.timeLabel, styles.labelThreeQuarter, { color: palette.muted }]}>6p</Text>
          <Text style={[styles.timeLabel, styles.labelEnd, { color: palette.muted }]}>12a</Text>

          <Text style={[styles.nowLabel, { color: palette.accent }]}>NOW</Text>
          <View style={[styles.nowDot, { backgroundColor: palette.accent }]} />

          <View style={[styles.eventDot, styles.eventDotFirst, { backgroundColor: palette.accent }]} />
          <View style={[styles.eventDot, styles.eventDotSecond, { backgroundColor: palette.accent }]} />
        </View>
      </View>

      <AppSidebar
        activeItem="tasks"
        onBack={() => {
          setIsSidebarOpen(false);
          onBackToTaskEntry();
        }}
        onClose={() => setIsSidebarOpen(false)}
        onSelectChat={() => {
          setIsSidebarOpen(false);
          onGoToChat();
        }}
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
        onSelectTasks={() => setIsSidebarOpen(false)}
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
    backgroundColor: '#F9FAFC',
  },
  header: {
    height: 104,
    backgroundColor: '#D8D8D8',
    paddingHorizontal: 18,
    justifyContent: 'flex-end',
    paddingBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerIconButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D8DEE8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerMenuAnchor: {
    position: 'relative',
  },
  headerMenuPanel: {
    position: 'absolute',
    top: 54,
    right: 0,
    minWidth: 150,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E7EBF2',
    backgroundColor: '#FFFFFF',
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
    width: 18,
    height: 18,
    flexDirection: 'row',
    gap: 4,
  },
  stackBar: {
    flex: 1,
    borderRadius: 3,
    borderWidth: 2.5,
    borderColor: '#181A21',
  },
  headerTitle: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '800',
    color: '#17191E',
    letterSpacing: -0.5,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 34,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pageTitle: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    color: '#17191E',
    letterSpacing: -0.8,
  },
  collapseButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 1,
    borderColor: '#D8DEE8',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateNavigator: {
    marginTop: 66,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
  },
  dateArrowButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#E1E5EC',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  datePill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E1E5EC',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 28,
    paddingVertical: 12,
  },
  datePillText: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '500',
    color: '#252A34',
    letterSpacing: -0.4,
  },
  ringWrap: {
    marginTop: 180,
    height: 360,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringArc: {
    position: 'absolute',
    width: 620,
    height: 310,
    borderTopLeftRadius: 310,
    borderTopRightRadius: 310,
    borderWidth: 14,
    borderBottomWidth: 0,
    borderColor: '#D7DDE7',
    top: 34,
  },
  tick: {
    position: 'absolute',
    width: 3,
    height: 22,
    borderRadius: 2,
    backgroundColor: '#A8B1C2',
  },
  tickStart: {
    left: 42,
    top: 265,
  },
  tickQuarter: {
    left: 80,
    top: 120,
    transform: [{ rotate: '-58deg' }],
  },
  tickMid: {
    top: 32,
  },
  tickThreeQuarter: {
    right: 80,
    top: 120,
    transform: [{ rotate: '58deg' }],
  },
  tickEnd: {
    right: 42,
    top: 265,
  },
  timeLabel: {
    position: 'absolute',
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '500',
    color: '#778295',
  },
  labelStart: {
    left: 42,
    top: 268,
  },
  labelQuarter: {
    left: 154,
    top: 138,
  },
  labelMid: {
    top: 64,
  },
  labelThreeQuarter: {
    right: 158,
    top: 138,
  },
  labelEnd: {
    right: 42,
    top: 268,
  },
  nowLabel: {
    position: 'absolute',
    top: 18,
    left: 240,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '800',
    color: '#FF4B3E',
  },
  nowDot: {
    position: 'absolute',
    top: 52,
    left: 252,
    width: 21,
    height: 21,
    borderRadius: 11,
    backgroundColor: '#FF4B3E',
  },
  eventDot: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#18A0E6',
    top: 46,
  },
  eventDotFirst: {
    right: 232,
  },
  eventDotSecond: {
    right: 214,
    top: 52,
  },
});