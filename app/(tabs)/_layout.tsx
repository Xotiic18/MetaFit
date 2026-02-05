import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons'; // Iconos que ya vienen con Expo

export default function TabLayout() {   
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#fff',      // Color del icono seleccionado
        tabBarInactiveTintColor: '#666',    // Color de los iconos no seleccionados
        tabBarStyle: {
          backgroundColor: '#000',          // Fondo negro para el menú
          borderTopColor: '#333',           // Línea arriba del menú
          height: 60,
          paddingBottom: 10,
        },
        headerStyle: {
          backgroundColor: '#000',          // Fondo negro para la barra superior
        },
        headerTitleStyle: {
          color: '#fff',                    // Texto blanco arriba
          fontWeight: '900',
        },
      }}>
      
      {/* Pestaña de Ejercicios */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Entrenar',
          tabBarIcon: ({ color }) => <Ionicons name="barbell" size={28} color={color} />,
        }}
      />

      {/* Pestaña de Perfil */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => <Ionicons name="person" size={28} color={color} />,
        }}
      />
    </Tabs>
  );
}