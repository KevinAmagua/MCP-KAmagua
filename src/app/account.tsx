import { StyleSheet, Text } from 'react-native';

import { StorePage } from '@/components/store-page';

const COLORS = {
  text: '#382B25',
  muted: '#7B6B60',
};

export default function AccountScreen() {
  return (
    <StorePage contentStyle={styles.content}>
      <Text style={styles.title}>Mi cuenta</Text>
      <Text style={styles.subtitle}>Administra tu perfil y tus preferencias.</Text>
    </StorePage>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 24,
    paddingTop: 22,
  },
  title: {
    color: COLORS.text,
    fontFamily: 'serif',
    fontSize: 30,
    fontWeight: '700',
  },
  subtitle: {
    color: COLORS.muted,
    fontSize: 14,
    marginTop: 8,
  },
});
