import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#000',
          borderTopColor: '#1A1A1A',
          height: 60,
          paddingBottom: 10,
        },
        tabBarActiveTintColor: '#A855F7',
        tabBarInactiveTintColor: '#666',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Rutinas',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="barbell-outline" size={size} color={color} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="workout"
        options={{
          title: 'Entrenar',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="play-circle-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />

      {/* Ocultamos [id] de la barra de pestañas pero permitimos su navegación */}
      <Tabs.Screen
        name="[id]"
        options={{
          href: null, // Esto hace que no aparezca el icono en la barra
          headerShown: true, // Mostramos el header para tener botón de "Volver"
          headerStyle: { backgroundColor: '#000' },
          headerTintColor: '#A855F7',
        }}
      />
    </Tabs>
  );
}