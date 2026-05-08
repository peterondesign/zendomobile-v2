import { useEffect, useRef, useState } from 'react';

import { Feather } from '@expo/vector-icons';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { useAuth } from '../auth-context';
import { Theme } from '../theme';

type SidebarItem = 'chat' | 'tasks' | 'goals';

type AppSidebarProps = {
  activeItem: SidebarItem | null;
  onBack: () => void;
  onClose: () => void;
  onSelectNewTask?: () => void;
  onSelectSearch?: () => void;
  onToggleTheme: () => void;
  theme: Theme;
  title: string;
  visible: boolean;
  onSelectChat?: () => void;
  onSelectGoals?: () => void;
  onSelectTasks?: () => void;
};

const sidebarItems: Array<{
  icon: keyof typeof Feather.glyphMap;
  key: SidebarItem;
  label: string;
}> = [
  { key: 'chat', label: 'Chat', icon: 'square' },
  { key: 'tasks', label: 'Tasks', icon: 'check-square' },
  { key: 'goals', label: 'Goals', icon: 'target' },
];

export function AppSidebar({
  activeItem,
  onBack,
  onClose,
  onSelectNewTask,
  onSelectSearch,
  onToggleTheme,
  theme,
  title,
  visible,
  onSelectChat,
  onSelectGoals,
  onSelectTasks,
}: AppSidebarProps) {
  const { isAuthenticating, onLogout, user } = useAuth();
  const { height, width } = useWindowDimensions();
  const [isMounted, setIsMounted] = useState(visible);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const progress = useRef(new Animated.Value(visible ? 1 : 0)).current;

  const isCompact = width <= 430 || height <= 860;
  const panelWidth = Math.min(width * (isCompact ? 0.88 : 0.82), 360);
  const isDark = theme.logoMode === 'dark';
  const palette = {
    backdrop: isDark ? 'rgba(0, 0, 0, 0.56)' : 'rgba(21, 28, 43, 0.16)',
    panel: isDark ? '#171717' : '#FFFFFF',
    panelBorder: isDark ? 'rgba(255,255,255,0.08)' : '#E4E8F0',
    divider: isDark ? 'rgba(255,255,255,0.08)' : '#E6EAF1',
    buttonBackground: isDark ? '#222222' : '#FFFFFF',
    buttonBorder: isDark ? 'rgba(255,255,255,0.1)' : '#D2D8E3',
    title: isDark ? '#D4D4D4' : '#181A21',
    icon: isDark ? '#D4D4D4' : '#1A1D24',
    itemActiveBackground: isDark ? '#232323' : '#EEF1F5',
    itemText: isDark ? '#969696' : '#7A8498',
    itemActiveText: isDark ? '#D4D4D4' : '#1A1D24',
    pillBorder: isDark ? 'rgba(255,255,255,0.1)' : '#D2D8E3',
    pillText: isDark ? '#D4D4D4' : '#1A1D24',
    profileCard: isDark ? '#202020' : '#EEF1F5',
    avatar: isDark ? '#2B2B2B' : '#D6DCE6',
    badgeBorder: isDark ? 'rgba(255,255,255,0.1)' : '#C8CFDA',
    badgeBackground: isDark ? '#262626' : '#F8FAFD',
    badgeText: isDark ? '#B7B7B7' : '#4F5668',
    email: isDark ? '#8F8F8F' : '#70798B',
    collapsibleBackground: isDark ? '#1C1C1C' : '#F8FAFD',
    collapsibleBorder: isDark ? 'rgba(255,255,255,0.08)' : '#E1E6EF',
    actionText: isDark ? '#CFCFCF' : '#2A2F39',
    upgradeBackground: isDark ? '#2A2A2A' : '#101114',
    upgradeText: '#FFFFFF',
  };

  useEffect(() => {
    if (visible) {
      setIsMounted(true);
    }

    Animated.timing(progress, {
      toValue: visible ? 1 : 0,
      duration: visible ? 220 : 180,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && !visible) {
        setIsMounted(false);
      }
    });
  }, [progress, visible]);

  useEffect(() => {
    if (!visible) {
      setIsAccountOpen(false);
    }
  }, [visible]);

  if (!isMounted) {
    return null;
  }

  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-panelWidth, 0],
  });

  const backdropOpacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  function handleSelect(item: SidebarItem) {
    if (item === activeItem) {
      onClose();
      return;
    }

    if (item === 'chat') {
      onSelectChat?.();
      return;
    }

    if (item === 'tasks') {
      onSelectTasks?.();
      return;
    }

    onSelectGoals?.();
  }

  const displayName = user?.name?.trim() || 'Signed in user';
  const displayEmail = user?.email?.trim() || 'Auth0 account';

  return (
    <View style={styles.layer} pointerEvents="box-none">
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Animated.View style={[styles.backdropFill, { opacity: backdropOpacity, backgroundColor: palette.backdrop }]} />
      </Pressable>

      <Animated.View style={[styles.panel, { width: panelWidth, transform: [{ translateX }], backgroundColor: palette.panel, borderRightColor: palette.panelBorder }]}> 
        <View style={[styles.topRow, isCompact && styles.topRowCompact]}>
          <Pressable style={[styles.topButton, isCompact && styles.topButtonCompact, { backgroundColor: palette.buttonBackground, borderColor: palette.buttonBorder }]} onPress={onBack}>
            <Feather name="arrow-left" size={20} color={palette.icon} />
          </Pressable>

          <Text style={[styles.topTitle, isCompact && styles.topTitleCompact, { color: palette.title }]}>{title}</Text>
        </View>

        <View style={[styles.divider, { backgroundColor: palette.divider }]} />

        <View style={[styles.menu, isCompact && styles.menuCompact]}>
          {sidebarItems.map((item) => {
            const isActive = item.key === activeItem;

            return (
              <Pressable
                key={item.key}
                onPress={() => handleSelect(item.key)}
                style={[styles.item, isCompact && styles.itemCompact, isActive && styles.itemActive, isActive && { backgroundColor: palette.itemActiveBackground }]}
              >
                <Feather name={item.icon} size={isCompact ? 22 : 24} color={isActive ? palette.itemActiveText : palette.itemText} />
                <Text
                  style={[
                    isActive ? styles.itemTextActive : styles.itemText,
                    isCompact && (isActive ? styles.itemTextActiveCompact : styles.itemTextCompact),
                    { color: isActive ? palette.itemActiveText : palette.itemText },
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}

          <View style={[styles.spacer, isCompact && styles.spacerCompact]} />

          <Pressable style={[styles.item, isCompact && styles.itemCompact]} onPress={onSelectNewTask}>
            <Feather name="plus" size={isCompact ? 22 : 24} color={palette.itemText} />
            <Text style={[styles.itemText, isCompact && styles.itemTextCompact, { color: palette.itemText }]}>New Task</Text>
          </Pressable>

          <Pressable style={[styles.item, isCompact && styles.itemCompact]} onPress={onSelectSearch}>
            <Feather name="search" size={isCompact ? 22 : 24} color={palette.itemText} />
            <Text style={[styles.itemText, isCompact && styles.itemTextCompact, { color: palette.itemText }]}>Search</Text>
          </Pressable>

          <View style={[styles.topicPicker, isCompact && styles.topicPickerCompact, { borderColor: palette.pillBorder, backgroundColor: palette.buttonBackground }]}>
            <Text style={[styles.topicPickerText, isCompact && styles.topicPickerTextCompact, { color: palette.pillText }]}>Development</Text>
            <Feather name="chevron-down" size={isCompact ? 20 : 22} color={palette.itemText} />
          </View>
        </View>

        <View style={[styles.bottom, isCompact && styles.bottomCompact]}>
          <Pressable style={[styles.themeButton, isCompact && styles.themeButtonCompact, { backgroundColor: palette.buttonBackground, borderColor: palette.buttonBorder }]} onPress={onToggleTheme}>
            <Feather name={theme.themeIcon === '☀' ? 'sun' : 'moon'} size={isCompact ? 24 : 28} color={palette.icon} />
          </Pressable>

          <Pressable style={[styles.profileCard, isCompact && styles.profileCardCompact, { backgroundColor: palette.profileCard }]} onPress={() => setIsAccountOpen((current) => !current)}>
            <View style={[styles.avatar, isCompact && styles.avatarCompact, { backgroundColor: palette.avatar }]}>
              <View style={[styles.avatarInner, isCompact && styles.avatarInnerCompact]} />
            </View>

            <View style={[styles.profileBody, isCompact && styles.profileBodyCompact]}>
              <View style={[styles.profileNameRow, isCompact && styles.profileNameRowCompact]}>
                <Text style={[styles.profileName, isCompact && styles.profileNameCompact, { color: palette.title }]} numberOfLines={1}>{displayName}</Text>
                <View style={[styles.profileBadge, { borderColor: palette.badgeBorder, backgroundColor: palette.badgeBackground }]}>
                  <Text style={[styles.profileBadgeText, isCompact && styles.profileBadgeTextCompact, { color: palette.badgeText }]}>Premium</Text>
                </View>
              </View>

              <Text style={[styles.profileEmail, isCompact && styles.profileEmailCompact, { color: palette.email }]} numberOfLines={1}>{displayEmail}</Text>
            </View>

            <Feather name={isAccountOpen ? 'chevron-up' : 'chevron-down'} size={isCompact ? 20 : 22} color={palette.itemText} />
          </Pressable>

          {isAccountOpen ? (
            <View style={[styles.accountPanel, isCompact && styles.accountPanelCompact, { backgroundColor: palette.collapsibleBackground, borderColor: palette.collapsibleBorder }]}>
              <Pressable style={[styles.accountAction, isCompact && styles.accountActionCompact]}>
                <Feather name="message-square" size={isCompact ? 18 : 20} color={palette.itemText} />
                <Text style={[styles.accountActionText, isCompact && styles.accountActionTextCompact, { color: palette.actionText }]}>Leave feedback</Text>
              </Pressable>

              <View style={[styles.accountDivider, { backgroundColor: palette.divider }]} />

              <Pressable style={[styles.accountAction, isCompact && styles.accountActionCompact]} onPress={onLogout} disabled={isAuthenticating}>
                <Feather name="log-out" size={isCompact ? 18 : 20} color={palette.itemText} />
                <Text style={[styles.accountActionText, isCompact && styles.accountActionTextCompact, { color: palette.actionText }]}>{isAuthenticating ? 'Signing out...' : 'Logout'}</Text>
              </Pressable>
            </View>
          ) : null}

          <Pressable style={[styles.upgradeButton, isCompact && styles.upgradeButtonCompact, { backgroundColor: palette.upgradeBackground }]}>
            <Text style={[styles.upgradeButtonText, isCompact && styles.upgradeButtonTextCompact, { color: palette.upgradeText }]}>Upgrade Plan</Text>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  backdropFill: {
    ...StyleSheet.absoluteFillObject,
  },
  panel: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    paddingTop: 18,
    paddingHorizontal: 22,
    paddingBottom: 22,
    justifyContent: 'space-between',
    borderRightWidth: 1,
    borderRightColor: '#E4E8F0',
    shadowColor: '#111111',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 10, height: 0 },
  },
  topRow: {
    height: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  topRowCompact: {
    height: 60,
    gap: 12,
  },
  topButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D2D8E3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topButtonCompact: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  topTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
    color: '#181A21',
    letterSpacing: -0.6,
  },
  topTitleCompact: {
    fontSize: 20,
    lineHeight: 24,
    letterSpacing: -0.4,
  },
  divider: {
    height: 1,
    backgroundColor: '#E6EAF1',
    marginHorizontal: -22,
  },
  menu: {
    flex: 1,
    paddingTop: 28,
  },
  menuCompact: {
    paddingTop: 20,
  },
  item: {
    minHeight: 64,
    borderRadius: 18,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    marginBottom: 10,
  },
  itemCompact: {
    minHeight: 54,
    borderRadius: 16,
    paddingHorizontal: 16,
    gap: 14,
    marginBottom: 8,
  },
  itemActive: {
    backgroundColor: '#EEF1F5',
  },
  itemText: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '400',
    color: '#7A8498',
    letterSpacing: -0.5,
  },
  itemTextCompact: {
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.3,
  },
  itemTextActive: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '500',
    color: '#1A1D24',
    letterSpacing: -0.5,
  },
  itemTextActiveCompact: {
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.3,
  },
  spacer: {
    height: 26,
  },
  spacerCompact: {
    height: 16,
  },
  topicPicker: {
    minHeight: 64,
    marginTop: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D2D8E3',
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topicPickerCompact: {
    minHeight: 54,
    marginTop: 12,
    borderRadius: 16,
    paddingHorizontal: 16,
  },
  topicPickerText: {
    fontSize: 19,
    lineHeight: 24,
    fontWeight: '500',
    color: '#1A1D24',
    letterSpacing: -0.3,
  },
  topicPickerTextCompact: {
    fontSize: 17,
    lineHeight: 22,
  },
  bottom: {
    gap: 18,
  },
  bottomCompact: {
    gap: 14,
  },
  themeButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 1,
    borderColor: '#D2D8E3',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  themeButtonCompact: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  profileCard: {
    minHeight: 98,
    borderRadius: 24,
    backgroundColor: '#EEF1F5',
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  profileCardCompact: {
    minHeight: 84,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  accountPanel: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  accountPanelCompact: {
    borderRadius: 18,
  },
  accountAction: {
    minHeight: 56,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  accountActionCompact: {
    minHeight: 50,
    paddingHorizontal: 14,
    gap: 10,
  },
  accountActionText: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  accountActionTextCompact: {
    fontSize: 15,
    lineHeight: 20,
  },
  accountDivider: {
    height: 1,
    marginHorizontal: 16,
  },
  upgradeButton: {
    minHeight: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  upgradeButtonCompact: {
    minHeight: 48,
    borderRadius: 16,
    paddingHorizontal: 16,
  },
  upgradeButtonText: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  upgradeButtonTextCompact: {
    fontSize: 15,
    lineHeight: 18,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#D6DCE6',
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  avatarCompact: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  avatarInner: {
    width: 26,
    height: 22,
    borderTopLeftRadius: 13,
    borderTopRightRadius: 13,
    backgroundColor: '#202229',
  },
  avatarInnerCompact: {
    width: 22,
    height: 18,
    borderTopLeftRadius: 11,
    borderTopRightRadius: 11,
  },
  profileBody: {
    flex: 1,
    gap: 6,
  },
  profileBodyCompact: {
    gap: 4,
  },
  profileNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  profileNameRowCompact: {
    gap: 6,
  },
  profileName: {
    flexShrink: 1,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '800',
    color: '#1A1D24',
    letterSpacing: -0.4,
  },
  profileNameCompact: {
    fontSize: 16,
    lineHeight: 20,
    letterSpacing: -0.3,
  },
  profileBadge: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#C8CFDA',
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#F8FAFD',
  },
  profileBadgeText: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '500',
    color: '#4F5668',
  },
  profileBadgeTextCompact: {
    fontSize: 10,
    lineHeight: 12,
  },
  profileEmail: {
    fontSize: 14,
    lineHeight: 18,
    color: '#70798B',
    letterSpacing: -0.2,
  },
  profileEmailCompact: {
    fontSize: 12,
    lineHeight: 16,
  },
});