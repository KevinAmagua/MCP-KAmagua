import { Image } from 'expo-image';
import { ImagePlus, Pencil, Plus, Search, Trash, X } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { StorePage } from '@/components/store-page';
import { supabase } from '@/lib/supabase';

const COLORS = {
  text: '#382B25',
  muted: '#7B6B60',
  accent: '#9B513D',
  background: '#FBF8F2',
  surface: '#FFFFFF',
  chip: '#F4EEE6',
  line: '#E8DFD5',
  success: '#54735A',
};

const CATEGORIES = ['Tecnología', 'Accesorios', 'Calzado', 'Hogar', 'Textiles'];

type Product = {
  id: string;
  created_at: string;
  name: string;
  description: string | null;
  price: number | string;
  stock: number;
  category: string;
  image_url: string | null;
};

type FormState = {
  name: string;
  description: string;
  price: string;
  stock: string;
  category: string;
  image_url: string;
};

const emptyForm: FormState = {
  name: '',
  description: '',
  price: '',
  stock: '0',
  category: CATEGORIES[0],
  image_url: '',
};

export default function SellScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const loadProducts = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('id, created_at, name, description, price, stock, category, image_url')
      .order('created_at', { ascending: false });

    if (error) {
      Alert.alert('Error', 'No se pudieron cargar los productos.');
    } else {
      setProducts((data ?? []) as Product[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadProducts(false);
  }, [loadProducts]);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) =>
      [p.name, p.description ?? '', p.category].some((v) => v.toLowerCase().includes(q)),
    );
  }, [products, search]);

  function updateForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function startEdit(product: Product) {
    setEditingId(product.id);
    setForm({
      name: product.name ?? '',
      description: product.description ?? '',
      price: String(product.price ?? ''),
      stock: String(product.stock ?? 0),
      category: product.category ?? CATEGORIES[0],
      image_url: product.image_url ?? '',
    });
  }

  async function saveProduct() {
    const name = form.name.trim();
    const category = form.category.trim();
    const priceValue = Number(form.price.replace(',', '.'));
    const stockValue = Number.parseInt(form.stock || '0', 10);

    if (!name) {
      Alert.alert('Falta información', 'Ingresa el nombre del producto.');
      return;
    }
    if (!category) {
      Alert.alert('Falta información', 'Selecciona o ingresa una categoría.');
      return;
    }
    if (!Number.isFinite(priceValue) || priceValue < 0) {
      Alert.alert('Precio inválido', 'Ingresa un precio válido.');
      return;
    }
    if (!Number.isInteger(stockValue) || stockValue < 0) {
      Alert.alert('Stock inválido', 'Ingresa un stock válido.');
      return;
    }

    const payload = {
      name,
      description: form.description.trim() || null,
      price: priceValue,
      stock: stockValue,
      category,
      image_url: form.image_url.trim() || null,
    };

    setSaving(true);
    const query = editingId
      ? supabase.from('products').update(payload).eq('id', editingId)
      : supabase.from('products').insert(payload);
    const { error } = await query;

    if (error) {
      Alert.alert('Error', error.message || 'No se pudo guardar el producto.');
    } else {
      resetForm();
      await loadProducts();
    }
    setSaving(false);
  }

  function confirmDelete(product: Product) {
    Alert.alert('Eliminar producto', `¿Eliminar "${product.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('products').delete().eq('id', product.id);
          if (error) {
            Alert.alert('Error', error.message || 'No se pudo eliminar el producto.');
          } else {
            if (editingId === product.id) resetForm();
            await loadProducts();
          }
        },
      },
    ]);
  }

  return (
    <StorePage contentStyle={styles.content}>
      <View style={styles.heading}>
        <Text style={styles.title}>Vender</Text>
        <Text style={styles.subtitle}>Administra los productos de tu tienda.</Text>
      </View>

      <View style={styles.formCard}>
        <View style={styles.cardHeading}>
          <View style={styles.addIconBackground}>
            {editingId ? (
              <Pencil color={COLORS.accent} size={18} strokeWidth={2} />
            ) : (
              <Plus color={COLORS.accent} size={19} strokeWidth={2} />
            )}
          </View>
          <View style={styles.cardHeadingText}>
            <Text style={styles.cardTitle}>{editingId ? 'Editar producto' : 'Agregar producto'}</Text>
            <Text style={styles.cardSubtitle}>
              {editingId ? 'Actualiza los datos y guarda los cambios.' : 'Completa los datos para publicarlo.'}
            </Text>
          </View>
          {editingId ? (
            <Pressable accessibilityRole="button" onPress={resetForm} style={styles.cancelEdit}>
              <X color={COLORS.muted} size={16} strokeWidth={2} />
            </Pressable>
          ) : null}
        </View>

        <Text style={styles.label}>Imagen (URL)</Text>
        <View style={styles.imageRow}>
          <View style={styles.uploadIcon}>
            <ImagePlus color={COLORS.accent} size={22} strokeWidth={1.8} />
          </View>
          <TextInput
            accessibilityLabel="URL de imagen"
            onChangeText={(v) => updateForm('image_url', v)}
            placeholder="https://..."
            placeholderTextColor={COLORS.muted}
            style={[styles.input, styles.imageInput]}
            value={form.image_url}
          />
        </View>

        <FormField
          label="Nombre del producto"
          onChangeText={(v) => updateForm('name', v)}
          placeholder="Ej. Jarrón de cerámica"
          value={form.name}
        />
        <FormField
          label="Descripción"
          multiline
          onChangeText={(v) => updateForm('description', v)}
          placeholder="Describe los materiales, detalles y características"
          style={styles.descriptionInput}
          value={form.description}
        />

        <View style={styles.fieldRow}>
          <View style={styles.halfField}>
            <FormField
              keyboardType="decimal-pad"
              label="Precio"
              onChangeText={(v) => updateForm('price', v)}
              placeholder="$ 0.00"
              value={form.price}
            />
          </View>
          <View style={styles.halfField}>
            <FormField
              keyboardType="number-pad"
              label="Stock"
              onChangeText={(v) => updateForm('stock', v)}
              placeholder="0"
              value={form.stock}
            />
          </View>
        </View>

        <Text style={styles.label}>Categoría</Text>
        <View style={styles.categoryWrap}>
          {CATEGORIES.map((cat) => {
            const selected = form.category === cat;
            return (
              <Pressable
                key={cat}
                onPress={() => updateForm('category', cat)}
                style={[styles.categoryChip, selected && styles.categoryChipSelected]}>
                <Text style={[styles.categoryChipText, selected && styles.categoryChipTextSelected]}>
                  {cat}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <FormField
          label="Otra categoría"
          onChangeText={(v) => updateForm('category', v)}
          placeholder="O escribe una categoría"
          value={CATEGORIES.includes(form.category) ? '' : form.category}
        />

        <Pressable
          accessibilityRole="button"
          disabled={saving}
          onPress={saveProduct}
          style={({ pressed }) => [styles.publishButton, (pressed || saving) && styles.pressed]}>
          {saving ? (
            <ActivityIndicator color={COLORS.surface} />
          ) : (
            <>
              <Plus color={COLORS.surface} size={18} strokeWidth={2.2} />
              <Text style={styles.publishButtonText}>
                {editingId ? 'Guardar cambios' : 'Publicar producto'}
              </Text>
            </>
          )}
        </Pressable>
      </View>

      <View style={styles.productsHeading}>
        <View>
          <Text style={styles.sectionTitle}>Tus productos</Text>
          <Text style={styles.productsCount}>{products.length} productos en tu tienda</Text>
        </View>
        <View style={styles.publishedCount}>
          <Text style={styles.publishedCountText}>{products.length} publicados</Text>
        </View>
      </View>

      <View style={styles.searchBox}>
        <Search color={COLORS.muted} size={18} strokeWidth={1.8} />
        <TextInput
          accessibilityLabel="Buscar entre mis productos"
          onChangeText={setSearch}
          placeholder="Buscar mis productos"
          placeholderTextColor={COLORS.muted}
          style={styles.searchInput}
          value={search}
        />
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator color={COLORS.accent} />
        </View>
      ) : filteredProducts.length === 0 ? (
        <View style={styles.centerBox}>
          <Text style={styles.emptyText}>
            {products.length === 0 ? 'Aún no hay productos.' : 'No hay resultados.'}
          </Text>
        </View>
      ) : (
        <View style={styles.productList}>
          {filteredProducts.map((product) => (
            <View key={product.id} style={styles.productCard}>
              {product.image_url ? (
                <Image contentFit="cover" source={{ uri: product.image_url }} style={styles.productImage} />
              ) : (
                <View style={[styles.productImage, styles.productImagePlaceholder]}>
                  <ImagePlus color={COLORS.muted} size={22} strokeWidth={1.6} />
                </View>
              )}
              <View style={styles.productInfo}>
                <View style={styles.productTopLine}>
                  <Text numberOfLines={1} style={styles.productName}>
                    {product.name}
                  </Text>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>Stock {product.stock}</Text>
                  </View>
                </View>
                <Text numberOfLines={1} style={styles.productDescription}>
                  {product.description || product.category}
                </Text>
                <View style={styles.productBottomLine}>
                  <Text style={styles.productPrice}>$ {Number(product.price).toFixed(2)}</Text>
                  <View style={styles.actions}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Editar ${product.name}`}
                      onPress={() => startEdit(product)}
                      style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}>
                      <Pencil color={COLORS.muted} size={16} strokeWidth={1.8} />
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Eliminar ${product.name}`}
                      onPress={() => confirmDelete(product)}
                      style={({ pressed }) => [
                        styles.actionButton,
                        styles.deleteButton,
                        pressed && styles.pressed,
                      ]}>
                      <Trash color={COLORS.accent} size={16} strokeWidth={1.8} />
                    </Pressable>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}
    </StorePage>
  );
}

type FormFieldProps = {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  multiline?: boolean;
  keyboardType?: 'default' | 'decimal-pad' | 'number-pad';
  style?: object;
};

function FormField({
  label,
  placeholder,
  value,
  onChangeText,
  multiline = false,
  keyboardType = 'default',
  style,
}: FormFieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        keyboardType={keyboardType}
        multiline={multiline}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.muted}
        style={[styles.input, multiline && styles.multilineInput, style]}
        textAlignVertical={multiline ? 'top' : 'center'}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 28,
  },
  heading: {
    marginBottom: 18,
  },
  title: {
    color: COLORS.text,
    fontFamily: 'serif',
    fontSize: 30,
    fontWeight: '700',
  },
  subtitle: {
    color: COLORS.muted,
    fontSize: 13,
    marginTop: 5,
  },
  formCard: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  cardHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    marginBottom: 18,
  },
  addIconBackground: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeadingText: {
    flex: 1,
  },
  cancelEdit: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    color: COLORS.text,
    fontFamily: 'serif',
    fontSize: 19,
    fontWeight: '700',
  },
  cardSubtitle: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 2,
  },
  label: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 7,
  },
  imageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 13,
  },
  imageInput: {
    flex: 1,
    marginBottom: 0,
  },
  uploadIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  field: {
    marginBottom: 13,
  },
  input: {
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: '#FCFAF7',
    color: COLORS.text,
    fontSize: 12,
  },
  multilineInput: {
    minHeight: 76,
    paddingTop: 11,
  },
  descriptionInput: {
    paddingTop: 11,
  },
  fieldRow: {
    flexDirection: 'row',
    gap: 12,
  },
  halfField: {
    flex: 1,
  },
  categoryWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: COLORS.chip,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  categoryChipSelected: {
    backgroundColor: '#F8ECE8',
    borderColor: COLORS.accent,
  },
  categoryChipText: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: '600',
  },
  categoryChipTextSelected: {
    color: COLORS.accent,
  },
  publishButton: {
    minHeight: 46,
    borderRadius: 23,
    backgroundColor: COLORS.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 2,
  },
  publishButtonText: {
    color: COLORS.surface,
    fontSize: 13,
    fontWeight: '600',
  },
  productsHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 25,
    marginBottom: 13,
  },
  sectionTitle: {
    color: COLORS.text,
    fontFamily: 'serif',
    fontSize: 23,
    fontWeight: '700',
  },
  productsCount: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 3,
  },
  publishedCount: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#EAF0E8',
  },
  publishedCountText: {
    color: COLORS.success,
    fontSize: 10,
    fontWeight: '600',
  },
  searchBox: {
    minHeight: 42,
    paddingHorizontal: 12,
    borderRadius: 13,
    backgroundColor: COLORS.chip,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    padding: 0,
    color: COLORS.text,
    fontSize: 12,
  },
  centerBox: {
    minHeight: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: COLORS.muted,
    fontSize: 12,
  },
  productList: {
    gap: 10,
  },
  productCard: {
    minHeight: 92,
    padding: 10,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.line,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  productImage: {
    width: 70,
    height: 70,
    borderRadius: 12,
    backgroundColor: COLORS.chip,
  },
  productImagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  productInfo: {
    flex: 1,
    minWidth: 0,
  },
  productTopLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  productName: {
    flex: 1,
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: '#EAF0E8',
  },
  statusText: {
    color: COLORS.success,
    fontSize: 9,
    fontWeight: '600',
  },
  productDescription: {
    color: COLORS.muted,
    fontSize: 10,
    marginTop: 4,
  },
  productBottomLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 7,
  },
  productPrice: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    gap: 6,
  },
  actionButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    backgroundColor: '#F8ECE8',
  },
  pressed: {
    opacity: 0.72,
  },
});
