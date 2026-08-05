// =======================================================
// Crear Servicio — Formulario de publicación de un servicio
// (talent marketplace) para usuarios CANDIDATE.
//  - Categoría, Municipio, Precio y Tipo de precio.
//  - Sube una imagen opcional a Supabase Storage (presigned).
//  - Crea el servicio vía POST /services/createService.
// =======================================================

import logo from '@/assets/images/logo.png';
import GradientBackground from '@/components/GradientBackground';
import { useAppAlerts } from '@/hooks/useAppAlerts';
import { apiFetch } from '@/lib/apiClient';
import municipiosNarino from '@/lib/constants/municipiosNarino';
import {
  createService,
  fetchServiceCategories,
  PRICE_TYPE_LABELS,
  type ServiceCategory,
  type ServicePriceType,
} from '@/lib/services';
import { useAuthStore } from '@/store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const PRESIGNED_URL_API = `${process.env.EXPO_PUBLIC_API_URL}/offers/generatePresignedUrl`;

const PRICE_TYPE_OPTIONS: ServicePriceType[] = ['HOURLY', 'FIXED', 'TO_BE_AGREED'];

interface CreateServiceData {
  title: string;
  categoryId: string;
  municipality: string;
  price: string;
  priceType: ServicePriceType;
  description: string;
}

interface CreateServiceErrors {
  title?: string;
  categoryId?: string;
  municipality?: string;
  price?: string;
  description?: string;
}

