import {
    ErrorBoundary as ExpoRouterErrorBoundary,
    type ErrorBoundaryProps,
    SplashScreen,
    Stack,
    usePathname,
    useGlobalSearchParams,
} from "expo-router";
import '@/global.css';
import {useFonts} from "expo-font";
import {useEffect, useRef} from "react";
import { ClerkProvider, useAuth, useUser } from '@clerk/expo';
import { tokenCache } from '@clerk/expo/token-cache';
import { PostHogProvider } from 'posthog-react-native';
import { posthog } from '../src/config/posthog';

SplashScreen.preventAutoHideAsync();

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!publishableKey) {
    throw new Error('Add your Clerk Publishable Key to the .env file');
}

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
    useEffect(() => {
        posthog?.captureException(error);
    }, [error]);

    return <ExpoRouterErrorBoundary error={error} retry={retry} />;
}

function RootLayoutContent() {
    const { isLoaded: authLoaded } = useAuth();
    const { user, isLoaded: userLoaded } = useUser();
    const pathname = usePathname();
    const params = useGlobalSearchParams();
    const previousPathname = useRef<string | undefined>(undefined);
    const identifiedUserId = useRef<string | null>(null);

    useEffect(() => {
        if (!authLoaded || !userLoaded) {
            return;
        }

        const nextUserId = user?.id ?? null;
        if (identifiedUserId.current === nextUserId) {
            return;
        }

        if (identifiedUserId.current) {
            posthog?.reset();
        }

        if (nextUserId && user) {
            const personProperties = {
                ...(user.primaryEmailAddress?.emailAddress && { email: user.primaryEmailAddress.emailAddress }),
                ...(user.firstName && { first_name: user.firstName }),
                ...(user.lastName && { last_name: user.lastName }),
            };

            posthog?.identify(nextUserId, { $set: personProperties });
        }

        identifiedUserId.current = nextUserId;
    }, [authLoaded, user, userLoaded]);

    useEffect(() => {
        if (previousPathname.current !== pathname) {
            // Filter route params to avoid leaking sensitive data
            const sanitizedParams = Object.keys(params).reduce((acc, key) => {
                // Only include specific safe params
                if (['id', 'tab', 'view'].includes(key)) {
                    acc[key] = params[key];
                }
                return acc;
            }, {} as Record<string, string | string[]>);

            posthog?.screen(pathname, {
                previous_screen: previousPathname.current ?? null,
                ...sanitizedParams,
            });
            previousPathname.current = pathname;
        }
    }, [pathname, params]);

    const [fontsLoaded] = useFonts({
        'sans-regular': require('../assets/fonts/PlusJakartaSans-Regular.ttf'),
        'sans-bold': require('../assets/fonts/PlusJakartaSans-Bold.ttf'),
        'sans-medium': require('../assets/fonts/PlusJakartaSans-Medium.ttf'),
        'sans-semibold': require('../assets/fonts/PlusJakartaSans-SemiBold.ttf'),
        'sans-extrabold': require('../assets/fonts/PlusJakartaSans-ExtraBold.ttf'),
        'sans-light': require('../assets/fonts/PlusJakartaSans-Light.ttf')
    })

    useEffect(() => {
        // Hide splash only when both fonts and auth are loaded
        if (fontsLoaded && authLoaded) {
            SplashScreen.hideAsync()
        }
    }, [fontsLoaded, authLoaded])

    // Don't render app until both are ready
    if (!fontsLoaded || !authLoaded) return null;

    return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
    const app = (
        <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
            <RootLayoutContent />
        </ClerkProvider>
    );

    if (!posthog) {
        return app;
    }

    return (
        <PostHogProvider
            client={posthog}
            autocapture={{
                captureScreens: false,
                captureTouches: true,
                propsToCapture: ['testID'],
            }}
        >
            {app}
        </PostHogProvider>
    );
}