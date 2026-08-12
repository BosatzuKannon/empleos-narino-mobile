import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import Constants from 'expo-constants';
import { jwtDecode } from 'jwt-decode';
import { create } from 'zustand';

const API_BASE = process.env.EXPO_PUBLIC_API_URL;
const APP_VERSION_API_URL = `${API_BASE}/settings/app-version`;
const LOGIN_API_URL = `${API_BASE}/auth/signin`;
const GOOGLE_SIGNIN_API_URL = `${API_BASE}/auth/google`;

export interface User {
    sub: string;
    email: string;
    given_name?: string;
    family_name?: string;
    'custom:user_type'?: string;
    phone_number?: string;
    companyName?: string;
    [key: string]: unknown;
}

interface AuthState {
    isAuthenticated: boolean;
    user: User | null;
    isLoading: boolean;
    isOutdated: boolean;
    outdatedMessage: string;
    appStatusVisible: boolean;
    appStatusMessage: string;
    appStatusType: number;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    googleSignIn: () => Promise<{ success: boolean; error?: string }>;
    signUp: (userData: any) => Promise<{ success: boolean; error?: string }>;
    setRole: (role: 'CANDIDATE' | 'COMPANY_ADMIN') => Promise<{ success: boolean; error?: string }>;
    signOut: () => Promise<void>;
    checkAppVersion: () => Promise<void>;
    initializeAuth: () => Promise<void>;
}

// Persiste el resultado de autenticación del backend (token + usuario) en
// AsyncStorage y actualiza el store. Lo comparten login y Google Sign-In.
async function applyAuthResult(data: any): Promise<{ success: boolean; error?: string }> {
    if (data && data.authenticationResult) {
        const { AccessToken } = data.authenticationResult;

        await AsyncStorage.setItem('userToken', AccessToken);
        await AsyncStorage.setItem('accessToken', AccessToken);

        // Prefer the user object from the backend response (it includes the role)
        if (data.user) {
            const user: User = {
                sub: data.user.id || '',
                email: data.user.email || '',
                given_name: data.user.nombre || '',
                family_name: data.user.apellido || '',
                'custom:user_type': data.user.role || '',
                phone_number: data.user.telefono || '',
                companyName: data.user.companyName || '',
            };
            await AsyncStorage.setItem('userData', JSON.stringify(user));
            useAuthStore.setState({ user });
        } else {
            // Fallback: decode the JWT (works for users with role in user_metadata)
            let decoded: Record<string, any> | null = null;
            try {
                decoded = jwtDecode<Record<string, any>>(AccessToken);
                await AsyncStorage.setItem('decodedToken', JSON.stringify(decoded));
            } catch (err) {
                console.error('Error al decodificar el token:', err);
            }

            if (decoded) {
                const metadata = decoded.user_metadata || {};
                const appMetadata = decoded.app_metadata || {};
                const userRole = metadata.role || appMetadata.role || '';
                const user: User = {
                    sub: decoded.sub || '',
                    email: decoded.email || '',
                    given_name: metadata.given_name,
                    family_name: metadata.family_name,
                    'custom:user_type': metadata.user_type || appMetadata.user_type || userRole,
                    phone_number: metadata.phone_number || decoded.phone,
                };
                await AsyncStorage.setItem('userData', JSON.stringify(user));
                useAuthStore.setState({ user });
            } else {
                await AsyncStorage.removeItem('userData');
                useAuthStore.setState({ user: null });
            }
        }

        useAuthStore.setState({ isAuthenticated: true });
        return { success: true };
    }

    return { success: false, error: data?.message || data?.error || 'Credenciales inválidas' };
}