const CreateServiceScreen = () => {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { showSuccess, showError, dialogElement } = useAppAlerts();

  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formErrors, setFormErrors] = useState<CreateServiceErrors>({});
  const [serviceImage, setServiceImage] = useState<any>(null);
  const [priceDisplay, setPriceDisplay] = useState('');

  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const [formData, setFormData] = useState<CreateServiceData>({
    title: '',
    categoryId: '',
    municipality: '',
    price: '',
    priceType: 'FIXED',
    description: '',
  });

  useEffect(() => {
    if (!isAuthenticated || !user?.sub) {
      router.replace('/(tabs)/auth');
      return;
    }

    loadCategories();
  }, [isAuthenticated, user]);

  const loadCategories = async () => {
    try {
      setCategoriesLoading(true);
      const list = await fetchServiceCategories();
      setCategories(list);
    } catch (err) {
      console.error('❌ Error al cargar categorías:', err);
      showError('No se pudieron cargar las categorías de servicios.');
    } finally {
      setCategoriesLoading(false);
    }
  };

  const handleChange = (field: keyof CreateServiceData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field as keyof CreateServiceErrors]) {
      setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handlePriceChange = (value: string) => {
    const raw = value.replace(/\D/g, '');
    setFormData((prev) => ({ ...prev, price: raw }));
    if (!raw) {
      setPriceDisplay('');
    } else {
      const num = parseInt(raw, 10);
      setPriceDisplay(`$ ${num.toLocaleString('es-CO')}`);
    }
    if (formErrors.price) {
      setFormErrors((prev) => ({ ...prev, price: undefined }));
    }
  };

  const validateForm = (data: CreateServiceData): boolean => {
    const errors: CreateServiceErrors = {};

    if (!data.title.trim()) {
      errors.title = 'El título es obligatorio.';
    }

    if (!data.categoryId) {
      errors.categoryId = 'Selecciona una categoría.';
    }

    if (!data.municipality) {
      errors.municipality = 'Selecciona un municipio.';
    }

    const parsedPrice = parseInt(data.price, 10) || 0;
    if (data.priceType !== 'TO_BE_AGREED') {
      if (!data.price.trim()) {
        errors.price = 'El precio es obligatorio.';
      } else if (parsedPrice <= 0) {
        errors.price = 'El precio debe ser mayor a cero.';
      }
    }

    if (!data.description.trim()) {
      errors.description = 'La descripción es obligatoria.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleImageUpload = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showError('Necesitamos permisos para acceder a tu galería de fotos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (result.canceled) return;

      const asset = result.assets[0];
      const imageData = {
        uri: asset.uri,
        fileName: `service-${Date.now()}.jpg`,
        type: asset.mimeType || 'image/jpeg',
      };
      setServiceImage(imageData);
    } catch (err) {
      console.error('❌ Error seleccionando imagen:', err);
      showError('No se pudo seleccionar la imagen.');
    }
  };

  const uploadFileToS3 = async (
    fileUri: string,
    fileName: string,
    fileType: string,
  ): Promise<string> => {
    const data = await apiFetch(PRESIGNED_URL_API, {
      method: 'POST',
      authenticated: true,
      body: JSON.stringify({ fileName, fileType, fileCategory: 'images' }),
    });

    const { signedUrl, url } = data;
    if (!signedUrl || !url) {
      throw new Error('No se recibió la URL firmada del servidor.');
    }

    const fileResponse = await fetch(fileUri);
    const blob = await fileResponse.blob();

    const uploadResponse = await fetch(signedUrl, {
      method: 'PUT',
      body: blob,
      headers: { 'Content-Type': fileType },
    });

    if (!uploadResponse.ok) {
      throw new Error(`Error subiendo archivo: ${uploadResponse.status}`);
    }

    return url;
  };

  const handleSubmit = async () => {
    if (!validateForm(formData)) {
      showError('Por favor, corrige los errores en el formulario.');
      return;
    }

    if (!user?.sub) {
      showError('No se pudo identificar al usuario. Inicia sesión nuevamente.');
      return;
    }

    setLoading(true);

    try {
      let imageUrl: string | undefined;

      if (serviceImage) {
        setUploadingImage(true);
        imageUrl = await uploadFileToS3(
          serviceImage.uri,
          serviceImage.fileName,
          serviceImage.type,
        );
      }

      const price = formData.price ? parseInt(formData.price, 10) : undefined;

      await createService({
        title: formData.title.trim(),
        description: formData.description.trim(),
        municipality: formData.municipality,
        categoryId: formData.categoryId,
        price,
        priceType: formData.priceType,
        imageUrl: imageUrl || undefined,
      });

      showSuccess('¡Servicio publicado con éxito!');
      router.back();
    } catch (error) {
      console.error('❌ Error creando el servicio:', error);
      showError(
        (error as any)?.message || 'No se pudo crear el servicio. Intenta nuevamente.',
      );
    } finally {
      setUploadingImage(false);
      setLoading(false);
    }
  };

  const getErrorMessage = (field: keyof CreateServiceErrors) =>
    formErrors[field] ? (
      <Text style={styles.fieldError}>{formErrors[field]}</Text>
    ) : null;

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.appHeader}>
          <Image source={logo} style={styles.logo} />
          <Text style={styles.appNameText}>Empleos Nariño</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <Ionicons name="close-circle-outline" size={30} color="#666666" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.titleText}>Crear Nuevo Servicio</Text>
          <Text style={styles.subtitleText}>
            Ofrece tus habilidades como profesional independiente en Nariño.
          </Text>

          <View style={styles.formContainer}>
            <Text style={styles.label}>Imagen del servicio (Opcional)</Text>
            <TouchableOpacity
              onPress={handleImageUpload}
              style={styles.imageUploadButton}
              disabled={loading || uploadingImage}
            >
              <Ionicons name="cloud-upload-outline" size={24} color="#558B2F" />
              <Text style={styles.imageUploadText}>
                {uploadingImage ? 'Subiendo...' : 'Cargar imagen'}
              </Text>
            </TouchableOpacity>
            {serviceImage ? (
              <Image source={{ uri: serviceImage.uri }} style={styles.uploadedImage} />
            ) : null}

            <Text style={[styles.label, !!formErrors.title && styles.errorLabel]}>
              Título del servicio *
            </Text>
            <TextInput
              style={[styles.input, !!formErrors.title && styles.inputError]}
              placeholder="Ej. Plomería a domicilio"
              value={formData.title}
              onChangeText={(text) => handleChange('title', text)}
              editable={!loading}
            />
            {getErrorMessage('title')}

            <Text style={[styles.label, !!formErrors.categoryId && styles.errorLabel]}>
              Categoría *
            </Text>
            <View
              style={[styles.pickerContainer, !!formErrors.categoryId && styles.inputError]}
            >
              {categoriesLoading ? (
                <View style={styles.pickerLoading}>
                  <ActivityIndicator size="small" color="#558B2F" />
                </View>
              ) : (
                <Picker
                  selectedValue={formData.categoryId}
                  onValueChange={(itemValue) => handleChange('categoryId', itemValue)}
                  style={styles.picker}
                  enabled={!loading}
                >
                  <Picker.Item label="Selecciona una categoría" value="" />
                  {categories.map((category) => (
                    <Picker.Item
                      key={category.id}
                      label={category.name}
                      value={category.id}
                    />
                  ))}
                </Picker>
              )}
            </View>
            {getErrorMessage('categoryId')}

            <Text style={[styles.label, !!formErrors.municipality && styles.errorLabel]}>
              Municipio *
            </Text>
            <View
              style={[styles.pickerContainer, !!formErrors.municipality && styles.inputError]}
            >
              <Picker
                selectedValue={formData.municipality}
                onValueChange={(itemValue) => handleChange('municipality', itemValue)}
                style={styles.picker}
                enabled={!loading}
              >
                <Picker.Item label="Selecciona un municipio" value="" />
                {municipiosNarino.map((municipio) => (
                  <Picker.Item key={municipio} label={municipio} value={municipio} />
                ))}
              </Picker>
            </View>
            {getErrorMessage('municipality')}

            <Text style={styles.label}>Tipo de precio</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.priceType}
                onValueChange={(itemValue) =>
                  handleChange('priceType', itemValue as string)
                }
                style={styles.picker}
                enabled={!loading}
              >
                {PRICE_TYPE_OPTIONS.map((option) => (
                  <Picker.Item key={option} label={PRICE_TYPE_LABELS[option]} value={option} />
                ))}
              </Picker>
            </View>

            {formData.priceType !== 'TO_BE_AGREED' && (
              <>
                <Text style={[styles.label, !!formErrors.price && styles.errorLabel]}>
                  Precio *
                </Text>
                <TextInput
                  style={[styles.input, !!formErrors.price && styles.inputError]}
                  placeholder="$ 50.000"
                  keyboardType="numeric"
                  value={priceDisplay}
                  onChangeText={handlePriceChange}
                  editable={!loading}
                />
                {getErrorMessage('price')}
                <Text style={styles.hintText}>
                  {formData.priceType === 'HOURLY'
                    ? 'Se mostrará como precio por hora.'
                    : 'Se mostrará como precio fijo del servicio.'}
                </Text>
              </>
            )}

            <Text style={[styles.label, !!formErrors.description && styles.errorLabel]}>
              Descripción *
            </Text>
            <TextInput
              style={[styles.input, styles.textArea, !!formErrors.description && styles.inputError]}
              placeholder="Describe el servicio, tu experiencia y disponibilidad."
              multiline
              value={formData.description}
              onChangeText={(text) => handleChange('description', text)}
              editable={!loading}
            />
            {getErrorMessage('description')}
          </View>

          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>Publicar Servicio</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
      {dialogElement}
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    marginBottom: 50,
  },
  appHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    justifyContent: 'flex-start',
  },
  logo: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
  },
  appNameText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginLeft: 0,
  },
  closeButton: {
    position: 'absolute',
    right: 20,
    top: 10,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  titleText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 5,
  },
  subtitleText: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 20,
  },
  formContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 5,
    marginTop: 10,
  },
  errorLabel: {
    color: '#d32f2f',
  },
  hintText: {
    fontSize: 12,
    color: '#666666',
    marginTop: 5,
  },
  input: {
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333333',
  },
  inputError: {
    borderColor: '#d32f2f',
    borderWidth: 1.5,
  },
  fieldError: {
    color: '#d32f2f',
    fontSize: 12,
    marginTop: 4,
    marginBottom: 10,
    marginLeft: 5,
    fontWeight: '500',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    overflow: 'hidden',
  },
  pickerLoading: {
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  picker: {
    height: 50,
    width: '100%',
    color: '#333333',
  },
  imageUploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5E9',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#558B2F',
    borderStyle: 'dashed',
  },
  imageUploadText: {
    marginLeft: 10,
    color: '#558B2F',
    fontWeight: 'bold',
    fontSize: 16,
  },
  uploadedImage: {
    width: '100%',
    height: 150,
    borderRadius: 10,
    resizeMode: 'cover',
    marginTop: 10,
  },
  saveButton: {
    backgroundColor: '#558B2F',
    paddingVertical: 15,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 20,
  },
  saveButtonDisabled: {
    backgroundColor: '#A5D6A7',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default CreateServiceScreen;
