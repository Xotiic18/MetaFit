import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, ActivityIndicator
} from 'react-native';
import { supabase } from '../../services/supabase';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

type Template = {
  id: string;
  name: string;
  description: string;
  icon: string;
  exercises: string[];
};

const PRESET_TEMPLATES: Template[] = [
  {
    id: 't1',
    name: 'Push (Empuje)',
    description: 'Pecho, Hombro y Tríceps',
    icon: 'arrow-up-circle-outline',
    exercises: ['Press Banca', 'Press Inclinado', 'Press Militar', 'Elevaciones Laterales', 'Extensión Tríceps Polea'],
  },
  {
    id: 't2',
    name: 'Pull (Tracción)',
    description: 'Espalda y Bíceps',
    icon: 'arrow-down-circle-outline',
    exercises: ['Dominadas', 'Remo con Barra', 'Jalón al Pecho', 'Curl Bíceps Barra', 'Curl Martillo'],
  },
  {
    id: 't3',
    name: 'Legs (Pierna)',
    description: 'Cuádriceps, Isquios y Pantorrilla',
    icon: 'body-outline',
    exercises: ['Sentadilla', 'Prensa de Pierna', 'Curl Femoral', 'Extensión de Cuádriceps', 'Elevación de Talones'],
  },
  {
    id: 't4',
    name: 'Upper Body',
    description: 'Torso enfocando volumen acumulado',
    icon: 'fitness-outline',
    exercises: ['Press Banca', 'Remo con Mancuerna', 'Press Militar', 'Curl Bíceps', 'Extensión Tríceps'],
  },
  {
    id: 't5',
    name: 'Lower Body',
    description: 'Tren inferior enfoque fuerza',
    icon: 'barbell-outline',
    exercises: ['Sentadilla', 'Peso Muerto Rumano', 'Zancadas', 'Prensa de Pierna', 'Curl Femoral Tumbado'],
  },
];

export default function WorkoutScreen() {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const router = useRouter();

  const handleSelectTemplate = async (template: Template) => {
    setLoadingId(template.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('No hay sesión activa');

      const { data: routine, error: rError } = await supabase
        .from('routines')
        .insert([{ name: template.name, user_id: session.user.id }])
        .select()
        .single();
      if (rError) throw rError;

      const exerciseInserts = template.exercises.map(name => ({ name }));
      const { data: createdExercises, error: exError } = await supabase
        .from('exercises')
        .insert(exerciseInserts)
        .select('id, name');
      if (exError) throw exError;

      const links = createdExercises.map((ex, index) => ({
        routine_id: routine.id,
        exercise_id: ex.id,
        position: index,
        sets: 3,
        reps: 10,
        weight_kg: 0,       
        rest_seconds: 90,
      }));

      const { data: insertedLinks, error: linkError } = await supabase
        .from('routine_exercises')
        .insert(links)
        .select();

        console.log('Links insertados:', insertedLinks);
        console.log('Error de links:', linkError);
      if (linkError) throw linkError;

      if (!insertedLinks || insertedLinks.length === 0) {
      throw new Error(`RLS bloqueó el insert. ¿routine_id pertenece al usuario? routine_id: ${routine.id}`);
}

      router.push(`/(tabs)/${routine.id}`);

    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo crear la rutina');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Nueva Rutina</Text>
      <Text style={styles.subHeader}>Elige una plantilla para empezar:</Text>

      <FlatList
        data={PRESET_TEMPLATES}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isLoading = loadingId === item.id;
          const isDisabled = loadingId !== null;

          return (
            <TouchableOpacity
              style={[styles.templateCard, isDisabled && { opacity: 0.6 }]}
              onPress={() => handleSelectTemplate(item)}
              disabled={isDisabled}
            >
              <View style={styles.iconContainer}>
                <Ionicons name={item.icon as any} size={24} color="#A855F7" />
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.templateName}>{item.name}</Text>
                <Text style={styles.templateDesc}>{item.description}</Text>
                <Text style={styles.exerciseCount}>
                  {item.exercises.length} ejercicios incluidos
                </Text>
              </View>
              {isLoading
                ? <ActivityIndicator size="small" color="#A855F7" />
                : <Ionicons name="add-circle" size={28} color="#A855F7" />
              }
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', paddingHorizontal: 20, paddingTop: 60 },
  header: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  subHeader: { color: '#666', fontSize: 16, marginBottom: 20, marginTop: 5 },
  templateCard: {
    backgroundColor: '#111', padding: 18, borderRadius: 15,
    marginBottom: 12, flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#222',
  },
  iconContainer: { backgroundColor: '#1A1A1A', padding: 10, borderRadius: 10, marginRight: 15 },
  textContainer: { flex: 1 },
  templateName: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  templateDesc: { color: '#666', fontSize: 13, marginTop: 2 },
  exerciseCount: { color: '#A855F766', fontSize: 11, marginTop: 4, fontWeight: '600' },
});