import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../services/supabase';
import { Ionicons } from '@expo/vector-icons';
import { ExerciseCatalogModal } from '../../components/exerciseCatalogModal';

type ExerciseRow = {
  id: string;
  position: number;
  sets: number;
  reps: number;
  weight_kg: number;
  rest_seconds: number;
  exercises: {
    id: string;
    name: string;
  } | null;
};

type Routine = {
  id: string;
  name: string;
};

type LocalEdit = {
  sets: string;
  reps: string;
  weight_kg: string;
};

export default function RoutineDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [exercises, setExercises] = useState<ExerciseRow[]>([]);
  const [localEdits, setLocalEdits] = useState<Record<string, LocalEdit>>({});
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [catalogVisible, setCatalogVisible] = useState(false);
  const [finishing, setFinishing] = useState(false); // ← nuevo

  const [timeLeft, setTimeLeft] = useState(90);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!isTimerActive) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsTimerActive(false);
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isTimerActive]);

  const startTimer = (seconds: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeLeft(seconds);
    setIsTimerActive(true);
  };

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsTimerActive(false);
  };

  useEffect(() => {
    fetchRoutineDetails();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [id]);

  const fetchRoutineDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('routines')
        .select(`
          id, name,
          routine_exercises (
            id, position, sets, reps, weight_kg, rest_seconds,
            exercises ( id, name )
          )
        `)
        .eq('id', id)
        .order('position', { referencedTable: 'routine_exercises', ascending: true })
        .single();

      if (error) throw error;

      const exList = (data.routine_exercises || []) as unknown as ExerciseRow[];
      setRoutine({ id: data.id, name: data.name });
      setExercises(exList);

      const initialEdits: Record<string, LocalEdit> = {};
      exList.forEach(ex => {
        initialEdits[ex.id] = {
          sets: ex.sets.toString(),
          reps: ex.reps.toString(),
          weight_kg: ex.weight_kg.toString(),
        };
      });
      setLocalEdits(initialEdits);
    } catch (error: any) {
      Alert.alert('Error', 'No se pudieron cargar los datos.');
    } finally {
      setLoading(false);
    }
  };

  const handleLocalChange = (exerciseId: string, field: keyof LocalEdit, value: string) => {
    setLocalEdits(prev => ({
      ...prev,
      [exerciseId]: { ...prev[exerciseId], [field]: value },
    }));
  };

  const commitUpdate = async (exerciseId: string, field: keyof LocalEdit) => {
    const rawValue = localEdits[exerciseId]?.[field] ?? '0';
    const numericValue = field === 'weight_kg'
      ? parseFloat(rawValue.replace(',', '.'))
      : parseInt(rawValue);
    const sanitized = isNaN(numericValue) ? 0 : Math.max(0, numericValue);

    setLocalEdits(prev => ({
      ...prev,
      [exerciseId]: { ...prev[exerciseId], [field]: sanitized.toString() },
    }));

    setSavingId(exerciseId);
    try {
      const { error } = await supabase
        .from('routine_exercises')
        .update({ [field]: sanitized })
        .eq('id', exerciseId);
      if (error) throw error;
      setExercises(prev =>
        prev.map(ex => ex.id === exerciseId ? { ...ex, [field]: sanitized } : ex)
      );
    } catch (error: any) {
      Alert.alert('Error', 'No se pudo guardar el cambio');
    } finally {
      setTimeout(() => setSavingId(null), 500);
    }
  };

  // ✅ Finalizar entrenamiento — guarda sesión + logs
  const finishWorkout = () => {
    if (exercises.length === 0) {
      Alert.alert('Sin ejercicios', 'Agrega al menos un ejercicio antes de finalizar.');
      return;
    }

    Alert.alert(
      '¡Finalizar entrenamiento!',
      `¿Guardar sesión de "${routine?.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Finalizar',
          onPress: async () => {
            setFinishing(true);
            try {
              const { data: { session } } = await supabase.auth.getSession();
              if (!session?.user) throw new Error('Sin sesión');

              // 1. Crear sesión de entrenamiento
              const { data: workoutSession, error: sessionError } = await supabase
                .from('workout_sessions')
                .insert([{
                  user_id: session.user.id,
                  routine_id: routine!.id,
                  routine_name: routine!.name,
                }])
                .select()
                .single();

              if (sessionError) throw sessionError;

              // 2. Guardar log de cada ejercicio con peso/series actuales
              const logs = exercises
                .filter(ex => ex.exercises !== null)
                .map(ex => ({
                  session_id: workoutSession.id,
                  exercise_id: ex.exercises!.id,
                  exercise_name: ex.exercises!.name,
                  sets: ex.sets,
                  reps: ex.reps,
                  weight_kg: ex.weight_kg,
                }));

              if (logs.length > 0) {
                const { error: logsError } = await supabase
                  .from('workout_logs')
                  .insert(logs);
                if (logsError) throw logsError;
              }

              stopTimer();
              Alert.alert(
                '🎉 ¡Entrenamiento completado!',
                `Sesión guardada con ${logs.length} ejercicios.`,
                [{ text: 'Ver progreso', onPress: () => router.replace('/(tabs)/profile') },
                 { text: 'Continuar', style: 'cancel' }]
              );
            } catch (error: any) {
              Alert.alert('Error', 'No se pudo guardar la sesión');
              console.error('finishWorkout:', error.message);
            } finally {
              setFinishing(false);
            }
          },
        },
      ]
    );
  };

  const addExerciseFromCatalog = async (selectedExercise: {
    id: string; name: string; gif: any; muscleGroup: string;
  }) => {
    setIsAdding(true);
    try {
      let exerciseId: string;
      const { data: existing } = await supabase
        .from('exercises')
        .select('id')
        .eq('name', selectedExercise.name)
        .maybeSingle();

      if (existing) {
        exerciseId = existing.id;
      } else {
        const { data: newEx, error: exError } = await supabase
          .from('exercises')
          .insert([{ name: selectedExercise.name, muscle_group: selectedExercise.muscleGroup }])
          .select('id')
          .single();
        if (exError) throw exError;
        exerciseId = newEx.id;
      }

      const nextPosition = exercises.length;
      const { data: link, error: linkError } = await supabase
        .from('routine_exercises')
        .insert([{
          routine_id: id,
          exercise_id: exerciseId,
          position: nextPosition,
          sets: 3, reps: 10, weight_kg: 0, rest_seconds: 90,
        }])
        .select('id, position, sets, reps, weight_kg, rest_seconds')
        .single();
      if (linkError) throw linkError;

      const fullRow: ExerciseRow = {
        ...link,
        exercises: { id: exerciseId, name: selectedExercise.name },
      };
      setExercises(prev => [...prev, fullRow]);
      setLocalEdits(prev => ({
        ...prev,
        [link.id]: { sets: '3', reps: '10', weight_kg: '0' },
      }));
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setIsAdding(false);
    }
  };

  const deleteExercise = (exerciseId: string) => {
    Alert.alert('Eliminar', '¿Borrar este ejercicio?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Sí', style: 'destructive', onPress: async () => {
          const { error } = await supabase
            .from('routine_exercises').delete().eq('id', exerciseId);
          if (error) { Alert.alert('Error', 'No se pudo eliminar'); return; }
          setExercises(prev => prev.filter(ex => ex.id !== exerciseId));
        }
      },
    ]);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#A855F7" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={28} color="#A855F7" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.title} numberOfLines={1}>{routine?.name}</Text>
          <Text style={styles.subtitle}>
            {exercises.length} ejercicio{exercises.length !== 1 ? 's' : ''}
          </Text>
        </View>
        {!isTimerActive && (
          <TouchableOpacity onPress={() => startTimer(90)} style={styles.timerToggle}>
            <Ionicons name="timer-outline" size={24} color="#A855F7" />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={exercises}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="barbell-outline" size={40} color="#333" />
            <Text style={styles.emptyText}>Sin ejercicios aún</Text>
            <Text style={styles.emptySubtext}>Toca "Agregar ejercicio" para empezar</Text>
          </View>
        }
        renderItem={({ item }) => {
          const edit = localEdits[item.id] ?? {
            sets: item.sets.toString(),
            reps: item.reps.toString(),
            weight_kg: item.weight_kg.toString(),
          };
          return (
            <View style={[styles.exerciseCard, savingId === item.id && styles.savingCard]}>
              <View style={styles.exerciseHeader}>
                <Text style={styles.exerciseName} numberOfLines={1}>
                  {item.exercises?.name ?? 'Sin nombre'}
                </Text>
                <View style={styles.headerActions}>
                  {savingId === item.id && (
                    <ActivityIndicator size="small" color="#A855F7" style={{ marginRight: 10 }} />
                  )}
                  <TouchableOpacity
                    onPress={() => startTimer(item.rest_seconds || 60)}
                    style={{ marginRight: 15 }} hitSlop={10}
                  >
                    <Ionicons name="play-circle-outline" size={22} color="#A855F7" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => deleteExercise(item.id)} hitSlop={10}>
                    <Ionicons name="trash-outline" size={18} color="#444" />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.controlsRow}>
                <View style={styles.controlGroup}>
                  <Text style={styles.controlLabel}>SERIES</Text>
                  <View style={styles.counter}>
                    <TextInput
                      style={styles.counterInput}
                      keyboardType="numeric"
                      value={edit.sets}
                      onChangeText={(val) => handleLocalChange(item.id, 'sets', val)}
                      onBlur={() => commitUpdate(item.id, 'sets')}
                      selectTextOnFocus
                    />
                  </View>
                </View>
                <View style={styles.controlGroup}>
                  <Text style={styles.controlLabel}>REPS</Text>
                  <View style={styles.counter}>
                    <TextInput
                      style={styles.counterInput}
                      keyboardType="numeric"
                      value={edit.reps}
                      onChangeText={(val) => handleLocalChange(item.id, 'reps', val)}
                      onBlur={() => commitUpdate(item.id, 'reps')}
                      selectTextOnFocus
                    />
                  </View>
                </View>
                <View style={styles.controlGroup}>
                  <Text style={styles.controlLabel}>PESO (KG)</Text>
                  <View style={styles.counter}>
                    <TextInput
                      style={[styles.counterInput, { color: '#A855F7' }]}
                      keyboardType="decimal-pad"
                      value={edit.weight_kg}
                      onChangeText={(val) => handleLocalChange(item.id, 'weight_kg', val)}
                      onBlur={() => commitUpdate(item.id, 'weight_kg')}
                      selectTextOnFocus
                    />
                  </View>
                </View>
              </View>
            </View>
          );
        }}
      />

      {isTimerActive && (
        <View style={styles.timerContainer}>
          <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
          <TouchableOpacity
            onPress={() => setTimeLeft(prev => prev + 30)}
            style={styles.timerBtnSmall}
          >
            <Text style={styles.timerBtnText}>+30s</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={stopTimer} style={styles.timerBtnStop}>
            <Ionicons name="close" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {/* Botones inferiores */}
      <View style={styles.bottomRow}>
        <TouchableOpacity
          style={[styles.addCatalogBtn, isAdding && { opacity: 0.6 }]}
          onPress={() => setCatalogVisible(true)}
          disabled={isAdding}
        >
          {isAdding
            ? <ActivityIndicator color="#A855F7" size="small" />
            : <Ionicons name="add-circle-outline" size={20} color="#A855F7" />
          }
          <Text style={styles.addCatalogText}>Agregar</Text>
        </TouchableOpacity>

        {/* ✅ Botón finalizar entrenamiento */}
        <TouchableOpacity
          style={[styles.finishBtn, finishing && { opacity: 0.6 }]}
          onPress={finishWorkout}
          disabled={finishing}
        >
          {finishing
            ? <ActivityIndicator color="#fff" size="small" />
            : <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
          }
          <Text style={styles.finishBtnText}>Finalizar</Text>
        </TouchableOpacity>
      </View>

      <ExerciseCatalogModal
        visible={catalogVisible}
        onClose={() => setCatalogVisible(false)}
        onSelectExercise={addExerciseFromCatalog}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', paddingHorizontal: 15, paddingTop: 60 },
  center: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  headerTextContainer: { marginLeft: 10, flex: 1 },
  title: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  subtitle: { color: '#A855F7', fontSize: 12 },
  timerToggle: { backgroundColor: '#1A1A1A', padding: 10, borderRadius: 12 },
  exerciseCard: {
    backgroundColor: '#0A0A0A', padding: 15, borderRadius: 16,
    marginBottom: 10, borderWidth: 1, borderColor: '#1A1A1A',
  },
  savingCard: { borderColor: '#A855F7', backgroundColor: '#0D0A12' },
  exerciseHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 15,
  },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  exerciseName: { color: '#fff', fontSize: 16, fontWeight: 'bold', flex: 1 },
  controlsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  controlGroup: { alignItems: 'center', flex: 1, marginHorizontal: 5 },
  controlLabel: { color: '#444', fontSize: 10, fontWeight: 'bold', marginBottom: 5 },
  counter: { backgroundColor: '#111', borderRadius: 10, width: '100%' },
  counterInput: {
    color: '#fff', fontSize: 16, fontWeight: 'bold',
    textAlign: 'center', paddingVertical: 10,
  },
  timerContainer: {
    position: 'absolute', bottom: 90, left: 20, right: 20,
    backgroundColor: '#A855F7', borderRadius: 20, padding: 12,
    alignItems: 'center', flexDirection: 'row',
    justifyContent: 'space-between', elevation: 10,
    shadowColor: '#A855F7', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 10,
  },
  timerText: { color: '#fff', fontSize: 24, fontWeight: 'bold', flex: 1, marginLeft: 10 },
  timerBtnSmall: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginRight: 10,
  },
  timerBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  timerBtnStop: { backgroundColor: 'rgba(0,0,0,0.3)', padding: 8, borderRadius: 10 },

  // Botones inferiores
  bottomRow: {
    flexDirection: 'row', gap: 10,
    paddingVertical: 15,
  },
  addCatalogBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 6,
    borderWidth: 1.5, borderColor: '#A855F7',
    paddingVertical: 13, borderRadius: 14,
  },
  addCatalogText: { color: '#A855F7', fontWeight: 'bold', fontSize: 15 },
  finishBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 6,
    backgroundColor: '#A855F7',
    paddingVertical: 13, borderRadius: 14,
  },
  finishBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },

  emptyContainer: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyText: { color: '#555', fontSize: 16, fontWeight: '600' },
  emptySubtext: { color: '#333', fontSize: 13, textAlign: 'center' },
});