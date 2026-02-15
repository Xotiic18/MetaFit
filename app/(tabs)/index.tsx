import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, Modal, TextInput, ScrollView, StatusBar, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { getRoutinesFromStorage, saveRoutinesToStorage } from '../../services/storage';

const PLAN_TEMPLATES = [
  { id: 'p3', name: 'Full Body', days: 3 },
  { id: 'p4', name: 'Torso/Pierna', days: 4 },
  { id: 'p5', name: 'Push/Pull/Legs', days: 5 },
  { id: 'p6', name: 'P/P/L Avanzado', days: 6 },
];

export default function RoutinesScreen() {
  const [routines, setRoutines] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newRoutineName, setNewRoutineName] = useState('');
  const router = useRouter();

  useFocusEffect(useCallback(() => { loadRoutines(); }, []));

  const loadRoutines = async () => {
    const data = await getRoutinesFromStorage();
    setRoutines(data || []);
  };

  const handleCreateRoutine = async (templateId?: string) => {
    let name = newRoutineName;
    if (templateId) {
      const template = PLAN_TEMPLATES.find(t => t.id === templateId);
      name = template?.name || 'Rutina';
    }
    if (!name.trim()) return;

    const newRoutine = {
      id: Date.now().toString(),
      name: name,
      exercises: [], // Aquí se inyectarían los ejercicios de la plantilla
    };

    const updated = [...routines, newRoutine];
    await saveRoutinesToStorage(updated);
    setRoutines(updated);
    setIsModalVisible(false);
    setNewRoutineName('');
  };

  const deleteRoutine = (id: string) => {
    const eliminar = () => {
        const updated = routines.filter(r => r.id !== id);
        saveRoutinesToStorage(updated);
        setRoutines(updated);
    };

    if (Platform.OS === 'web') {
      if (window.confirm("¿Borrar esta rutina?")) eliminar();
    } else {
      Alert.alert("Eliminar", "¿Borrar esta rutina?", [
        { text: "No" },
        { text: "Sí", style: "destructive", onPress: eliminar }
      ]);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>MetaFit</Text>
        <TouchableOpacity style={styles.plusButton} onPress={() => setIsModalVisible(true)}>
          <Ionicons name="add" size={30} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.label}>PLANES DE ENTRENAMIENTO</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
          {PLAN_TEMPLATES.map((plan) => (
            <TouchableOpacity key={plan.id} style={styles.planCard} onPress={() => handleCreateRoutine(plan.id)}>
              <View style={styles.planBadge}><Text style={styles.planBadgeText}>{plan.days}</Text></View>
              <Text style={styles.planText}>{plan.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.label}>MIS ENTRENAMIENTOS</Text>
        {routines.map((item) => (
          <View key={item.id} style={styles.routineCard}>
            <View style={styles.accentBar} />
            <TouchableOpacity 
              style={styles.cardContent} 
              onPress={() => router.push({ pathname: `/${item.id}`, params: { name: item.name } })}
            >
              <Text style={styles.routineTitle}>{item.name}</Text>
              <Text style={styles.exerciseCount}>{item.exercises?.length || 0} ejercicios</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteRoutine(item.id)}>
              <Ionicons name="trash-outline" size={20} color="#ff4444" />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {/* MODAL CREAR PERSONALIZADA */}
      <Modal visible={isModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeader}>Nombre de la Rutina</Text>
            <TextInput 
                style={styles.modalInput} 
                placeholder="Ej: Empuje Martes" 
                placeholderTextColor="#666" 
                value={newRoutineName} 
                onChangeText={setNewRoutineName} 
                autoFocus 
            />
            <View style={{flexDirection: 'row', gap: 10}}>
               <TouchableOpacity style={[styles.modalBtn, {backgroundColor: '#333'}]} onPress={() => setIsModalVisible(false)}>
                   <Text style={{color: '#fff'}}>Cancelar</Text>
               </TouchableOpacity>
               <TouchableOpacity style={styles.modalBtn} onPress={() => handleCreateRoutine()}>
                   <Text style={{fontWeight: 'bold', color: '#000'}}>Crear</Text>
               </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#000', 
    paddingTop: 60,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 500 
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, alignItems: 'center', marginBottom: 25 },
  headerTitle: { color: '#fff', fontSize: 32, fontWeight: '900' },
  plusButton: { backgroundColor: '#A855F7', width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  label: { color: '#94A3B8', fontSize: 11, fontWeight: 'bold', marginLeft: 20, marginBottom: 15, letterSpacing: 1.2 },
  hScroll: { paddingLeft: 20, gap: 12, paddingBottom: 10 },
  planCard: { backgroundColor: '#1c1c1e', padding: 15, borderRadius: 20, width: 125, height: 105, justifyContent: 'center', alignItems: 'center' },
  planBadge: { backgroundColor: '#A855F7', paddingHorizontal: 8, borderRadius: 6, marginBottom: 6 },
  planBadgeText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  planText: { color: '#fff', fontSize: 12, fontWeight: 'bold', textAlign: 'center' },
  routineCard: { backgroundColor: '#1c1c1e', marginHorizontal: 20, marginBottom: 12, borderRadius: 15, flexDirection: 'row', overflow: 'hidden', height: 85 },
  accentBar: { width: 5, backgroundColor: '#A855F7' },
  cardContent: { flex: 1, paddingLeft: 15, justifyContent: 'center' },
  routineTitle: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
  exerciseCount: { color: '#A855F7', fontSize: 12, marginTop: 4 },
  deleteBtn: { width: 55, justifyContent: 'center', alignItems: 'center', borderLeftWidth: 1, borderLeftColor: '#2c2c2e' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#1c1c1e', width: '85%', padding: 25, borderRadius: 25, borderWidth: 1, borderColor: '#333' },
  modalHeader: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  modalInput: { backgroundColor: '#2c2c2e', color: '#fff', padding: 15, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: '#444' },
  modalBtn: { backgroundColor: '#A855F7', flex: 1, padding: 15, borderRadius: 12, alignItems: 'center' }
});