export const useAuthStore = create<AuthState>((set) => ({
    isAuthenticated: false,
    user: null,
    isLoading: true,
    isOutdated: false,
    outdatedMessage: '',
    appStatusVisible: false,
    appStatusMessage: '',
    appStatusType: 2,

    login: async (email: string, password: string) => {
        try {
            const response = await fetch(LOGIN_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: email, password }),
            });

            const data = await response.json();
            console.log('Respuesta login:', data);

            if (!response.ok) {
                return { success: false, error: data.message || data.error || 'Credenciales inválidas' };
            }

            return await applyAuthResult(data);
        } catch (e) {
            console.error('Error en login:', e);
            return { success: false, error: 'No se pudo conectar con el servidor.' };
        }
    },

    googleSignIn: async () => {
        try {
            GoogleSignin.configure({
                webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
            });
            await GoogleSignin.hasPlayServices();
            const response = await GoogleSignin.signIn();

            if (response.type === 'cancelled') {
                return { success: false, error: 'Inicio de sesión con Google cancelado.' };
            }

            const idToken = response.data?.idToken;

            if (!idToken) {
                return { success: false, error: 'No se pudo obtener el token de Google.' };
            }

            const fetchResponse = await fetch(GOOGLE_SIGNIN_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken }),
            });

            const data = await fetchResponse.json();
            console.log('Respuesta Google Sign-In:', data);

            if (!fetchResponse.ok) {
                return { success: false, error: data.message || data.error || 'Error al iniciar sesión con Google.' };
            }

            return await applyAuthResult(data);
        } catch (e: any) {
            if (e?.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
                return { success: false, error: 'Google Play Services no está disponible en este dispositivo.' };
            }
            console.error('Error en Google Sign-In:', e);
            return { success: false, error: 'No se pudo conectar con Google.' };
        }
    },

    setRole: async (role: 'CANDIDATE' | 'COMPANY_ADMIN') => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await fetch(`${API_BASE}/users/set-role`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ role }),
            });

            const data = await response.json();

            if (!response.ok) {
                return { success: false, error: data.message || data.error || 'No se pudo actualizar el rol.' };
            }

            const current = useAuthStore.getState().user || {};
            const updated = { ...current, 'custom:user_type': data.user?.role || role } as User;
            await AsyncStorage.setItem('userData', JSON.stringify(updated));
            useAuthStore.setState({ user: updated });
            return { success: true };
        } catch (e) {
            console.error('Error al actualizar rol:', e);
            return { success: false, error: 'No se pudo conectar con el servidor.' };
        }
    },

    signUp: async (userData: any) => {
        try {
            console.log(userData)
            const response = await fetch(`${API_BASE}/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData),
            });

            if (response.ok) {
                return { success: true };
            }

            const data = await response.json().catch(() => ({}));
            return { success: false, error: data.message || data.error || 'Error al registrar usuario.' };
        } catch (e) {
            console.error('Error en signUp:', e);
            return { success: false, error: 'No se pudo conectar con el servidor.' };
        }
    },

    signOut: async () => {
        try {
            await AsyncStorage.removeItem('userToken');
            await AsyncStorage.removeItem('accessToken');
            await AsyncStorage.removeItem('decodedToken');
            await AsyncStorage.removeItem('userData');
        } catch (error) {
            console.error('Error during sign out:', error);
        } finally {
            set({ isAuthenticated: false, user: null });
        }
    },

    checkAppVersion: async () => {
        try {
            const currentAppVersionCode = Constants.expoConfig?.android?.versionCode || 0;

            if (currentAppVersionCode === 0) {
                console.log("Development environment detected. Skipping forced update check.");
            } else {
                console.log(`Current App Version Code: ${currentAppVersionCode}`);
            }

            const response = await fetch(APP_VERSION_API_URL);

            if (!response.ok) throw new Error("API failed to return version config.");

            const config = await response.json();
            console.log('Config Service Response:', config);

            const shouldShowBanner = config.appStatus === true;

            if (shouldShowBanner) {
                set({
                    appStatusVisible: true,
                    appStatusMessage: config.appStatusMessage || 'Aviso importante del sistema.',
                    appStatusType: 2
                });
                console.log(`SYSTEM MESSAGE: ${config.appStatusMessage}`);
            } else {
                set({
                    appStatusVisible: false,
                    appStatusMessage: '',
                    appStatusType: 2
                });
            }

            const minRequiredCode = config.minVersionCode || 1;

            if (currentAppVersionCode !== 0 && currentAppVersionCode < minRequiredCode) {
                console.log(`APP OUTDATED: Current (${currentAppVersionCode}) < Required (${minRequiredCode})`);
                set({
                    isOutdated: true,
                    outdatedMessage: config.messageEs || 'Hay una actualización obligatoria para continuar.'
                });
            } else {
                set({ isOutdated: false, outdatedMessage: '' });
                console.log("App version is up-to-date.");
            }

        } catch (e) {
            console.error('Error checking app version/status:', e);
            set({
                appStatusVisible: true,
                appStatusType: 3,
                appStatusMessage: 'No se pudo verificar el estado del servicio. Puede haber problemas de conexión.'
            });
        }
    },

    initializeAuth: async () => {
        try {
            const storedToken = await AsyncStorage.getItem('userToken');
            const storedUser = await AsyncStorage.getItem('userData');

            if (storedToken && storedUser) {
                const parsedUser = JSON.parse(storedUser);
                set({ isAuthenticated: true, user: parsedUser });
            } else {
                set({ isAuthenticated: false, user: null });
            }
        } catch (e) {
            set({ isAuthenticated: false, user: null });
        } finally {
            set({ isLoading: false });
        }
    }
}));

export default useAuthStore;