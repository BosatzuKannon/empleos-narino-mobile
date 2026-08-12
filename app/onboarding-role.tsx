import GradientBackground from '@/components/GradientBackground';
import { useAuthStore } from '@/store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

type RoleOption = 'CANDIDATE' | 'COMPANY_ADMIN';
type IconName = keyof typeof Ionicons.glyphMap;

const ROLE_OPTIONS: { role: RoleOption; title: string; description: string; icon: IconName }[] = [
    {
        role: 'CANDIDATE',
        title: 'Soy Candidato',
        description: 'Quiero buscar empleo y postularme a vacantes',
        icon: 'person-outline',
    },
    {
        role: 'COMPANY_ADMIN',
        title: 'Soy Empresa',
        description: 'Quiero publicar ofertas y contratar talento',
        icon: 'business-outline',
    },
];

const OnboardingRoleScreen = () => {
    const router = useRouter();
    const setRole = useAuthStore((s) => s.setRole);
    const [selectedRole, setSelectedRole] = useState<RoleOption | null>(null);
    const [loading, setLoading] = useState(false);

    const handleContinue = async () => {
        if (!selectedRole || loading) return;
        setLoading(true);
        try {
            const result = await setRole(selectedRole);
            if (result.success) {
                router.replace('/(tabs)');
            } else {
                Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: result.error || 'No se pudo actualizar el rol.',
                    position: 'bottom',
                });
            }
        } catch {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'No se pudo conectar con el servidor.',
                position: 'bottom',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <GradientBackground>
            <SafeAreaView style={styles.safeArea}>
                <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />
                <View style={styles.content}>
                    <Text style={styles.title}>¡Bienvenido a Empleos Nariño!</Text>
                    <Text style={styles.subtitle}>Elige el perfil con el que quieres usar la app.</Text>

                    <View style={styles.cardContainer}>
                        {ROLE_OPTIONS.map((option) => {
                            const selected = selectedRole === option.role;
                            return (
                                <TouchableOpacity
                                    key={option.role}
                                    style={[styles.roleCard, selected && styles.roleCardSelected]}
                                    onPress={() => setSelectedRole(option.role)}
                                    disabled={loading}
                                    activeOpacity={0.85}
                                >
                                    <View style={styles.roleRow}>
                                        <Ionicons
                                            name={selected ? 'radio-button-on' : 'radio-button-off'}
                                            size={24}
                                            color={selected ? '#558B2F' : '#999999'}
                                        />
                                        <View style={styles.roleIcon}>
                                            <Ionicons
                                                name={option.icon}
                                                size={28}
                                                color={selected ? '#558B2F' : '#666666'}
                                            />
                                        </View>
                                        <View style={styles.roleInfo}>
                                            <Text style={[styles.roleTitle, selected && styles.roleTitleSelected]}>
                                                {option.title}
                                            </Text>
                                            <Text style={styles.roleDescription}>{option.description}</Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    <TouchableOpacity
                        style={[styles.continueButton, (!selectedRole || loading) && styles.continueButtonDisabled]}
                        onPress={handleContinue}
                        disabled={!selectedRole || loading}
                        activeOpacity={0.85}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.continueButtonText}>Continuar</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </GradientBackground>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        justifyContent: 'center',
        paddingBottom: 40,
    },
    title: {
        fontSize: 26,
        fontWeight: '700',
        color: '#1B3A2B',
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 15,
        color: '#5C6B5E',
        textAlign: 'center',
        marginTop: 8,
        marginBottom: 32,
    },
    cardContainer: {
        gap: 16,
    },
    roleCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#E3E7E0',
        paddingVertical: 18,
        paddingHorizontal: 16,
    },
    roleCardSelected: {
        borderColor: '#558B2F',
    },
    roleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    roleIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#F0F4EC',
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 12,
    },
    roleInfo: {
        flex: 1,
    },
    roleTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#333333',
    },
    roleTitleSelected: {
        color: '#558B2F',
    },
    roleDescription: {
        fontSize: 13,
        color: '#7A8078',
        marginTop: 2,
    },
    continueButton: {
        backgroundColor: '#558B2F',
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 40,
    },
    continueButtonDisabled: {
        backgroundColor: '#9FBF7F',
    },
    continueButtonText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '600',
    },
});

export default OnboardingRoleScreen;
