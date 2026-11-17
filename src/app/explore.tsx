import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { StorePage } from '@/components/store-page';

const COLORS = {
  text: '#382B25',
  muted: '#7B6B60',
  accent: '#9B513D',
  chip: '#F4EEE6',
};

const CATEGORIES = [
  { name: 'Hogar', image: require('@/assets/figma/vase-arena.jpeg') },
  { name: 'Textiles', image: require('@/assets/figma/blanket-cloud.jpeg') },
];

export default function ExploreScreen() {
  return (
    <StorePage contentStyle={styles.content}>
      <Text style={styles.title}>Explorar</Text>
      <Text style={styles.subtitle}>Encuentra algo especial para tu hogar.</Text>
      <View style={styles.grid}>
        {CATEGORIES.map((category) => (
          <Pressable
            accessibilityRole="button"
            key={category.name}
            onPress={() => router.navigate('/')}>
            <Image contentFit="cover" source={category.image} style={styles.image} />
            <Text style={styles.categoryName}>{category.name}</Text>
            <Text style={styles.categoryHint}>Descubre la colección</Text>
          </Pressable>
        ))}
      </View>
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
  grid: {
    gap: 20,
    marginTop: 28,
  },
  image: {
    width: '100%',
    aspectRatio: 1.9,
    borderRadius: 18,
    backgroundColor: COLORS.chip,
  },
  categoryName: {
    color: COLORS.text,
    fontFamily: 'serif',
    fontSize: 22,
    fontWeight: '700',
    marginTop: 10,
  },
  categoryHint: {
    color: COLORS.accent,
    fontSize: 12,
    marginTop: 3,
  },
});
