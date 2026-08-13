import { apiFetch } from '@/lib/apiClient';
import hiringPlaceholder from '@/assets/images/hiring.png';
import logo from '@/assets/images/logo.png';
import GradientBackground from '@/components/GradientBackground';
import { useAuthStore } from '@/store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

const nariñoMunicipalities = [
  "Pasto", "Ipiales", "Tumaco", "Sandoná", "La Unión", "San Juan de Pasto", "La Cruz", "Samaniego", "Consacá", "Taminango", "Génova", "Cumbitara"
];

// URLs de los servicios
const PRESIGNED_URL_API = `${process.env.EXPO_PUBLIC_API_URL}/offers/generatePresignedUrl`;
const CREATE_OFFER_API = `${process.env.EXPO_PUBLIC_API_URL}/offers/createOffer`;
const GENERATE_CHECKOUT_API = `${process.env.EXPO_PUBLIC_API_URL}/wompi/generate-checkout`;
const APP_REDIRECT_PROXY = 'https://empleos-narino-backend.onrender.com/wompi/app-redirect?link=';

type OfferPlanType = 'STANDARD' | 'FEATURED';

const PLAN_OPTIONS: {
  type: OfferPlanType;
  name: string;
  price: string;
  description: string;
}[] = [
  {
    type: 'STANDARD',
    name: 'Plan Estándar',
    price: '$7.000',
    description: 'Publicación por 1 mes',
  },
  {
    type: 'FEATURED',
    name: 'Plan Destacado',
    price: '$10.000',
    description: 'Publicación por 1 mes con mayor visibilidad',
  },
];

interface OfferData {
  title: string;
  company: string; 
  description: string;
  location: string;
  modality: string;
  availablePositions: string;
  salary: string;
  contractType: string;
}

interface OfferErrors {
  title?: string;
  company?: string;
  description?: string;
  location?: string;
  modality?: string;
  availablePositions?: string;
  salary?: string;
  contractType?: string;
  receiptImage?: string;
}

