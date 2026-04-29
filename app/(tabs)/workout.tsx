import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, ActivityIndicator
} from 'react-native';
import { supabase } from '../../services/supabase';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

type BaseRoutine = {
  id: string;
  name: string;
  description: string;
  icon: string;
  base_routine_exercises: {
    exercise_name: string;
    muscle_group: string;
    position: number;
    sets: number;
    reps: number;
    rest_seconds: number;
  }[];
};

export default function WorkoutScreen() {
  const [templates, setTemplates]           = useState<BaseRoutine[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [loadingId, setLoadingId]           = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const { data, error } = await supabase
          .from('base_routines')
          .select(`
            id, name, description, icon,
            base_routine_exercises (
              exercise_name, muscle_group, position, sets, reps, rest_seconds
            )
          `)
          .order('created_at', { ascending: true });

        if (error) throw error;
        setTemplates(data || []);
      } catch (error: any) {
        Alert.alert('Error', 'No se pudieron cargar las plantillas');
      } finally {
        setLoadingTemplates(false);
      }
    };

    fetchTemplates();
  }, []);

  const handleSelectTemplate = async (template: BaseRoutine) => {
    setLoadingId(template.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('No hay sesión activa');

      // 1. Crear la rutina
      const { data: routine, error: rError } = await supabase
        .from('routines')
        .insert([{ name: template.name, user_id: session.user.id }])
        .select()
        .single();
      if (rError) throw rError;

      // 2. Ordenar ejercicios por posición
      const exercises = (template.base_routine_exercises || [])
        .sort((a, b) => a.position - b.position);

      if (exercises.length > 0) {
        // 3. Insertar ejercicios en tabla exercises
        const exerciseInserts = exercises.map(ex => ({ name: ex.exercise_name }));
        const { data: createdExercises, error: exError } = await supabase
          .from('exercises')
          .insert(exerciseInserts)
          .select('id, name');
        if (exError) throw exError;

        // 4. Vincular ejercicios a la rutina
        const links = createdExercises.map((ex, index) => ({
          routine_id:   routine.id,
          exercise_id:  ex.id,
          position:     index,
          sets:         exercises[index]?.sets         ?? 3,
          reps:         exercises[index]?.reps         ?? 10,
          weight_kg:    0,
          rest_seconds: exercises[index]?.rest_seconds ?? 90,
        }));

        const { error: linkError } = await supabase
          .from('routine_exercises')
          .insert(links);
        if (linkError) throw linkError;
      }

      // 5. Navegar a la rutina creada
      router.push(`/(tabs)/${routine.id}`);

    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo crear la rutina');
    } finally {
      setLoadingId(null);
    }
  };

  if (loadingTemplates) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#A855F7" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Nueva Rutina</Text>
      <Text style={styles.subHeader}>Elige una plantilla para empezar:</Text>

      <FlatList
        data={templates}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="barbell-outline" size={40} color="#333" />
            <Text style={styles.emptyText}>Sin plantillas disponibles</Text>
            <Text style={styles.emptySubtext}>
              El administrador aún no ha creado plantillas
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const isLoading  = loadingId === item.id;
          const isDisabled = loadingId !== null;
          const exCount    = item.base_routine_exercises?.length ?? 0;

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
                  {exCount} ejercicio{exCount !== 1 ? 's' : ''} incluido{exCount !== 1 ? 's' : ''}
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
  container: {
    flex: 1, backgroundColor: '#000',
    paddingHorizontal: 20, paddingTop: 60,
  },
  center: {
    flex: 1, backgroundColor: '#000',
    justifyContent: 'center', alignItems: 'center',
  },
  header: {
    color: '#fff', fontSize: 28, fontWeight: 'bold',
  },
  subHeader: {
    color: '#666', fontSize: 16, marginBottom: 20, marginTop: 5,
  },
  templateCard: {
    backgroundColor: '#111', padding: 18, borderRadius: 15,
    marginBottom: 12, flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#222',
  },
  iconContainer: {
    backgroundColor: '#1A1A1A', padding: 10,
    borderRadius: 10, marginRight: 15,
  },
  textContainer: { flex: 1 },
  templateName: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  templateDesc: { color: '#666', fontSize: 13, marginTop: 2 },
  exerciseCount: {
    color: '#A855F766', fontSize: 11,
    marginTop: 4, fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center', paddingTop: 80, gap: 10,
  },
  emptyText: {
    color: '#555', fontSize: 16, fontWeight: '600',
  },
  emptySubtext: {
    color: '#333', fontSize: 13, textAlign: 'center',
  },
});