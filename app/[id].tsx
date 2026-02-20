import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  TextInput, ActivityIndicator, Modal, FlatList, SafeAreaView, Image 
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getRoutinesFromStorage, saveRoutinesToStorage } from '../services/storage';
import { EXERCISES_DATABASE } from '../constants/exercises'; 

interface Exercise {
  id: string;
  name: string;
  muscle: string;
  gif: any; 
  instanceId?: string;
  sets?: any[];
}

export default function RoutineDetailScreen() {
  const { id } = useLocalSearchParams();
  const [routines, setRoutines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  
  // Nuevo estado para el buscador
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadData = async () => {
      const data = await getRoutinesFromStorage();
      setRoutines(data || []);
      setLoading(false);
    };
    loadData();
  }, []);

  const currentRoutine = routines.find(r => r.id === id);
  
const flatExercises = Object.values(EXERCISES_DATABASE).flat() as Exercise[];

const filteredExercises = flatExercises.filter(ex => {
  const nameMatch = ex?.name?.toLowerCase().includes(searchQuery.toLowerCase());
  const muscleMatch = ex?.muscle?.toLowerCase().includes(searchQuery.toLowerCase());
  
  return nameMatch || muscleMatch;
});

  const updateStorage = async (updatedRoutines: any[]) => {
    setRoutines(updatedRoutines);
    await saveRoutinesToStorage(updatedRoutines);
  };

  const updateSetData = (exerciseInstanceId: string, setId: string, field: 'weight' | 'reps', value: string) => {
    const updated = routines.map(r => {
      if (r.id === id) {
        return {
          ...r,
          exercises: r.exercises.map((ex: any) => {
            if (ex.instanceId === exerciseInstanceId) {
              return {
                ...ex,
                sets: ex.sets.map((s: any) => s.id === setId ? { ...s, [field]: value } : s)
              };
            }
            return ex;
          })
        };
      }
      return r;
    });
    updateStorage(updated);
  };

  const addExerciseToRoutine = (baseExercise: any) => {
    const newInstance = {
      ...baseExercise,
      instanceId: Date.now().toString(),
      sets: [{ id: Date.now().toString(), reps: '10', weight: '0' }]
    };
    const updated = routines.map(r => {
      if (r.id === id) return { ...r, exercises: [...r.exercises, newInstance] };
      return r;
    });
    updateStorage(updated);
    setIsModalVisible(false);
    setSearchQuery(''); // Limpiar búsqueda al cerrar
  };

  const addSet = (exerciseInstanceId: string) => {
    const updated = routines.map(r => {
      if (r.id === id) {
        return {
          ...r,
          exercises: r.exercises.map((ex: any) => {
            if (ex.instanceId === exerciseInstanceId) {
              const newSet = { id: Date.now().toString(), reps: '10', weight: '0' };
              return { ...ex, sets: [...(ex.sets || []), newSet] };
            }
            return ex;
          })
        };
      }
      return r;
    });
    updateStorage(updated);
  };

  const removeSet = (exerciseInstanceId: string, setId: string) => {
    const updated = routines.map(r => {
      if (r.id === id) {
        return {
          ...r,
          exercises: r.exercises.map((ex: any) => {
            if (ex.instanceId === exerciseInstanceId) {
              return { ...ex, sets: ex.sets.filter((s: any) => s.id !== setId) };
            }
            return ex;
          })
        };
      }
      return r;
    });
    updateStorage(updated);
  };

  const removeExercise = (exerciseInstanceId: string) => {
    const updated = routines.map(r => {
      if (r.id === id) return { ...r, exercises: r.exercises.filter((ex: any) => ex.instanceId !== exerciseInstanceId) };
      return r;
    });
    updateStorage(updated);
  };

  if (loading) return <ActivityIndicator color="#A855F7" style={{ flex: 1, backgroundColor: '#000' }} />;
  if (!currentRoutine) return <View style={styles.container}><Text style={styles.text}>No encontrada</Text></View>;

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ 
        title: currentRoutine.name, 
        headerTintColor: '#A855F7', 
        headerStyle: { backgroundColor: '#000' },
        headerBackTitle: 'Volver'
      }} />
      
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {currentRoutine.exercises.map((exercise: any) => (
          <View key={exercise.instanceId} style={styles.exerciseCard}>
            
            <View style={styles.exerciseHeader}>
              <View>
                <Text style={styles.exerciseName}>{exercise.name}</Text>
                <Text style={styles.exerciseSubtitle}>{exercise.muscle}</Text>
              </View>
              <TouchableOpacity onPress={() => removeExercise(exercise.instanceId)}>
                <Ionicons name="trash-outline" size={20} color="#ff4444" />
              </TouchableOpacity>
            </View>

            <View style={styles.gifContainer}>
              {exercise.gif ? (
                <Image 
                  source={typeof exercise.gif === 'string' ? { uri: exercise.gif } : exercise.gif} 
                  style={styles.exerciseGif}
                  resizeMode="contain"
                />
              ) : (
                <View style={[styles.exerciseGif, styles.gifPlaceholder]}>
                  <Ionicons name="image-outline" size={40} color="#333" />
                </View>
              )}
            </View>

            <View style={styles.tableHeader}>
              <Text style={[styles.columnLabel, { width: 35 }]}>SET</Text>
              <Text style={[styles.columnLabel, { flex: 1, textAlign: 'center' }]}>PESO KG</Text>
              <Text style={[styles.columnLabel, { flex: 1, textAlign: 'center' }]}>REPS</Text>
              <Text style={{ width: 30 }}></Text>
            </View>

            {exercise.sets?.map((set: any, index: number) => (
              <View key={set.id} style={styles.setRow}>
                <View style={styles.setNumberCircle}><Text style={styles.setNumberText}>{index + 1}</Text></View>
                <TextInput 
                  style={styles.input} 
                  value={set.weight} 
                  keyboardType="numeric" 
                  onChangeText={(val) => updateSetData(exercise.instanceId, set.id, 'weight', val)}
                />
                <TextInput 
                  style={styles.input} 
                  value={set.reps} 
                  keyboardType="numeric" 
                  onChangeText={(val) => updateSetData(exercise.instanceId, set.id, 'reps', val)}
                />
                <TouchableOpacity onPress={() => removeSet(exercise.instanceId, set.id)}>
                  <Ionicons name="remove-circle-outline" size={20} color="#444" />
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity style={styles.addSetButton} onPress={() => addSet(exercise.instanceId)}>
              <Ionicons name="add" size={16} color="#A855F7" />
              <Text style={styles.addSetText}>Añadir Serie</Text>
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity style={styles.mainAddButton} onPress={() => setIsModalVisible(true)}>
          <Ionicons name="barbell-outline" size={24} color="#fff" />
          <Text style={styles.mainAddButtonText}>Agregar Ejercicio</Text>
        </TouchableOpacity>
        
        <View style={{ height: 60 }} />
      </ScrollView>

      <Modal visible={isModalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Catálogo</Text>
            <TouchableOpacity onPress={() => setIsModalVisible(false)}>
              <Ionicons name="close-circle" size={32} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* BARRA DE BÚSQUEDA */}
          <View style={styles.searchBarContainer}>
            <Ionicons name="search" size={20} color="#666" style={{ marginRight: 10 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar ejercicio o músculo..."
              placeholderTextColor="#666"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <FlatList
            data={filteredExercises}
            keyExtractor={(item, index) => item.id || index.toString()} // Más seguro usar index si falta ID
            renderItem={({ item }: { item: Exercise }) => (
              <TouchableOpacity 
                style={styles.exerciseOption} 
                onPress={() => addExerciseToRoutine(item)}
              >
                <Text style={styles.exerciseOptionName}>{item?.name || 'Sin nombre'}</Text>
                <Text style={styles.exerciseOptionMuscle}>{item?.muscle || 'General'}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  scrollContainer: { padding: 16 },
  text: { color: '#fff', textAlign: 'center', marginTop: 20 },
  exerciseCard: { backgroundColor: '#0A0A0A', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#1A1A1A' },
  exerciseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  exerciseName: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  exerciseSubtitle: { color: '#A855F7', fontSize: 11, textTransform: 'uppercase', fontWeight: '700' },
  gifContainer: { width: '100%', height: 160, borderRadius: 12, overflow: 'hidden', marginBottom: 15, backgroundColor: '#111' },
  exerciseGif: { width: '100%', height: '100%' },
  gifPlaceholder: { justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  tableHeader: { flexDirection: 'row', marginBottom: 8, opacity: 0.5 },
  columnLabel: { color: '#fff', fontSize: 9, fontWeight: '800' },
  setRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, backgroundColor: '#111', padding: 8, borderRadius: 10 },
  setNumberCircle: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#1A1A1A', justifyContent: 'center', alignItems: 'center' },
  setNumberText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  input: { flex: 1, color: '#fff', textAlign: 'center', fontSize: 16, fontWeight: 'bold' },
  addSetButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 8, padding: 8, borderStyle: 'dashed', borderWidth: 1, borderColor: '#333', borderRadius: 8 },
  addSetText: { color: '#A855F7', fontSize: 12, fontWeight: 'bold', marginLeft: 4 },
  mainAddButton: { backgroundColor: '#A855F7', flexDirection: 'row', borderRadius: 14, padding: 16, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  mainAddButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 10 },
  modalContainer: { flex: 1, backgroundColor: '#000', padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  exerciseOption: { backgroundColor: '#0A0A0A', padding: 18, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#1A1A1A' },
  exerciseOptionName: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  exerciseOptionMuscle: { color: '#666', fontSize: 12, marginTop: 4 },
  searchBarContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', borderRadius: 12, paddingHorizontal: 15, paddingVertical: 10, marginBottom: 20, borderWidth: 1, borderColor: '#1A1A1A' },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
  },
});