const CreateOfferScreen = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<OfferErrors>({});
  const [offerData, setOfferData] = useState<OfferData>({
    title: '',
    company: '', 
    description: '',
    location: '',
    modality: 'Presencial',
    availablePositions: '1', 
    salary: '',
    contractType: 'Indefinido',
  });
  const [offerImage, setOfferImage] = useState<any>(null); 
  const [receiptImage, setReceiptImage] = useState<any>(null); 
  const [salaryDisplay, setSalaryDisplay] = useState('');
  const [planType, setPlanType] = useState<OfferPlanType>('STANDARD');

  // --- Funciones de Toast ---
  const showToast = (message: string, type: 'error' | 'success' = 'error') => {
    Toast.show({
      type: type,
      text1: type === 'success' ? 'Éxito' : 'Error',
      text2: message,
      position: 'bottom',
    });
  };

  // --- Función de Validación ---
  const validateForm = (data: OfferData) => {
    const errors: OfferErrors = {};
    const parsedSalary = parseInt(data.salary.replace(/\D/g, '')) || 0;
    const parsedPositions = parseInt(data.availablePositions) || 0;

    // Campos Obligatorios
    if (!data.title.trim()) errors.title = 'El título es obligatorio.';
    if (!data.description.trim()) errors.description = 'La descripción es obligatoria.';
    if (!data.location.trim()) errors.location = 'La ubicación es obligatoria.';
    
    // Validación Salario
    if (!data.salary.trim()) {
        errors.salary = 'El salario es obligatorio.';
    } else if (parsedSalary <= 0) {
        errors.salary = 'El salario debe ser mayor a cero.';
    }

    // Validación Cupos
    if (parsedPositions <= 0) {
        errors.availablePositions = 'Debe haber al menos 1 cupo disponible.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const formatCOP = (raw: string) => {
    if (!raw) return '';
    const num = parseInt(raw, 10);
    return `$ ${num.toLocaleString('es-CO')}`;
  };

  const handleSalaryChange = (value: string) => {
    const raw = value.replace(/\D/g, '');
    setOfferData(prev => ({ ...prev, salary: raw }));
    setSalaryDisplay(formatCOP(raw));
    if (formErrors.salary) {
      setFormErrors(prev => ({ ...prev, salary: undefined }));
    }
  };

  // Handler para limpiar errores al cambiar inputs
  const handleChange = (field: keyof OfferData, value: string) => {
    setOfferData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Función para subir archivo a S3 y obtener URL pública
  const uploadFileToS3 = async (fileUri, fileName, fileType, fileCategory = 'images') => {
    try {
      // 1. Obtener signed URL del backend (con autenticación)
      const data = await apiFetch(PRESIGNED_URL_API, {
        method: 'POST',
        authenticated: true,
        body: JSON.stringify({ fileName, fileType, fileCategory }),
      });

      const { signedUrl, url } = data;

      // 2. Leer y subir a S3
      const fileResponse = await fetch(fileUri);
      const blob = await fileResponse.blob();

      const uploadResponse = await fetch(signedUrl, {
        method: 'PUT',
        body: blob,
        headers: { 'Content-Type': fileType },
      });

      if (uploadResponse.ok) {
        return url;
      } else {
        throw new Error('Error subiendo archivo a S3');
      }
    } catch (error) {
      console.error('Error en uploadFileToS3:', error);
      throw error;
    }
  };

  const handleImageUpload = async (imageType: 'oferta' | 'comprobante') => {
    try {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          showToast('Necesitamos permisos para acceder a tu galería de fotos.');
          return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });

        if (result.canceled) return;

        const asset = result.assets[0];
        const imageData = {
            uri: asset.uri,
            fileName: `${imageType}-${Date.now()}.jpg`,
            type: 'image/jpeg'
        };

        if (imageType === 'oferta') {
          setOfferImage(imageData);
        } else {
          setReceiptImage(imageData);
          setFormErrors(prev => ({ ...prev, receiptImage: undefined }));
        }
    } catch (e) {
        console.error('Error seleccionando imagen:', e);
        showToast('No se pudo seleccionar la imagen.');
    }
  };

  const handleSave = async () => {
    // 1. Ejecutar validaciones
    if (!validateForm(offerData)) {
        showToast('Por favor, corrige los errores en el formulario.');
        return;
    }
    
    if (!user?.sub) {
      showToast('No se pudo identificar al usuario. Por favor inicia sesión nuevamente.');
      return;
    }

    setLoading(true);

    try {
      console.log('Iniciando proceso de creación de oferta...');

      let imageUrl = '';

      if (offerImage) {
        imageUrl = await uploadFileToS3(
          offerImage.uri, 
          offerImage.fileName, 
          offerImage.type,
          'images'
        );
      }

      const companyName = (user as any).companyName || 'Mi Empresa';

      const offerPayload = {
        titulo: offerData.title,
        empresa: companyName,
        ubicacion: offerData.location,
        salario: parseInt(offerData.salary.replace(/\D/g, '')) || 0,
        tipo_contrato: offerData.contractType,
        modality: offerData.modality,
        descripcion: offerData.description,
        requisitos: imageUrl,
        cupos: parseInt(offerData.availablePositions) || 1,
      };

      const json = await apiFetch(`${CREATE_OFFER_API}/${user.sub}`, {
        method: 'POST',
        authenticated: true,
        body: JSON.stringify(offerPayload),
      });

      const offer = json?.offer || json;
      if (!offer?.id) {
        throw new Error('No se recibió la oferta creada.');
      }

      // 1. La oferta queda en estado PENDING_PAYMENT. 2. Generamos el checkout
      // de Wompi y lo abrimos. Wompi valida que redirect-url sea http(s),
      // así que apuntamos a un proxy del backend que responde con un 302 al
      // deep link real de la app.
      const proxyUrl =
        APP_REDIRECT_PROXY +
        encodeURIComponent(Linking.createURL('/(tabs)/offers'));
      const checkout = await apiFetch(GENERATE_CHECKOUT_API, {
        method: 'POST',
        authenticated: true,
        body: JSON.stringify({
          entityType: 'OFFER',
          entityId: offer.id,
          planType,
          redirectUrl: proxyUrl,
        }),
      });

      const result = await WebBrowser.openAuthSessionAsync(
        checkout.checkoutUrl,
        Linking.createURL('/(tabs)/offers'),
      );

      // El webhook confirma el pago; mientras tanto la oferta queda en
      // "verificando pago" en Mis Vacantes con su badge.
      if (result.type === 'success') {
        Toast.show({
          type: 'success',
          text1: '¡Oferta creada!',
          text2: 'Tu oferta fue creada correctamente. El pago se confirmará en unos minutos.',
          position: 'bottom',
        });
      } else {
        Toast.show({
          type: 'info',
          text1: 'Pago pendiente',
          text2: 'Completa el pago desde Mis Vacantes para publicar tu oferta.',
          position: 'bottom',
        });
      }
      router.replace('/(tabs)/offers');

    } catch (error) {
      console.error('Error creando oferta:', error);
      showToast('No se pudo crear la oferta. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };
  
  const getErrorMessage = (field: keyof OfferErrors) => {
    return formErrors[field] ? <Text style={styles.fieldError}>{formErrors[field]}</Text> : null;
  };


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
          <Text style={styles.titleText}>Crear Nueva Oferta</Text>
          <Text style={styles.subtitleText}>
            Completa los siguientes campos para publicar tu oferta de trabajo.
          </Text>

          <View style={styles.formContainer}>
            <Text style={styles.label}>Plan de publicación *</Text>
            <View style={styles.planOptions}>
              {PLAN_OPTIONS.map((plan) => {
                const selected = planType === plan.type;
                return (
                  <TouchableOpacity
                    key={plan.type}
                    style={[styles.planCard, selected && styles.planCardSelected]}
                    onPress={() => setPlanType(plan.type)}
                    disabled={loading}
                    activeOpacity={0.85}
                  >
                    <View style={styles.planRow}>
                      <Ionicons
                        name={selected ? 'radio-button-on' : 'radio-button-off'}
                        size={22}
                        color={selected ? '#558B2F' : '#999999'}
                      />
                      <View style={styles.planInfo}>
                        <Text style={[styles.planName, selected && styles.planNameSelected]}>
                          {plan.name}
                        </Text>
                        <Text style={styles.planPrice}>{plan.price}</Text>
                        <Text style={styles.planDescription}>{plan.description}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Carga de Imagen de la Oferta */}
            <Text style={styles.label}>Imagen de la oferta (Opcional)</Text>
            <TouchableOpacity 
              onPress={() => handleImageUpload('oferta')} 
              style={styles.imageUploadButton}
              disabled={loading}
            >
              <Ionicons name="cloud-upload-outline" size={24} color="#558B2F" />
              <Text style={styles.imageUploadText}>
                {loading ? 'Cargando...' : 'Cargar imagen'}
              </Text>
            </TouchableOpacity>
            {offerImage ? (
              <Image source={{ uri: offerImage.uri }} style={styles.uploadedImage} />
            ) : (
              <Image source={hiringPlaceholder} style={styles.uploadedImage} />
            )}

            <Text style={[styles.label, !!formErrors.title && styles.errorLabel]}>Título de la oferta *</Text>
            <TextInput
              style={[styles.input, !!formErrors.title && styles.inputError]}
              placeholder="Ej. Desarrollador Web Full Stack"
              value={offerData.title}
              onChangeText={(text) => handleChange('title', text)}
              editable={!loading}
            />
            {getErrorMessage('title')}

            <Text style={[styles.label, !!formErrors.description && styles.errorLabel]}>Descripción del trabajo *</Text>
            <TextInput
              style={[styles.input, styles.textArea, !!formErrors.description && styles.inputError]}
              placeholder="Describe las responsabilidades, requisitos y beneficios."
              multiline
              value={offerData.description}
              onChangeText={(text) => handleChange('description', text)}
              editable={!loading}
            />
            {getErrorMessage('description')}

            {/* Selector de Ubicación */}
            <Text style={[styles.label, !!formErrors.location && styles.errorLabel]}>Ubicación (Municipio de Nariño) *</Text>
            <View style={[styles.pickerContainer, !!formErrors.location && styles.inputError]}>
              <Picker
                selectedValue={offerData.location}
                onValueChange={(itemValue) => handleChange('location', itemValue)}
                style={styles.picker}
                enabled={!loading}
              >
                <Picker.Item label="Selecciona un municipio" value="" />
                {nariñoMunicipalities.map((municipio) => (
                  <Picker.Item key={municipio} label={municipio} value={municipio} />
                ))}
              </Picker>
            </View>
            {getErrorMessage('location')}


            <Text style={styles.label}>Tipo de trabajo</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={offerData.modality}
                onValueChange={(itemValue) => handleChange('modality', itemValue)}
                style={styles.picker}
                enabled={!loading}
              >
                <Picker.Item label="Presencial" value="Presencial" />
                <Picker.Item label="Remoto" value="Remoto" />
                <Picker.Item label="Híbrido" value="Híbrido" />
              </Picker>
            </View>

            <Text style={[styles.label, !!formErrors.salary && styles.errorLabel]}>Salario (mensual) *</Text>
            <TextInput
              style={[styles.input, !!formErrors.salary && styles.inputError]}
              placeholder="$ 1.800.000"
              keyboardType="numeric"
              value={salaryDisplay}
              onChangeText={handleSalaryChange}
              editable={!loading}
            />
            {getErrorMessage('salary')}


            <Text style={styles.label}>Tipo de Contrato</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={offerData.contractType}
                onValueChange={(itemValue) => handleChange('contractType', itemValue)}
                style={styles.picker}
                enabled={!loading}
              >
                <Picker.Item label="Indefinido" value="Indefinido" />
                <Picker.Item label="Definido" value="Definido" />
                <Picker.Item label="Obra Labor" value="Obra Labor" />
                <Picker.Item label="Servicios" value="Servicios" />
              </Picker>
            </View>

            <Text style={[styles.label, !!formErrors.availablePositions && styles.errorLabel]}>Número de cupos disponibles *</Text>
            <TextInput
              style={[styles.input, !!formErrors.availablePositions && styles.inputError]}
              placeholder="1"
              keyboardType="numeric"
              value={offerData.availablePositions}
              onChangeText={(text) => handleChange('availablePositions', text)}
              editable={!loading}
            />
            {getErrorMessage('availablePositions')}
          </View>

          <View style={styles.disclaimerContainer}>
            <Ionicons name="information-circle-outline" size={16} color="#EF6C00" />
            <Text style={styles.disclaimerText}>
              Nota: el pago equivale a 1 mes (30 días) de publicación activa en la plataforma. Pasado este periodo, la publicación se desactivará automáticamente.
            </Text>
          </View>

          <TouchableOpacity 
            style={[styles.saveButton, loading && styles.saveButtonDisabled]} 
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>Publicar Oferta</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
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
    paddingTop: 20,
    paddingBottom: 100,
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
  input: {
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333333',
  },
  // 🆕 ESTILO NUEVO: Input deshabilitado
  disabledInput: {
    backgroundColor: '#e0e0e0',
    color: '#666666',
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
  picker: {
    height: 50,
    width: '100%',
    color: '#333333',
  },
  paymentInfoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#e8f5e9',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  planOptions: {
    marginTop: 5,
    gap: 10,
  },
  planCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 14,
  },
  planCardSelected: {
    borderColor: '#558B2F',
    backgroundColor: '#F1F8E9',
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  planInfo: {
    flex: 1,
    marginLeft: 10,
    alignItems: 'flex-start',
  },
  planName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'left',
  },
  planNameSelected: {
    color: '#558B2F',
  },
  planPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#558B2F',
    marginTop: 2,
    textAlign: 'left',
  },
  planDescription: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
    textAlign: 'left',
  },
  infoIcon: {
    marginRight: 10,
  },
  paymentInfoText: {
    flex: 1,
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
  },
  boldText: {
    fontWeight: 'bold',
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
  disclaimerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF8E1',
    borderRadius: 10,
    padding: 12,
    marginTop: 16,
    marginBottom: 4,
  },
  disclaimerText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 12,
    lineHeight: 17,
    color: '#8A5A00',
  },
});

export default CreateOfferScreen;