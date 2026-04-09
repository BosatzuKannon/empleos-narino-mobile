import GradientBackground from '@/components/GradientBackground';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Button, IconButton, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

const citiesOfNarino = [
    'San Juan de Pasto', 'Ipiales', 'Tumaco', 'Túquerres', 'La Unión', 'Samaniego', 'Chachagüí', 'Consacá', 'El Tambo', 'Funes', 'Guaitarilla', 'Iles', 'Imués', 'La Florida', 'Linares', 'Nariño', 'Potosí', 'Yacuanquer', 'Ancuya', 'Arboleda', 'Barbacoas', 'Belen', 'Buesaco', 'Cumbitara', 'El Peñol', 'El Rosario', 'El Tablón de Gómez', 'Francisco Pizarro', 'Génova', 'Guachucal', 'La Cruz', 'Leiva', 'Linares', 'Los Andes', 'Mallama', 'Mosquera', 'Olaya Herrera', 'Puerres', 'Ricaurte', 'Sandoná', 'Santa Bárbara', 'Sapuyes', 'Taminango', 'Tangua'
];

// Caracteres especiales
const SPECIAL_CHARS_SET = '!@#$%^&*(),.?":{}|<>+-=';
const SPECIAL_CHARS_REGEX = new RegExp(`[${SPECIAL_CHARS_SET.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}]`);

// Componente para mostrar los requisitos de la contraseña
const PasswordRequirements = ({ password }) => {
    const REQUIREMENTS = [
        { regex: /.{8,}/, label: 'Mínimo 8 caracteres' },
        { regex: /\d/, label: 'Al menos 1 número' },
        { regex: SPECIAL_CHARS_REGEX, label: `Al menos 1 carácter especial` },
        { regex: /[A-Z]/, label: 'Al menos 1 mayúscula' },
        { regex: /[a-z]/, label: 'Al menos 1 minúscula' },
    ];

    return (
        <View style={styles.requirementsContainer}>
            {REQUIREMENTS.map((req, index) => {
                const isValid = req.regex.test(password);
                return (
                    <View key={index} style={styles.requirementItem}>
                        <Text style={isValid ? styles.validRequirement : styles.invalidRequirement}>
                            {isValid ? '✓' : '•'} {req.label}
                        </Text>
                    </View>
                );
            })}
        </View>
    );
};

