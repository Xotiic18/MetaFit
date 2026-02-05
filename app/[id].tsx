import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Image, Modal, TextInput, FlatList, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
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
    Alert.alert("Quitar Ejercicio", "¿Quieres eliminarlo?", [
      { text: "No" },
      { text: "Sí", style: "destructive", onPress: () => {
        const updated = selectedExercises.filter(ex => ex.instanceId !== instanceId);
        saveToStorage(updated);
      }}
    ]);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <View style={styles.container}>
        <Stack.Screen options={{ title: name as string, headerTintColor: '#0aff96', headerStyle: { backgroundColor: '#000' } }} />
        
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

              {/* TABLA DE SERIES */}
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
                <Ionicons name="add-circle-outline" size={20} color="#0aff96" />
                <Text style={styles.addSetText}>Añadir Serie</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>

        <TouchableOpacity style={styles.searchBtn} onPress={() => setShowSelector(true)}>
          <Ionicons name="search" size={22} color="#000" />
          <Text style={styles.searchBtnText}>BUSCAR EJERCICIO</Text>
        </TouchableOpacity>

        {/* El Modal de búsqueda se mantiene igual que antes */}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  exBox: { backgroundColor: '#1c1c1e', padding: 15, borderRadius: 20, marginBottom: 20 },
  exHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  exGif: { width: 45, height: 45, borderRadius: 8, marginRight: 12, backgroundColor: '#fff' },
  exName: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  exMuscle: { color: '#0aff96', fontSize: 11, fontWeight: 'bold' },
  
  tableHeader: { flexDirection: 'row', marginBottom: 10, paddingHorizontal: 5 },
  colLabel: { color: '#555', fontSize: 10, fontWeight: 'bold', textAlign: 'center' },
  
  setRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  setNum: { color: '#fff', flex: 1, textAlign: 'center', fontWeight: 'bold' },
  input: { backgroundColor: '#2c2c2e', color: '#fff', flex: 2, padding: 8, borderRadius: 8, textAlign: 'center', fontSize: 14 },
  
  addSetRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 10, paddingVertical: 5 },
  addSetText: { color: '#0aff96', marginLeft: 8, fontWeight: 'bold', fontSize: 13 },
  
  searchBtn: { position: 'absolute', bottom: 30, left: 20, right: 20, backgroundColor: '#0aff96', height: 60, borderRadius: 30, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
  searchBtnText: { flexDirection: 'row', fontWeight: 'bold'  }

});