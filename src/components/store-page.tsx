import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StoreTabBar } from '@/components/store-tab-bar';

const BACKGROUND = '#FBF8F2';

type StorePageProps = {
  children: ReactNode;
  contentStyle?: ViewStyle;
};

export function StorePage({ children, contentStyle }: StorePageProps) {
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <View style={styles.page}>
        <ScrollView
          contentContainerStyle={[styles.content, contentStyle]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
        <StoreTabBar />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },
  page: {
    width: '100%',
    maxWidth: 480,
    flex: 1,
    alignSelf: 'center',
  },
  content: {
    flexGrow: 1,
  },
});
