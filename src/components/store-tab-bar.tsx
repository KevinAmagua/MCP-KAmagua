import { Image } from 'expo-image';
import { router, usePathname } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const COLORS = {
  background: '#FBF8F2',
  text: '#382B25',
  muted: '#7B6B60',
  accent: '#9B513D',
  selected: '#F0E2D7',
  line: '#E8DFD5',
};

const TABS = [
  { href: '/', label: 'Inicio', icon: require('@/assets/figma/home.svg') },
  { href: '/explore', label: 'Explorar', icon: require('@/assets/figma/explore.svg') },
  { href: '/sell', label: 'Vender', icon: require('@/assets/figma/plus.svg') },
  { href: '/account', label: 'Mi cuenta', icon: require('@/assets/figma/account.svg') },
] as const;

export function StoreTabBar() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <View style={styles.topRule} />
      {TABS.map((tab) => {
        const isSelected = pathname === tab.href || (tab.href === '/' && pathname === '/index');
        return (
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
            key={tab.href}
            onPress={() => router.navigate(tab.href)}
            style={({ pressed }) => [styles.tab, pressed && styles.pressed]}>
            <View style={[styles.iconBackground, isSelected && styles.iconBackgroundSelected]}>
              <Image
                source={tab.icon}
                style={[styles.icon, { tintColor: isSelected ? COLORS.accent : COLORS.muted }]}
              />
            </View>
            <Text style={[styles.label, isSelected && styles.labelSelected]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 66,
    paddingTop: 8,
    paddingHorizontal: 8,
    backgroundColor: COLORS.background,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-around',
  },
  topRule: {
    position: 'absolute',
    top: 0,
    left: 24,
    right: 24,
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.line,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  iconBackground: {
    width: 40,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBackgroundSelected: {
    backgroundColor: COLORS.selected,
  },
  icon: {
    width: 22,
    height: 22,
  },
  label: {
    color: COLORS.muted,
    fontSize: 10,
  },
  labelSelected: {
    color: COLORS.accent,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.7,
  },
});
