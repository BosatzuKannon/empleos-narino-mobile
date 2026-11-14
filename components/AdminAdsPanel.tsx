// =======================================================
// AdminAdsPanel — Mini-CMS de anuncios (solo admin).
// Lista, crea, edita, activa/desactiva y elimina anuncios.
// La imagen se sube al bucket de Supabase en la carpeta `ads`.
// =======================================================

import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { friendlyErrorMessage } from '@/lib/apiClient';
import {
  createAdvertisement,
  deleteAdvertisement,
  fetchAllAds,
  updateAdvertisement,
  uploadAdvertisementImage,
  type Advertisement,
} from '@/lib/ads';

const PRIMARY_GREEN = '#558B2F';
const DARK_TEXT = '#333333';
const GREY_TEXT = '#666666';

interface FormState {
  name: string;
  description: string;
  redirectUrl: string;
  whatsapp: string;
  expiresAt: string;
  imageUrl: string;
}

const EMPTY_FORM: FormState = {
  name: '',
  description: '',
  redirectUrl: '',
  whatsapp: '',
  expiresAt: '',
  imageUrl: '',
};

const AdminAdsPanel = () => {
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setAds(await fetchAllAds());
    } catch (error) {
      Alert.alert('Anuncios', friendlyErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setField = (key: keyof FormState) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(false);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permisos', 'Necesitamos acceso a tu galería de fotos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    setSaving(true);
    try {
      const imageUrl = await uploadAdvertisementImage(
        asset.uri,
        `ad-${Date.now()}.jpg`,
        asset.mimeType || 'image/jpeg',
      );
      setForm((prev) => ({ ...prev, imageUrl }));
    } catch (error) {
      Alert.alert('Imagen', friendlyErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const submit = async () => {
    if (!form.name.trim() || !form.description.trim() || !form.imageUrl) {
      Alert.alert('Faltan datos', 'Nombre, descripción e imagen son obligatorios.');
      return;
    }

    const date = form.expiresAt.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      Alert.alert('Fecha', 'Usa el formato AAAA-MM-DD.');
      return;
    }

    const parsed = new Date(`${date}T23:59:59`);
    if (Number.isNaN(parsed.getTime())) {
      Alert.alert('Fecha', 'La fecha indicada no es válida.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        imageUrl: form.imageUrl,
        redirectUrl: form.redirectUrl.trim() || null,
        whatsapp: form.whatsapp.trim() || null,
        expiresAt: parsed.toISOString(),
      };

      if (editingId) {
        await updateAdvertisement(editingId, payload);
      } else {
        await createAdvertisement(payload);
      }

      resetForm();
      await load();
    } catch (error) {
      Alert.alert('Error', friendlyErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (ad: Advertisement) => {
    setForm({
      name: ad.name,
      description: ad.description,
      redirectUrl: ad.redirectUrl || '',
      whatsapp: ad.whatsapp || '',
      expiresAt: ad.expiresAt.slice(0, 10),
      imageUrl: ad.imageUrl,
    });
    setEditingId(ad.id);
    setShowForm(true);
  };

  const toggleActive = async (ad: Advertisement) => {
    try {
      await updateAdvertisement(ad.id, { isActive: !ad.isActive });
      await load();
    } catch (error) {
      Alert.alert('Error', friendlyErrorMessage(error));
    }
  };

  const confirmDelete = (ad: Advertisement) => {
    Alert.alert('Eliminar anuncio', `¿Eliminar "${ad.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteAdvertisement(ad.id);
            await load();
          } catch (error) {
            Alert.alert('Error', friendlyErrorMessage(error));
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Anuncios (Admin)</Text>
        <TouchableOpacity
          style={styles.newButton}
          onPress={() => (showForm ? resetForm() : setShowForm(true))}
        >
          <Ionicons name={showForm ? 'close' : 'add'} size={18} color="#FFFFFF" />
          <Text style={styles.newButtonText}>{showForm ? 'Cancelar' : 'Nuevo'}</Text>
        </TouchableOpacity>
      </View>

      {showForm && (
        <View style={styles.formCard}>
          <TextInput
            style={styles.input}
            placeholder="Nombre del anuncio"
            placeholderTextColor="#AAAAAA"
            value={form.name}
            onChangeText={setField('name')}
          />
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Descripción"
            placeholderTextColor="#AAAAAA"
            value={form.description}
            onChangeText={setField('description')}
            multiline
          />
          <TextInput
            style={styles.input}
            placeholder="URL de destino (opcional)"
            placeholderTextColor="#AAAAAA"
            value={form.redirectUrl}
            onChangeText={setField('redirectUrl')}
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="WhatsApp (opcional, ej. 3001234567)"
            placeholderTextColor="#AAAAAA"
            value={form.whatsapp}
            onChangeText={setField('whatsapp')}
            keyboardType="phone-pad"
          />
          <TextInput
            style={styles.input}
            placeholder="Expira el (AAAA-MM-DD)"
            placeholderTextColor="#AAAAAA"
            value={form.expiresAt}
            onChangeText={setField('expiresAt')}
          />

          <TouchableOpacity style={styles.imagePicker} onPress={pickImage} disabled={saving}>
            {form.imageUrl ? (
              <Image source={{ uri: form.imageUrl }} style={styles.imagePreview} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="image-outline" size={22} color={GREY_TEXT} />
                <Text style={styles.imagePlaceholderText}>Seleccionar imagen</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.saveButton} onPress={submit} disabled={saving}>
            {saving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>
                {editingId ? 'Guardar cambios' : 'Crear anuncio'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="small" color={PRIMARY_GREEN} style={styles.loader} />
      ) : ads.length === 0 ? (
        <Text style={styles.emptyText}>Aún no hay anuncios creados.</Text>
      ) : (
        ads.map((ad) => {
          const expired = new Date(ad.expiresAt).getTime() <= Date.now();
          return (
            <View key={ad.id} style={styles.adRow}>
              <Image source={{ uri: ad.imageUrl }} style={styles.adThumb} />
              <View style={styles.adBody}>
                <Text style={styles.adName} numberOfLines={1}>{ad.name}</Text>
                <Text style={styles.adMeta} numberOfLines={1}>
                  {expired
                    ? 'Expirado'
                    : `Vence: ${new Date(ad.expiresAt).toLocaleDateString()}`}
                  {' · '}
                  {ad.isActive ? 'Activo' : 'Inactivo'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => toggleActive(ad)} hitSlop={8} style={styles.iconButton}>
                <Ionicons
                  name={ad.isActive ? 'pause-circle-outline' : 'play-circle-outline'}
                  size={22}
                  color={PRIMARY_GREEN}
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => startEdit(ad)} hitSlop={8} style={styles.iconButton}>
                <Ionicons name="create-outline" size={20} color={GREY_TEXT} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => confirmDelete(ad)} hitSlop={8} style={styles.iconButton}>
                <Ionicons name="trash-outline" size={20} color="#CC0000" />
              </TouchableOpacity>
            </View>
          );
        })
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 25,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: DARK_TEXT,
  },
  newButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PRIMARY_GREEN,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  newButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
    marginLeft: 4,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    elevation: 2,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: DARK_TEXT,
    marginBottom: 8,
  },
  textArea: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  imagePicker: {
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 10,
  },
  imagePreview: {
    width: '100%',
    height: 120,
    borderRadius: 10,
  },
  imagePlaceholder: {
    height: 72,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#CCCCCC',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  imagePlaceholderText: {
    marginLeft: 6,
    color: GREY_TEXT,
    fontSize: 13,
  },
  saveButton: {
    backgroundColor: PRIMARY_GREEN,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  loader: {
    marginVertical: 12,
  },
  emptyText: {
    color: GREY_TEXT,
    fontSize: 13,
  },
  adRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    elevation: 1,
  },
  adThumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
    marginRight: 10,
    backgroundColor: '#F0F0F0',
  },
  adBody: {
    flex: 1,
    marginRight: 6,
  },
  adName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: DARK_TEXT,
  },
  adMeta: {
    fontSize: 12,
    color: GREY_TEXT,
    marginTop: 2,
  },
  iconButton: {
    padding: 4,
  },
});

export default AdminAdsPanel;
