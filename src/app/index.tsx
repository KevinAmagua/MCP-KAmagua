import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { StorePage } from '@/components/store-page';

const COLORS = {
  background: '#FBF8F2',
  text: '#382B25',
  muted: '#7B6B60',
  accent: '#9B513D',
  chip: '#F4EEE6',
  line: '#E8DFD5',
  button: '#F0E5DA',
  white: '#FFFFFF',
};

const CATEGORIES = ['Todo', 'Hogar', 'Textiles', 'Accesorios'] as const;
type Category = (typeof CATEGORIES)[number];
const CATEGORY_WIDTHS: Record<Category, number> = {
  Todo: 63,
  Hogar: 75,
  Textiles: 85,
  Accesorios: 107,
};

const PRODUCTS = [
  {
    id: 'vase',
    name: 'Jarrón Arena',
    description: 'Cerámica artesanal',
    price: 480,
    category: 'Hogar',
    image: require('@/assets/figma/vase-arena.jpeg'),
    isNew: true,
  },
  {
    id: 'blanket',
    name: 'Manta Nube',
    description: 'Algodón suave',
    price: 690,
    category: 'Textiles',
    image: require('@/assets/figma/blanket-cloud.jpeg'),
    isNew: false,
  },
] as const;

export default function HomeScreen() {
  const [category, setCategory] = useState<Category>('Todo');
  const [search, setSearch] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [cartCount, setCartCount] = useState(0);

  const products = useMemo(
    () =>
      PRODUCTS.filter((product) => {
        const matchesCategory = category === 'Todo' || product.category === category;
        const query = search.trim().toLocaleLowerCase();
        const matchesSearch =
          query.length === 0 ||
          product.name.toLocaleLowerCase().includes(query) ||
          product.description.toLocaleLowerCase().includes(query);

        return matchesCategory && matchesSearch;
      }),
    [category, search],
  );

  function toggleFavorite(productId: string) {
    setFavorites((current) =>
      current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId],
    );
  }

  return (
    <StorePage contentStyle={styles.pageContent}>
      <View style={styles.header}>
        <View>
          <Text style={styles.brand}>PoliTemu</Text>
          <Text style={styles.tagline}>Calidad · Precio</Text>
        </View>
        <Pressable
          accessibilityLabel={`Carrito, ${cartCount} productos`}
          accessibilityRole="button"
          onPress={() =>
            Alert.alert(
              'Tu carrito',
              cartCount === 0
                ? 'Aún no has agregado productos.'
                : `Tienes ${cartCount} ${cartCount === 1 ? 'producto' : 'productos'}.`,
            )
          }
          style={({ pressed }) => [styles.bagButton, pressed && styles.pressed]}>
          <Image source={require('@/assets/figma/bag.svg')} style={styles.bagIcon} />
          {cartCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartCount}</Text>
            </View>
          )}
        </Pressable>
      </View>

      <View style={styles.searchBox}>
        <Image source={require('@/assets/figma/search.svg')} style={styles.searchIcon} />
        <TextInput
          accessibilityLabel="Buscar productos"
          onChangeText={setSearch}
          placeholder="Buscar"
          placeholderTextColor={COLORS.muted}
          returnKeyType="search"
          style={styles.searchInput}
          value={search}
        />
      </View>

      <View style={styles.promoCard}>
        <Image
          contentFit="cover"
          source={require('@/assets/figma/hero-collection.jpeg')}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={[
            'rgba(234, 221, 203, 0.97)',
            'rgba(234, 221, 203, 0.8)',
            'rgba(234, 221, 203, 0)',
          ]}
          end={{ x: 1, y: 0.5 }}
          locations={[0, 0.58, 1]}
          start={{ x: 0, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.promoContent}>
          <Text style={styles.promoEyebrow}>NUEVA COLECCIÓN</Text>
          <Text style={styles.promoTitle}>
            Nuevos productos{'\n'}50 % de descuento
          </Text>
          <Text style={styles.promoDescription}>Productos para el hogar</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.navigate('/explore')}
            style={({ pressed }) => [styles.promoButton, pressed && styles.pressed]}>
            <Text style={styles.promoButtonText}>Explorar colección</Text>
            <Image source={require('@/assets/figma/arrow-right.svg')} style={styles.arrowIcon} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryList}>
        {CATEGORIES.map((item) => {
          const isSelected = item === category;
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              key={item}
              onPress={() => setCategory(item)}
              style={({ pressed }) => [
                styles.categoryChip,
                { width: CATEGORY_WIDTHS[item] },
                isSelected && styles.categoryChipSelected,
                pressed && styles.pressed,
              ]}>
              <Text style={[styles.categoryText, isSelected && styles.categoryTextSelected]}>
                {item}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.sectionHeading}>
        <Text style={styles.sectionTitle}>Para tu día a día</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.navigate('/explore')}
          hitSlop={8}>
          <Text style={styles.seeAll}>Ver todo</Text>
        </Pressable>
      </View>

      {products.length > 0 ? (
        <View style={styles.productGrid}>
          {products.map((product) => {
            const isFavorite = favorites.includes(product.id);
            return (
              <View key={product.id} style={styles.productCard}>
                <View style={styles.productImageFrame}>
                  <Image contentFit="cover" source={product.image} style={styles.productImage} />
                  {product.isNew && (
                    <View style={styles.newBadge}>
                      <Text style={styles.newBadgeText}>Nuevo</Text>
                    </View>
                  )}
                  <Pressable
                    accessibilityLabel={
                      isFavorite ? `Quitar ${product.name} de favoritos` : `Guardar ${product.name}`
                    }
                    accessibilityRole="button"
                    onPress={() => toggleFavorite(product.id)}
                    style={({ pressed }) => [styles.favoriteButton, pressed && styles.pressed]}>
                    <Image
                      source={require('@/assets/figma/heart.svg')}
                      style={[styles.heartIcon, isFavorite && styles.favoriteIconActive]}
                    />
                  </Pressable>
                </View>
                <Text numberOfLines={1} style={styles.productName}>
                  {product.name}
                </Text>
                <Text numberOfLines={1} style={styles.productDescription}>
                  {product.description}
                </Text>
                <View style={styles.productFooter}>
                  <Text style={styles.price}>$ {product.price}</Text>
                  <Pressable
                    accessibilityLabel={`Agregar ${product.name} al carrito`}
                    accessibilityRole="button"
                    onPress={() => setCartCount((count) => count + 1)}
                    style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}>
                    <Image source={require('@/assets/figma/plus.svg')} style={styles.addIcon} />
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>
      ) : (
        <View style={styles.emptySearch}>
          <Text style={styles.emptySearchText}>No encontramos productos con esa búsqueda.</Text>
        </View>
      )}
    </StorePage>
  );
}

const styles = StyleSheet.create({
  pageContent: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 24,
  },
  header: {
    minHeight: 56,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    color: COLORS.text,
    fontFamily: 'serif',
    fontSize: 34,
    fontWeight: '700',
    lineHeight: 40,
  },
  tagline: {
    color: COLORS.muted,
    fontSize: 9,
    letterSpacing: 1.5,
    marginTop: 1,
  },
  bagButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F2EAE0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bagIcon: {
    width: 22,
    height: 22,
  },
  cartBadge: {
    position: 'absolute',
    right: -2,
    top: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '700',
  },
  searchBox: {
    height: 43,
    marginBottom: 20,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: '#F2EDE5',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchIcon: {
    width: 21,
    height: 21,
  },
  searchInput: {
    flex: 1,
    padding: 0,
    color: COLORS.text,
    fontSize: 13,
  },
  promoCard: {
    height: 248,
    marginBottom: 22,
    overflow: 'hidden',
    borderRadius: 20,
    justifyContent: 'center',
  },
  promoContent: {
    paddingHorizontal: 20,
    alignItems: 'flex-start',
  },
  promoEyebrow: {
    color: COLORS.accent,
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 1.3,
    marginBottom: 14,
  },
  promoTitle: {
    color: COLORS.text,
    fontFamily: 'serif',
    fontSize: 27,
    fontWeight: '700',
    lineHeight: 31,
  },
  promoDescription: {
    color: COLORS.text,
    fontSize: 12,
    marginTop: 12,
  },
  promoButton: {
    height: 41,
    paddingLeft: 15,
    paddingRight: 13,
    marginTop: 25,
    borderRadius: 21,
    backgroundColor: COLORS.accent,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  promoButtonText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '600',
  },
  arrowIcon: {
    width: 17,
    height: 17,
    tintColor: COLORS.white,
  },
  categoryList: {
    gap: 8,
    paddingBottom: 22,
  },
  categoryChip: {
    minHeight: 36,
    paddingHorizontal: 17,
    borderRadius: 18,
    backgroundColor: COLORS.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryChipSelected: {
    backgroundColor: COLORS.text,
  },
  categoryText: {
    color: COLORS.muted,
    fontSize: 12,
  },
  categoryTextSelected: {
    color: COLORS.white,
    fontWeight: '600',
  },
  sectionHeading: {
    minHeight: 39,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: COLORS.text,
    fontFamily: 'serif',
    fontSize: 24,
    fontWeight: '700',
  },
  seeAll: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: '600',
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 20,
  },
  productCard: {
    width: '48%',
  },
  productImageFrame: {
    width: '100%',
    aspectRatio: 169 / 173,
    marginBottom: 10,
    overflow: 'hidden',
    borderRadius: 16,
    backgroundColor: COLORS.chip,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  newBadge: {
    position: 'absolute',
    left: 10,
    top: 12,
    minWidth: 49,
    height: 22,
    paddingHorizontal: 9,
    borderRadius: 11,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newBadgeText: {
    color: COLORS.accent,
    fontSize: 9,
    fontWeight: '600',
  },
  favoriteButton: {
    position: 'absolute',
    right: 10,
    top: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartIcon: {
    width: 16,
    height: 16,
  },
  favoriteIconActive: {
    tintColor: COLORS.accent,
  },
  productName: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '500',
  },
  productDescription: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 4,
  },
  productFooter: {
    minHeight: 38,
    marginTop: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  price: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addIcon: {
    width: 18,
    height: 18,
    tintColor: COLORS.accent,
  },
  emptySearch: {
    minHeight: 150,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptySearchText: {
    color: COLORS.muted,
    fontSize: 14,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.75,
  },
});
