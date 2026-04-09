import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Dimensions, FlatList, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Obtener dimensiones de la pantalla para el carrusel
const { width: SCREEN_WIDTH } = Dimensions.get('window');

// --- CONSTANTES DE COLOR (MOVIDAS FUERA DEL COMPONENTE) ---
const PRIMARY_COLOR = '#076a0d'; // Verde oscuro
const SECONDARY_COLOR = '#558B2F'; // Verde claro
const LIGHT_GREY = '#cccccc';

// --- DATOS DE LAS PÁGINAS ---
const ONBOARDING_DATA = [
    {
        key: '1',
        title: 'Encuentra tu trabajo ideal',
        description: 'Somos la plataforma que conecta talento nariñense con las mejores empresas de la región. ¡Tu futuro empieza aquí!',
        icon: 'briefcase-outline',
    },
    {
        key: '2',
        title: 'Proceso de Postulación Fácil',
        description: 'Postúlate en segundos con tu perfil y hoja de vida. Recibe notificaciones sobre el estado de tu aplicación.',
        icon: 'document-text-outline',
    },
    {
        key: '3',
        title: 'Comienza tu carrera',
        description: 'Únete a nuestra comunidad. Completa tu perfil y prepárate para dar el siguiente paso profesional.',
        icon: 'rocket-outline',
    },
];

const OnboardingScreen = () => {
    const router = useRouter();
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList | null>(null);

    // Función que se dispara cuando el usuario completa el onboarding
    const completeOnboarding = async () => {
        try {
            await AsyncStorage.setItem('hasSeenOnboarding', 'true');
            // Redirige al inicio de sesión/registro
            router.replace('/(tabs)');
        } catch (e) {
            console.error('Error saving onboarding status:', e);
            router.replace('/(tabs)');
        }
    };

    // Función para manejar el scroll del carrusel
    const handleScroll = (event: any) => {
        const contentOffsetX = event.nativeEvent.contentOffset.x;
        const newIndex = Math.round(contentOffsetX / SCREEN_WIDTH);
        setCurrentIndex(newIndex);
    };

    // Función para avanzar a la siguiente página o finalizar
    const scrollToNext = () => {
        if (currentIndex < ONBOARDING_DATA.length - 1) {
            flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
        } else {
            completeOnboarding();
        }
    };

    // Renderizado de cada página
    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.slide}>
            <View style={styles.iconCircle}>
                <Ionicons name={item.icon} size={80} color={PRIMARY_COLOR} />
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.description}>{item.description}</Text>
        </View>
    );

    // Indicadores de la página actual
    const Pagination = () => (
        <View style={styles.paginationContainer}>
            {ONBOARDING_DATA.map((_, index) => (
                <View
                    key={index}
                    style={[
                        styles.dot,
                        {
                            backgroundColor: index === currentIndex ? PRIMARY_COLOR : LIGHT_GREY,
                            width: index === currentIndex ? 20 : 8,
                        },
                    ]}
                />
            ))}
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" />
            
            <FlatList
                ref={flatListRef}
                data={ONBOARDING_DATA}
                renderItem={renderItem}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.key}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                style={styles.flatList}
            />

            <Pagination />

            <View style={styles.footer}>
                <TouchableOpacity 
                    style={styles.skipButton} 
                    onPress={completeOnboarding}
                >
                    <Text style={styles.skipText}>
                        {currentIndex < ONBOARDING_DATA.length - 1 ? 'Saltar' : 'Omitir'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={styles.nextButton}
                    onPress={scrollToNext}
                >
                    <Text style={styles.nextButtonText}>
                        {currentIndex < ONBOARDING_DATA.length - 1 ? 'Siguiente' : '¡Comencemos!'}
                    </Text>
                    <Ionicons 
                        name={currentIndex < ONBOARDING_DATA.length - 1 ? "arrow-forward" : "checkmark-circle-outline"} 
                        size={20} 
                        color="#fff" 
                        style={styles.nextIcon}
                    />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    flatList: {
        flex: 1,
    },
    slide: {
        width: SCREEN_WIDTH,
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        paddingBottom: 100, // Espacio para la paginación y el footer
    },
    iconCircle: {
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: '#E8F5E9', // Verde muy claro
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 50,
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#333333',
        marginBottom: 15,
        textAlign: 'center',
    },
    description: {
        fontSize: 16,
        color: '#666666',
        textAlign: 'center',
        lineHeight: 24,
    },
    paginationContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 20,
    },
    dot: {
        height: 8,
        borderRadius: 4,
        marginHorizontal: 4,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 25,
        paddingBottom: 25,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    skipButton: {
        paddingVertical: 10,
        paddingHorizontal: 15,
    },
    skipText: {
        fontSize: 16,
        color: '#999999',
        fontWeight: '500',
    },
    nextButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: SECONDARY_COLOR,
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 10,
    },
    nextButtonText: {
        fontSize: 16,
        color: '#fff',
        fontWeight: 'bold',
        marginRight: 5,
    },
    nextIcon: {
        marginLeft: 5,
    }
});

export default OnboardingScreen;
