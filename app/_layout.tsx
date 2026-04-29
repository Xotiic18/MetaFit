import React, { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { supabase } from '../services/supabase';
import { Session } from '@supabase/supabase-js';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  const [session, setSession]       = useState<Session | null>(null);
  const [isAdmin, setIsAdmin]       = useState(false);
  const [initialized, setInitialized] = useState(false);
  const segments = useSegments();
  const router   = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);

      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', session.user.id)
          .maybeSingle();
        setIsAdmin(profile?.is_admin ?? false);
      }

      setInitialized(true);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', session.user.id)
          .maybeSingle();
        setIsAdmin(profile?.is_admin ?? false);
      } else {
        setIsAdmin(false);
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!initialized) return;
    const inAuthGroup  = segments[0] === '(auth)';
    const inAdminGroup = segments[0] === '(admin)';

    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      router.replace(isAdmin ? '/(admin)' : '/(tabs)');
    } else if (session && isAdmin && !inAdminGroup) {
      router.replace('/(admin)');
    }
  }, [session, initialized, isAdmin, segments]);

  if (!initialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator size="large" color="#A855F7" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)"  options={{ animation: 'fade' }} />
        <Stack.Screen name="(tabs)"  options={{ animation: 'fade' }} />
        <Stack.Screen name="(admin)" options={{ animation: 'fade' }} />
      </Stack>
    </SafeAreaProvider>
  );
}