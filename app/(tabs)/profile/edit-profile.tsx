import GradientBackground from '@/components/GradientBackground';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import municipiosNarino from '../../data/municipiosNarino'; // Importación corregida (named export)

// URLs de los servicios
const PRESIGNED_URL_API = 'https://2282qxh1me.execute-api.us-east-2.amazonaws.com/dev/offers/generatePresignedUrl';
const GET_PROFILE_API = 'https://2282qxh1me.execute-api.us-east-2.amazonaws.com/dev/profile/getProfile';
const UPDATE_PROFILE_API = 'https://2282qxh1me.execute-api.us-east-2.amazonaws.com/dev/profile/updateProfile';

interface Profile {
  nombres: string;
  apellidos: string;
  telefono: string;
  fecha_nacimiento: string;
  ciudad: string;
  nombre_empresa: string;
  email: string;
  resume_url: string;
}

interface ProfileErrors {
  nombres?: string;
  apellidos?: string;
  telefono?: string;
  fecha_nacimiento?: string;
  ciudad?: string;
  nombre_empresa?: string;
  email?: string;
  resume_url?: string;
}

const EditProfileScreen = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [formErrors, setFormErrors] = useState<ProfileErrors>({}); 
  const [pdfModalVisible, setPdfModalVisible] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  // 🚨 Lógica de Roles: Determinamos quién es el usuario
  const isApplicant = user ? user['custom:user_type'] === 'applicant' : false;
  const isEnterprise = user ? user['custom:user_type'] === 'enterprise' : false;

  const [profileData, setProfileData] = useState<Profile>({
    nombres: '',
    apellidos: '',
    telefono: '',
    fecha_nacimiento: '',
    ciudad: '', 
    nombre_empresa: '',
    email: '',
    resume_url: ''
  });

  // --- Funciones de Toast ---
  const showToast = (message: string, type: 'error' | 'success' = 'error') => {
    Toast.show({
      type: type,
      text1: type === 'success' ? 'Éxito' : 'Error',
      text2: message,
      position: 'bottom',
    });
  };

  // Cargar datos del perfil al montar el componente
  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    if (!user?.sub) return;

    try {
      setLoading(true);
      const response = await fetch(`${GET_PROFILE_API}/${user.sub}`);
      
      if (!response.ok) {
        throw new Error('Error al cargar el perfil');
      }

      const result = await response.json();
      if (result.profile) {
        setProfileData({
          nombres: result.profile.nombres || '',
          apellidos: result.profile.apellidos || '',
          telefono: result.profile.telefono || '',
          fecha_nacimiento: result.profile.fecha_nacimiento || '',
          ciudad: result.profile.ciudad || '', 
          nombre_empresa: result.profile.nombre_empresa || '',
          email: result.profile.email || user.email || '',
          resume_url: result.profile.resume_url || ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      showToast('No se pudo cargar la información del perfil');
    } finally {
      setLoading(false);
    }
  };

  // Función de validación de campos obligatorios
  const validateForm = (data: Profile) => {
    const errors: ProfileErrors = {}; 
    
    // Campos comunes
    if (!data.nombres.trim()) errors.nombres = 'Los nombres son obligatorios.';
    if (!data.apellidos.trim()) errors.apellidos = 'Los apellidos son obligatorios.';
    
    if (!data.telefono.trim() || data.telefono.trim().replace(/\D/g, '').length < 10) {
        errors.telefono = 'El teléfono es obligatorio y debe tener 10 dígitos.';
    }
    
    if (!data.ciudad.trim()) errors.ciudad = 'Debe seleccionar una ciudad.';

    // 🚨 Validaciones Condicionales
    if (isEnterprise) {
        if (!data.nombre_empresa.trim()) {
            errors.nombre_empresa = 'El nombre de la empresa es obligatorio.';
        }
    }
    // Nota: Para applicant, fecha_nacimiento podría ser obligatoria si lo deseas
    // if (isApplicant && !data.fecha_nacimiento.trim()) errors.fecha_nacimiento = 'Fecha requerida';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Función para subir hoja de vida
  const uploadResume = async () => {
    if (!user?.sub) return;

    try {
      setUploadingResume(true);
      
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true
      });

      if (result.canceled) return;

      const file = result.assets[0];
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const fileName = `${Date.now()}-${cleanFileName}`;
      const fileType = file.mimeType || 'application/pdf';

      // 1. Obtener signed URL
      const signedUrlResponse = await fetch(PRESIGNED_URL_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: fileName, fileType: fileType, fileCategory: 'resumes' }),
      });

      if (!signedUrlResponse.ok) {
        throw new Error(`Error obteniendo URL firmada: ${signedUrlResponse.status}`);
      }

      const urlData = await signedUrlResponse.json();
      const { signedUrl, key } = urlData;
      
      if (!signedUrl) {
        throw new Error('No se recibió signedUrl en la respuesta');
      }

      // 2. Leer el archivo
      const fileResponse = await fetch(file.uri);
      const arrayBuffer = await fileResponse.arrayBuffer();
      
      // 3. Subir a S3
      const response = await fetch(signedUrl, {
        method: 'PUT',
        body: arrayBuffer,
        headers: {
          'Content-Type': fileType,
          'Cache-Control': 'no-cache',
          'Content-Disposition': 'inline',
        },
      });

      if (!response.ok) {
        throw new Error(`Error subiendo archivo: ${response.status}`);
      }

      // 4. Actualizar perfil
      const resumeUrl = `https://empleos-narino-files.s3.us-east-2.amazonaws.com/${key}`;
      
      const updateResponse = await fetch(`${UPDATE_PROFILE_API}/${user.sub}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...profileData, resume_url: resumeUrl }),
      });

      if (!updateResponse.ok) {
        throw new Error('Error actualizando perfil');
      }

      setProfileData(prev => ({ ...prev, resume_url: resumeUrl }));
      showToast('Hoja de vida subida correctamente', 'success');
      
    } catch (error: any) {
      console.error('❌ Error subiendo hoja de vida:', error);
      showToast(`No se pudo subir la hoja de vida: ${error.message}`);
    } finally {
      setUploadingResume(false);
    }
  };

  const handleSaveProfile = async () => {
    setFormErrors({});
    
    if (!validateForm(profileData)) {
      showToast('Por favor, completa los campos obligatorios.');
      return;
    }
    
    if (!user?.sub) return;

    try {
      setLoading(true);
      
      const response = await fetch(`${UPDATE_PROFILE_API}/${user.sub}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        throw new Error('Error actualizando perfil');
      }

      const result = await response.json();
      console.log('Perfil actualizado:', result);
      
      showToast('Perfil actualizado correctamente', 'success');
      router.back();
      
    } catch (error) {
      console.error('Error updating profile:', error);
      showToast('No se pudo actualizar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenInBrowser = () => {
    if (profileData.resume_url) {
      setPdfModalVisible(false);
      Linking.openURL(profileData.resume_url);
    }
  };

  // --- Handlers auxiliares para Modals/Inputs ---
  const handleChange = (field: keyof Profile, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };
  
  const getErrorMessage = (field: keyof Profile) => {
    return formErrors[field] ? <Text style={styles.fieldError}>{formErrors[field]}</Text> : null;
  };


  if (loading && !profileData.nombres) {
    return (
      <GradientBackground>
        <SafeAreaView style={styles.safeAreaContainer}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#558B2F" />
            <Text style={styles.loadingText}>Cargando perfil...</Text>
          </View>
        </SafeAreaView>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safeAreaContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back-outline" size={24} color="#333333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Editar Perfil</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          {/* Información Básica */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Información Personal</Text>
            
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={profileData.email}
              editable={false}
              placeholder="Email"
            />

            <Text style={styles.label}>Nombres *</Text>
            <TextInput
              style={[styles.input, !!formErrors.nombres && styles.inputError]}
              value={profileData.nombres}
              onChangeText={(text) => handleChange('nombres', text)}
              placeholder="Ingresa tus nombres"
            />
            {getErrorMessage('nombres')}

            <Text style={styles.label}>Apellidos *</Text>
            <TextInput
              style={[styles.input, !!formErrors.apellidos && styles.inputError]}
              value={profileData.apellidos}
              onChangeText={(text) => handleChange('apellidos', text)}
              placeholder="Ingresa tus apellidos"
            />
            {getErrorMessage('apellidos')}

            <Text style={styles.label}>Teléfono *</Text>
            <TextInput
              style={[styles.input, !!formErrors.telefono && styles.inputError]}
              value={profileData.telefono}
              onChangeText={(text) => handleChange('telefono', text)}
              placeholder="Ingresa tu teléfono"
              keyboardType="phone-pad"
            />
            {getErrorMessage('telefono')}

            <Text style={styles.label}>Ciudad/Municipio *</Text>
            <View style={[styles.pickerContainer, !!formErrors.ciudad && styles.pickerError]}>
              <Picker
                selectedValue={profileData.ciudad}
                onValueChange={(itemValue) => handleChange('ciudad', itemValue)}
                style={styles.picker}
                dropdownIconColor="#558B2F"
              >
                <Picker.Item label="Selecciona tu municipio" value="" />
                {municipiosNarino?.map((municipio) => (
                  <Picker.Item key={municipio} label={municipio} value={municipio} />
                ))}
              </Picker>
            </View>
            {getErrorMessage('ciudad')}

            {/* 🚨 CAMPO FECHA: Solo para Applicant */}
            {isApplicant && (
              <>
                <Text style={styles.label}>Fecha de Nacimiento</Text>
                <TextInput
                  style={styles.input}
                  value={profileData.fecha_nacimiento}
                  onChangeText={(text) => handleChange('fecha_nacimiento', text)}
                  placeholder="YYYY-MM-DD"
                />
              </>
            )}

            {/* 🚨 CAMPO EMPRESA: Solo para Enterprise */}
            {isEnterprise && (
              <>
                <Text style={styles.label}>Empresa *</Text>
                <TextInput
                  style={[styles.input, !!formErrors.nombre_empresa && styles.inputError]}
                  value={profileData.nombre_empresa}
                  onChangeText={(text) => handleChange('nombre_empresa', text)}
                  placeholder="Nombre de tu empresa"
                />
                {getErrorMessage('nombre_empresa')}
              </>
            )}
          </View>

          {/* 🚨 SECCIÓN HOJA DE VIDA: Solo para Applicant */}
          {isApplicant && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Hoja de Vida</Text>
              
              {profileData.resume_url ? (
                <View style={styles.resumeContainer}>
                  <Ionicons name="document-text-outline" size={40} color="#558B2F" />
                  <View style={styles.resumeInfo}>
                    <Text style={styles.resumeText}>Hoja de vida cargada</Text>
                    <Text style={styles.resumeSubtext}>Lista para postulaciones</Text>
                  </View>
                  <View style={styles.resumeActions}>
                    <TouchableOpacity 
                      style={styles.resumeButton}
                      onPress={() => handleOpenInBrowser()} 
                    >
                      <Ionicons name="eye-outline" size={20} color="#558B2F" />
                      <Text style={styles.resumeButtonText}>Ver</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.resumeButton, styles.replaceButton]}
                      onPress={uploadResume}
                      disabled={uploadingResume}
                    >
                      {uploadingResume ? (
                        <ActivityIndicator size="small" color="#558B2F" />
                      ) : (
                        <>
                          <Ionicons name="refresh-outline" size={20} color="#558B2F" />
                          <Text style={styles.resumeButtonText}>Reemplazar</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity 
                  style={styles.uploadResumeButton}
                  onPress={uploadResume}
                  disabled={uploadingResume}
                >
                  {uploadingResume ? (
                    <ActivityIndicator size="small" color="#558B2F" />
                  ) : (
                    <>
                      <Ionicons name="cloud-upload-outline" size={24} color="#558B2F" />
                      <Text style={styles.uploadResumeText}>Subir Hoja de Vida</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
              
              <Text style={styles.uploadHint}>
                Formatos aceptados: PDF, DOC, DOCX
              </Text>
            </View>
          )}

          {/* Botón Guardar */}
          <TouchableOpacity 
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSaveProfile}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>Guardar Cambios</Text>
            )}
          </TouchableOpacity>

        </ScrollView>

        {/* Modal para visualizar PDF */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={pdfModalVisible}
          onRequestClose={() => setPdfModalVisible(false)}
        >
          <View style={styles.pdfModalOverlay}>
            <View style={styles.pdfModalContent}>
              <View style={styles.pdfModalHeader}>
                <Text style={styles.pdfModalTitle}>Ver Hoja de Vida</Text>
                <TouchableOpacity 
                  onPress={() => setPdfModalVisible(false)}
                  style={styles.closeButton}
                >
                  <Ionicons name="close-circle-outline" size={30} color="#666666" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.pdfContainer}>
                <View style={styles.pdfPlaceholder}>
                  <Ionicons name="document-text-outline" size={80} color="#558B2F" />
                  <Text style={styles.pdfPlaceholderTitle}>Tu Hoja de Vida</Text>
                  <Text style={styles.pdfPlaceholderText}>
                    Para una mejor experiencia de visualización, te recomendamos abrir el archivo directamente en el navegador.
                  </Text>
                  
                  <TouchableOpacity 
                    style={[styles.downloadButton, pdfLoading && styles.downloadButtonDisabled]}
                    onPress={handleOpenInBrowser}
                    disabled={pdfLoading}
                  >
                    {pdfLoading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Ionicons name="open-outline" size={20} color="#FFFFFF" />
                        <Text style={styles.downloadButtonText}>Abrir en Navegador</Text>
                      </>
                    )}
                  </TouchableOpacity>
                
                  <TouchableOpacity 
                    style={styles.browserButton}
                    onPress={() => setPdfModalVisible(false)}
                    disabled={pdfLoading}
                  >
                    <Text style={styles.browserButtonText}>Cerrar</Text>
                  </TouchableOpacity>

                </View>
              </View>
            </View>
          </View>
        </Modal>

      </SafeAreaView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
    marginBottom: 40
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  headerSpacer: {
    width: 24,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666666',
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 5,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333333',
    marginBottom: 5,
  },
  inputError: {
    borderColor: '#d32f2f',
    borderWidth: 1.5,
  },
  fieldError: {
    color: '#d32f2f',
    fontSize: 12,
    marginBottom: 10,
    marginLeft: 5,
    fontWeight: '500',
  },
  disabledInput: {
    backgroundColor: '#e0e0e0',
    color: '#666666',
  },
  pickerContainer: {
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    marginBottom: 5,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
    paddingHorizontal: 5,
  },
  pickerError: {
    borderColor: '#d32f2f',
    borderWidth: 1.5,
  },
  picker: {
    height: 50,
    color: '#333333',
  },
  // Estilos para hoja de vida
  resumeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  resumeInfo: {
    flex: 1,
    marginLeft: 12,
  },
  resumeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  resumeSubtext: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  resumeActions: {
    flexDirection: 'row',
  },
  resumeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: '#558B2F',
  },
  replaceButton: {
    backgroundColor: 'transparent',
  },
  resumeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#558B2F',
    marginLeft: 4,
  },
  uploadResumeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5E9',
    padding: 15,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#558B2F',
    borderStyle: 'dashed',
  },
  uploadResumeText: {
    marginLeft: 10,
    color: '#558B2F',
    fontWeight: 'bold',
    fontSize: 16,
  },
  uploadHint: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    marginTop: 8,
  },
  saveButton: {
    backgroundColor: '#558B2F',
    paddingVertical: 15,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonDisabled: {
    backgroundColor: '#A5D6A7',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  // Estilos del modal de PDF con descarga
  pdfModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  pdfModalContent: {
    width: '90%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    overflow: 'hidden',
    maxHeight: '80%',
  },
  pdfModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#f8f8f8',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  pdfModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  closeButton: {
    padding: 5,
  },
  pdfContainer: {
    padding: 25,
  },
  pdfPlaceholder: {
    alignItems: 'center',
  },
  pdfPlaceholderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginTop: 15,
    marginBottom: 10,
  },
  pdfPlaceholderText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 25,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#558B2F',
    paddingHorizontal: 24,
    paddingVertical: 15,
    borderRadius: 12,
    marginBottom: 12,
    width: '100%',
    gap: 8,
  },
  downloadButtonDisabled: {
    backgroundColor: '#A5D6A7',
  },
  downloadButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  browserButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
    paddingVertical: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#558B2F',
    width: '100%',
    gap: 8,
  },
  browserButtonText: {
    color: '#558B2F',
    fontWeight: '600',
    fontSize: 16,
  },
  pdfHint: {
    fontSize: 11,
    color: '#999999',
    textAlign: 'center',
    marginTop: 15,
    fontStyle: 'italic',
  },
});

export default EditProfileScreen;