const RegisterScreen = () => {
    const router = useRouter();
    
    // Estado para el tipo de usuario ('applicant' o 'enterprise')
    const [userType, setUserType] = useState<'applicant' | 'enterprise'>('applicant');

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    
    // Campos condicionales
    const [birthDate, setBirthDate] = useState('');
    const [companyName, setCompanyName] = useState('');

    const [city, setCity] = useState(citiesOfNarino[0]);
    const [secureTextEntry, setSecureTextEntry] = useState(true);
    const [loading, setLoading] = useState(false);
    const [formErrors, setFormErrors] = useState<any>({});

    const showToast = (message: string) => {
        Toast.show({
            type: 'error',
            text1: 'Error de registro',
            text2: message,
            position: 'bottom',
        });
    };

    const showSuccessToast = (message: string) => {
        Toast.show({
            type: 'success',
            text1: 'Éxito',
            text2: message,
            position: 'bottom',
        });
    };

    // Función de validación
    const validateForm = () => {
        const errors: any = {};

        // 1. Validaciones de Nombres
        if (!firstName.trim()) errors.firstName = 'Los nombres son obligatorios';
        else if (firstName.trim().length < 2) errors.firstName = 'Mínimo 2 caracteres';

        // 2. Validaciones de Apellidos
        if (!lastName.trim()) errors.lastName = 'Los apellidos son obligatorios';
        else if (lastName.trim().length < 2) errors.lastName = 'Mínimo 2 caracteres';

        // 3. Validaciones de Email
        if (!email.trim()) errors.email = 'El correo es obligatorio';
        else if (!/\S+@\S+\.\S+/.test(email)) errors.email = 'Formato no válido';

        // 4. Validaciones de Teléfono
        const sanitizedPhoneNumber = phoneNumber.replace(/\D/g, '');
        if (!phoneNumber.trim()) errors.phoneNumber = 'El teléfono es obligatorio';
        else if (sanitizedPhoneNumber.length < 10) errors.phoneNumber = 'Debe tener 10 dígitos';

        // 5. Validaciones CONDICIONALES según userType
        if (userType === 'applicant') {
            // Validar fecha de nacimiento solo si es postulante
            if (!birthDate.trim()) {
                errors.birthDate = 'Fecha obligatoria (AAAA-MM-DD)';
            } else if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate.trim())) {
                errors.birthDate = 'Formato AAAA-MM-DD';
            } else {
                const dateParts = birthDate.split('-');
                const userYear = parseInt(dateParts[0]);
                const currentYear = new Date().getFullYear();
                if (currentYear - userYear < 18) {
                    errors.birthDate = 'Debes ser mayor de 18 años';
                }
            }
        } else {
            // Validar nombre de empresa solo si es empresa
            if (!companyName.trim()) {
                errors.companyName = 'El nombre de la empresa es obligatorio';
            } else if (companyName.trim().length < 2) {
                errors.companyName = 'Nombre de empresa muy corto';
            }
        }

        // 6. Validaciones de Contraseña
        if (!password) errors.password = 'Contraseña obligatoria';
        else if (password.length < 8) errors.password = 'Mínimo 8 caracteres';
        else if (!/\d/.test(password)) errors.password = 'Falta un número';
        else if (!SPECIAL_CHARS_REGEX.test(password)) errors.password = 'Falta un carácter especial';
        else if (!/[A-Z]/.test(password)) errors.password = 'Falta una mayúscula';
        else if (!/[a-z]/.test(password)) errors.password = 'Falta una minúscula';

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleRegister = async () => {
        setFormErrors({}); 

        if (!validateForm()) {
            showToast('Por favor corrige los errores.');
            return;
        }

        setLoading(true);

        try {
            const sanitizedPhoneNumber = phoneNumber.replace(/\D/g, '');

            // Determinar valores según tipo de usuario
            const finalUserType = userType; 
            const finalBirthDate = userType === 'applicant' ? birthDate.trim() : '2000-01-01'; // Dummy date para empresas
            const finalCompany = userType === 'enterprise' ? companyName.trim() : "";

            const apiUrl = 'https://2282qxh1me.execute-api.us-east-2.amazonaws.com/dev/auth/signup';
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email.trim(),
                    password,
                    nombres: firstName.trim(),
                    apellidos: lastName.trim(),
                    telefono: `+57${sanitizedPhoneNumber}`,
                    user_type: finalUserType,
                    fecha_nacimiento: finalBirthDate,
                    ciudad: city,
                    nombre_empresa: finalCompany
                }),
            });

            if (response.ok) {
                console.log('Registro exitoso para:', email);
                showSuccessToast('Registro exitoso. Inicia sesión.');
                router.push({
                    pathname: '/auth/login',
                    params: { email: email.trim() },
                });
            } else {
                const errorData = await response.json();
                showToast(errorData.message || 'Error al registrar usuario.');
            }
        } catch (error) {
            console.error('Error:', error);
            showToast('Error de conexión.');
        } finally {
            setLoading(false);
        }
    };


    return (
        <GradientBackground>
            <SafeAreaView style={styles.safeAreaContainer}>
                <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />

                {/* Header */}
                <View style={styles.headerContainer}>
                    <Text style={styles.title}>Crea tu cuenta</Text>
                    <IconButton
                        icon="close"
                        size={24}
                        onPress={() => router.push('/auth')}
                        iconColor="#000"
                        style={styles.backButton}
                    />
                </View>

                <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                    <Text style={styles.subtitle}>
                        Únete a Empleos Nariño.
                    </Text>

                    {/* --- SELECTOR DE TIPO DE USUARIO --- */}
                    <View style={styles.userTypeContainer}>
                        <TouchableOpacity 
                            style={[styles.typeButton, userType === 'applicant' && styles.typeButtonActive]}
                            onPress={() => {
                                setUserType('applicant');
                                setFormErrors({}); 
                            }}
                        >
                            <Text style={[styles.typeText, userType === 'applicant' && styles.typeTextActive]}>Busco Empleo</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            style={[styles.typeButton, userType === 'enterprise' && styles.typeButtonActive]}
                            onPress={() => {
                                setUserType('enterprise');
                                setFormErrors({});
                            }}
                        >
                            <Text style={[styles.typeText, userType === 'enterprise' && styles.typeTextActive]}>Soy Empresa</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.inputGroup}>
                        {/* NOMBRES */}
                        <TextInput
                            label={userType === 'enterprise' ? "Nombre del representante" : "Nombres"}
                            mode="outlined"
                            textColor="#000000" // AGREGADO
                            value={firstName}
                            onChangeText={setFirstName}
                            style={styles.textInput}
                            activeOutlineColor={formErrors.firstName ? '#d32f2f' : '#076a0d'}
                            error={!!formErrors.firstName}
                        />
                        {formErrors.firstName && <Text style={styles.fieldError}>{formErrors.firstName}</Text>}

                        {/* APELLIDOS */}
                        <TextInput
                            label={userType === 'enterprise' ? "Apellidos del representante" : "Apellidos"}
                            mode="outlined"
                            textColor="#000000" // AGREGADO
                            value={lastName}
                            onChangeText={setLastName}
                            style={styles.textInput}
                            activeOutlineColor={formErrors.lastName ? '#d32f2f' : '#076a0d'}
                            error={!!formErrors.lastName}
                        />
                        {formErrors.lastName && <Text style={styles.fieldError}>{formErrors.lastName}</Text>}

                        {/* RENDERIZADO CONDICIONAL: FECHA vs EMPRESA */}
                        {userType === 'applicant' ? (
                            <>
                                <TextInput
                                    label="Fecha de nacimiento (AAAA-MM-DD)"
                                    mode="outlined"
                                    textColor="#000000" // AGREGADO
                                    keyboardType="numeric"
                                    value={birthDate}
                                    onChangeText={setBirthDate}
                                    style={styles.textInput}
                                    activeOutlineColor={formErrors.birthDate ? '#d32f2f' : '#076a0d'}
                                    error={!!formErrors.birthDate}
                                />
                                {formErrors.birthDate && <Text style={styles.fieldError}>{formErrors.birthDate}</Text>}
                            </>
                        ) : (
                            <>
                                <TextInput
                                    label="Nombre de la Empresa"
                                    mode="outlined"
                                    textColor="#000000" // AGREGADO
                                    value={companyName}
                                    onChangeText={setCompanyName}
                                    style={styles.textInput}
                                    activeOutlineColor={formErrors.companyName ? '#d32f2f' : '#076a0d'}
                                    error={!!formErrors.companyName}
                                />
                                {formErrors.companyName && <Text style={styles.fieldError}>{formErrors.companyName}</Text>}
                            </>
                        )}

                        {/* CORREO */}
                        <TextInput
                            label="Correo electrónico"
                            mode="outlined"
                            textColor="#000000" // AGREGADO
                            keyboardType="email-address"
                            value={email}
                            onChangeText={setEmail}
                            style={styles.textInput}
                            autoCapitalize="none"
                            activeOutlineColor={formErrors.email ? '#d32f2f' : '#076a0d'}
                            error={!!formErrors.email}
                        />
                        {formErrors.email && <Text style={styles.fieldError}>{formErrors.email}</Text>}

                        {/* TELÉFONO */}
                        <TextInput
                            label="Número de teléfono"
                            mode="outlined"
                            textColor="#000000" // AGREGADO
                            keyboardType="phone-pad"
                            value={phoneNumber}
                            onChangeText={setPhoneNumber}
                            style={styles.textInput}
                            activeOutlineColor={formErrors.phoneNumber ? '#d32f2f' : '#076a0d'}
                            error={!!formErrors.phoneNumber}
                        />
                        {formErrors.phoneNumber && <Text style={styles.fieldError}>{formErrors.phoneNumber}</Text>}

                        {/* CIUDAD */}
                        <View style={styles.pickerContainer}>
                            <Text style={styles.pickerLabel}>Ciudad</Text>
                            <Picker
                                selectedValue={city}
                                onValueChange={(itemValue) => setCity(itemValue)}
                                style={styles.picker}
                                dropdownIconColor="#076a0d"
                            >
                                {citiesOfNarino.map((cityName) => (
                                    <Picker.Item key={cityName} label={cityName} value={cityName} />
                                ))}
                            </Picker>
                        </View>

                        {/* CONTRASEÑA */}
                        <TextInput
                            label="Contraseña"
                            mode="outlined"
                            textColor="#000000" // AGREGADO
                            secureTextEntry={secureTextEntry}
                            value={password}
                            onChangeText={setPassword}
                            style={styles.textInput}
                            activeOutlineColor={formErrors.password ? '#d32f2f' : '#076a0d'}
                            error={!!formErrors.password}
                            right={
                                <TextInput.Icon
                                    icon={secureTextEntry ? 'eye-off' : 'eye'}
                                    onPress={() => setSecureTextEntry(!secureTextEntry)}
                                />
                            }
                        />
                        <PasswordRequirements password={password} />
                        {formErrors.password && <Text style={styles.fieldError}>{formErrors.password}</Text>}
                    </View>

                    <Button
                        mode="contained"
                        onPress={handleRegister}
                        style={styles.button}
                        labelStyle={styles.buttonLabel}
                        loading={loading}
                        disabled={loading}
                    >
                        {loading ? 'Registrando...' : 'Registrarme'}
                    </Button>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>
                            ¿Ya tienes una cuenta?{' '}
                            <TouchableOpacity onPress={() => router.push('/auth/login')}>
                                <Text style={styles.linkText}>Inicia sesión</Text>
                            </TouchableOpacity>
                        </Text>
                    </View>
                </ScrollView>

                <Modal
                    visible={loading}
                    transparent={true}
                    animationType="fade"
                >
                    <View style={styles.modalBackground}>
                        <View style={styles.activityIndicatorWrapper}>
                            <ActivityIndicator
                                animating={true}
                                size="large"
                                color="#076a0d"
                            />
                            <Text style={styles.modalText}>Creando cuenta...</Text>
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
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingVertical: 10,
    },
    backButton: {
        margin: 0,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#000',
        flex: 1,
    },
    scrollContainer: {
        paddingHorizontal: 24,
        flexGrow: 1,
        paddingTop: 0,
        paddingBottom: 40,
    },
    subtitle: {
        fontSize: 16,
        color: '#333',
        marginBottom: 15,
    },
    userTypeContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderRadius: 10,
        padding: 4,
        marginBottom: 20,
    },
    typeButton: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 8,
    },
    typeButtonActive: {
        backgroundColor: '#076a0d',
        elevation: 2,
    },
    typeText: {
        color: '#666',
        fontWeight: '600',
        fontSize: 14,
    },
    typeTextActive: {
        color: '#fff',
        fontWeight: 'bold',
    },
    inputGroup: {
        marginBottom: 20,
    },
    textInput: {
        marginBottom: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        borderRadius: 8,
    },
    fieldError: {
        color: '#d32f2f',
        fontSize: 12,
        marginBottom: 10,
        marginLeft: 8,
        fontWeight: '500',
    },
    requirementsContainer: {
        marginTop: 5,
        marginBottom: 10,
        paddingHorizontal: 5,
    },
    requirementItem: {
        flexDirection: 'row',
        marginVertical: 1,
    },
    validRequirement: {
        color: '#076a0d',
        fontSize: 12,
    },
    invalidRequirement: {
        color: '#777',
        fontSize: 12,
    },
    button: {
        marginTop: 10,
        marginBottom: 10,
        backgroundColor: '#076a0d',
        elevation: 5,
        borderRadius: 8,
    },
    buttonLabel: {
        paddingVertical: 4,
        fontSize: 16,
        color: '#fff',
        fontWeight: 'bold',
    },
    footer: {
        marginTop: 20,
        alignItems: 'center',
        paddingBottom: 20,
    },
    footerText: {
        color: '#333',
        fontSize: 14,
    },
    linkText: {
        color: '#558B2F',
        fontWeight: 'bold',
    },
    modalBackground: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    activityIndicatorWrapper: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 20,
        alignItems: 'center',
    },
    modalText: {
        marginTop: 10,
        fontSize: 16,
        color: '#333',
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        marginBottom: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        overflow: 'hidden',
    },
    pickerLabel: {
        position: 'absolute',
        top: -10,
        left: 12,
        zIndex: 1,
        backgroundColor: '#f9f9f9',
        paddingHorizontal: 4,
        fontSize: 12,
        color: 'rgba(0, 0, 0, 0.6)',
    },
    picker: {
        color: '#000',
    },
});

export default RegisterScreen;