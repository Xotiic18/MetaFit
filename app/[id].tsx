import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Image, Modal, TextInput, FlatList, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
// Asegúrate de que estas rutas sean correctas en tu proyecto
import { EXERCISE_DATABASE } from '../constants/exercises';
import { getRoutinesFromStorage, saveRoutinesToStorage } from '../services/storage';

const ALL_EXERCISES = Object.keys(EXERCISE_DATABASE).flatMap(m => 
  EXERCISE_DATABASE[m].map(ex => ({ ...ex, muscle: m }))
);

export default function RoutineDetail() {
  const { id, name } = useLocalSearchParams();
  const [selectedExercises, setSelectedExercises] = useState([]);
  const [showSelector, setShowSelector] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => { load(); }, [id]);

  const load = async () => {
    const all = await getRoutinesFromStorage();
    const current = all.find(r => r.id === id);
    if (current?.exercises) setSelectedExercises(current.exercises);
  };

  const saveToStorage = async (updatedExercises) => {
    setSelectedExercises(updatedExercises);
    const all = await getRoutinesFromStorage();
    await saveRoutinesToStorage(all.map(r => r.id === id ? { ...r, exercises: updatedExercises } : r));
  };

  const addExercise = (exercise) => {
    const newExercise = {
      ...exercise,
      instanceId: Date.now().toString(),
      sets: [{ id: '1', reps: '', weight: '', rest: '60' }]
    };
    const updated = [...selectedExercises, newExercise];
    saveToStorage(updated);
    setShowSelector(false);
  };

  const addSet = (instanceId) => {
    const updated = selectedExercises.map(ex => {
      if (ex.instanceId === instanceId) {
        const newSet = { id: Date.now().toString(), reps: '', weight: '', rest: '60' };
        return { ...ex, sets: [...ex.sets, newSet] };
      }
      return ex;
    });
    saveToStorage(updated);
  };

  const updateSetData = (instanceId, setId, field, value) => {
    const updated = selectedExercises.map(ex => {
      if (ex.instanceId === instanceId) {
        const newSets = ex.sets.map(s => s.id === setId ? { ...s, [field]: value } : s);
        return { ...ex, sets: newSets };
      }
      return ex;
    });
    saveToStorage(updated);
  };

  const removeExercise = (instanceId) => {
    const confirmar = Platform.OS === 'web' 
      ? window.confirm("¿Quitar este ejercicio?") 
      : true;

    if (confirmar) {
      if (Platform.OS !== 'web') {
        Alert.alert("Quitar Ejercicio", "¿Quieres eliminarlo?", [
          { text: "No" },
          { text: "Sí", style: "destructive", onPress: () => {
            const updated = selectedExercises.filter(ex => ex.instanceId !== instanceId);
            saveToStorage(updated);
          }}
        ]);
      } else {
        const updated = selectedExercises.filter(ex => ex.instanceId !== instanceId);
        saveToStorage(updated);
      }
    }
  };

  const filteredExercises = ALL_EXERCISES.filter(ex => 
    ex.name.toLowerCase().includes(search.toLowerCase()) || 
    ex.muscle.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <View style={styles.container}>
        <Stack.Screen options={{ 
          title: name as string, 
          headerTintColor: '#A855F7', 
          headerStyle: { backgroundColor: '#000' } 
        }} />
        
        <ScrollView contentContainerStyle={{ padding: 15, paddingBottom: 120 }}>
          {selectedExercises.map((ex) => (
            <View key={ex.instanceId} style={styles.exBox}>
              <View style={styles.exHeader}>
                <Image source={{ uri: ex.gif }} style={styles.exGif} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.exName}>{ex.name}</Text>
                  <Text style={styles.exMuscle}>{ex.muscle}</Text>
                </View>
                <TouchableOpacity onPress={() => removeExercise(ex.instanceId)}>
                  <Ionicons name="trash-outline" size={18} color="#ff4444" />
                </TouchableOpacity>
              </View>

              <View style={styles.tableHeader}>
                <Text style={[styles.colLabel, { flex: 1 }]}>SET</Text>
                <Text style={[styles.colLabel, { flex: 2 }]}>REPS</Text>
                <Text style={[styles.colLabel, { flex: 2 }]}>KG</Text>
                <Text style={[styles.colLabel, { flex: 2 }]}>DESC.</Text>
              </View>

              {ex.sets.map((set, index) => (
                <View key={set.id} style={styles.setRow}>
                  <Text style={styles.setNum}>{index + 1}</Text>
                  <TextInput 
                    style={styles.input} 
                    keyboardType="numeric" 
                    placeholder="0" 
                    placeholderTextColor="#444"
                    value={set.reps}
                    onChangeText={(val) => updateSetData(ex.instanceId, set.id, 'reps', val)}
                  />
                  <TextInput 
                    style={styles.input} 
                    keyboardType="numeric" 
                    placeholder="0" 
                    placeholderTextColor="#444"
                    value={set.weight}
                    onChangeText={(val) => updateSetData(ex.instanceId, set.id, 'weight', val)}
                  />
                  <TextInput 
                    style={styles.input} 
                    keyboardType="numeric" 
                    placeholder="60s" 
                    placeholderTextColor="#444"
                    value={set.rest}
                    onChangeText={(val) => updateSetData(ex.instanceId, set.id, 'rest', val)}
                  />
                </View>
              ))}

              <TouchableOpacity style={styles.addSetRow} onPress={() => addSet(ex.instanceId)}>
                <Ionicons name="add-circle-outline" size={20} color="#A855F7" />
                <Text style={styles.addSetText}>Añadir Serie</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>

        <TouchableOpacity style={styles.searchBtn} onPress={() => setShowSelector(true)}>
          <Ionicons name="search" size={22} color="#000" />
          <Text style={styles.searchBtnText}>BUSCAR EJERCICIO</Text>
        </TouchableOpacity>

        {/* MODAL DE BÚSQUEDA CORREGIDO */}
        <Modal visible={showSelector} animationType="slide" transparent={false}>
          <View style={[styles.container, { paddingTop: 50 }]}>
            <View style={styles.modalHeader}>
              <TextInput 
                style={styles.searchInput}
                placeholder="Buscar ejercicio o músculo..."
                placeholderTextColor="#94A3B8"
                value={search}
                onChangeText={setSearch}
                autoFocus
              />
              <TouchableOpacity onPress={() => setShowSelector(false)} style={styles.closeBtn}>
                <Text style={{ color: '#A855F7', fontWeight: 'bold' }}>Cerrar</Text>
              </TouchableOpacity>
            </View>
            <FlatList 
              data={filteredExercises}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.exerciseItem} onPress={() => addExercise(item)}>
                  <Image source={{ uri: item.gif }} style={styles.miniGif} />
                  <View>
                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>{item.name}</Text>
                    <Text style={{ color: '#A855F7', fontSize: 12 }}>{item.muscle}</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        </Modal>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', alignSelf: 'center', width: '100%', maxWidth: 500 },
  exBox: { backgroundColor: '#1c1c1e', padding: 18, borderRadius: 22, marginBottom: 20, borderWidth: 1, borderColor: '#2c2c2e' },
  exHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  exGif: { width: 50, height: 50, borderRadius: 10, marginRight: 12, backgroundColor: '#333' },
  exName: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  exMuscle: { color: '#A855F7', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
  tableHeader: { flexDirection: 'row', marginBottom: 12, paddingHorizontal: 5 },
  colLabel: { color: '#94A3B8', fontSize: 11, fontWeight: '800', textAlign: 'center' },
  setRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  setNum: { color: '#A855F7', flex: 1, textAlign: 'center', fontWeight: 'bold', fontSize: 16 },
  input: { backgroundColor: '#2c2c2e', color: '#fff', flex: 2, padding: 10, borderRadius: 10, textAlign: 'center', fontSize: 15, borderWidth: 1, borderColor: '#333' },
  addSetRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 12, paddingVertical: 8, borderStyle: 'dashed', borderWidth: 1, borderColor: '#A855F7', borderRadius: 10 },
  addSetText: { color: '#A855F7', marginLeft: 8, fontWeight: 'bold', fontSize: 14 },
  searchBtn: { position: 'absolute', bottom: 30, left: 20, right: 20, backgroundColor: '#A855F7', height: 60, borderRadius: 30, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
  searchBtnText: { fontWeight: 'bold', fontSize: 16 },
  modalHeader: { flexDirection: 'row', padding: 20, alignItems: 'center', gap: 10 },
  searchInput: { flex: 1, backgroundColor: '#1c1c1e', color: '#fff', padding: 15, borderRadius: 15, borderWidth: 1, borderColor: '#A855F7' },
  closeBtn: { padding: 10 },
  exerciseItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#1c1c1e' },
  miniGif: { width: 40, height: 40, borderRadius: 5, marginRight: 15, backgroundColor: '#333' }
});