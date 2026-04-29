import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Modal, TextInput, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { supabase } from '../../services/supabase';
import { Ionicons } from '@expo/vector-icons';

type BaseRoutine = {
  id: string;
  name: string;
  description: string;
  icon: string;
};

type BaseExercise = {
  id: string;
  exercise_name: string;
  muscle_group: string;
  position: number;
  sets: number;
  reps: number;
  rest_seconds: number;
};

const ICONS = [
  'barbell-outline', 'fitness-outline', 'body-outline',
  'arrow-up-circle-outline', 'arrow-down-circle-outline', 'walk-outline',
];

export default function AdminRoutinesScreen() {
  const [routines, setRoutines]               = useState<BaseRoutine[]>([]);
  const [loading, setLoading]                 = useState(true);
  const [modalVisible, setModalVisible]       = useState(false);
  const [exerciseModal, setExerciseModal]     = useState(false);
  const [selectedRoutine, setSelectedRoutine] = useState<BaseRoutine | null>(null);
  const [exercises, setExercises]             = useState<BaseExercise[]>([]);
  const [saving, setSaving]                   = useState(false);

  // Form rutina
  const [formName, setFormName]         = useState('');
  const [formDesc, setFormDesc]         = useState('');
  const [formIcon, setFormIcon]         = useState('barbell-outline');
  const [editingId, setEditingId]       = useState<string | null>(null);

  // Form ejercicio
  const [exName, setExName]             = useState('');
  const [exMuscle, setExMuscle]         = useState('');
  const [exSets, setExSets]             = useState('3');
  const [exReps, setExReps]             = useState('10');
  const [exRest, setExRest]             = useState('90');

  const fetchRoutines = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('base_routines')
      .select('*')
      .order('created_at', { ascending: true });
    setRoutines(data || []);
    setLoading(false);
  };

  useFocusEffect(useCallback(() => { fetchRoutines(); }, []));

  const openCreate = () => {
    setEditingId(null);
    setFormName(''); setFormDesc(''); setFormIcon('barbell-outline');
    setModalVisible(true);
  };

  const openEdit = (routine: BaseRoutine) => {
    setEditingId(routine.id);
    setFormName(routine.name);
    setFormDesc(routine.description);
    setFormIcon(routine.icon);
    setModalVisible(true);
  };

  const saveRoutine = async () => {
    if (!formName.trim()) { Alert.alert('Error', 'El nombre es obligatorio'); return; }
    setSaving(true);
    try {
      if (editingId) {
        await supabase.from('base_routines').update({
          name: formName.trim(), description: formDesc.trim(), icon: formIcon,
          updated_at: new Date().toISOString(),
        }).eq('id', editingId);
        setRoutines(prev => prev.map(r =>
          r.id === editingId ? { ...r, name: formName.trim(), description: formDesc.trim(), icon: formIcon } : r
        ));
      } else {
        const { data } = await supabase.from('base_routines').insert([{
          name: formName.trim(), description: formDesc.trim(), icon: formIcon,
        }]).select().single();
        if (data) setRoutines(prev => [...prev, data]);
      }
      setModalVisible(false);
    } catch {
      Alert.alert('Error', 'No se pudo guardar la rutina');
    } finally {
      setSaving(false);
    }
  };

  const deleteRoutine = (routine: BaseRoutine) => {
    Alert.alert('Eliminar', `¿Eliminar "${routine.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
          await supabase.from('base_routines').delete().eq('id', routine.id);
          setRoutines(prev => prev.filter(r => r.id !== routine.id));
      }},
    ]);
  };

  const openExercises = async (routine: BaseRoutine) => {
    setSelectedRoutine(routine);
    const { data } = await supabase
      .from('base_routine_exercises')
      .select('*')
      .eq('base_routine_id', routine.id)
      .order('position', { ascending: true });
    setExercises(data || []);
    setExerciseModal(true);
  };

  const addExercise = async () => {
    if (!exName.trim() || !selectedRoutine) return;
    setSaving(true);
    try {
      const { data } = await supabase.from('base_routine_exercises').insert([{
        base_routine_id: selectedRoutine.id,
        exercise_name:   exName.trim(),
        muscle_group:    exMuscle.trim(),
        position:        exercises.length,
        sets:            parseInt(exSets) || 3,
        reps:            parseInt(exReps) || 10,
        rest_seconds:    parseInt(exRest) || 90,
      }]).select().single();
      if (data) setExercises(prev => [...prev, data]);
      setExName(''); setExMuscle(''); setExSets('3'); setExReps('10'); setExRest('90');
    } catch {
      Alert.alert('Error', 'No se pudo agregar el ejercicio');
    } finally {
      setSaving(false);
    }
  };

  const deleteExercise = async (id: string) => {
    await supabase.from('base_routine_exercises').delete().eq('id', id);
    setExercises(prev => prev.filter(e => e.id !== id));
  };

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#A855F7" />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Rutinas Base</Text>
          <Text style={styles.subtitle}>Panel de Administrador</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={openCreate}>
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={routines}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.routineCard}>
            <View style={styles.cardLeft}>
              <View style={styles.iconBox}>
                <Ionicons name={item.icon as any} size={22} color="#A855F7" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.routineName}>{item.name}</Text>
                <Text style={styles.routineDesc} numberOfLines={1}>{item.description}</Text>
              </View>
            </View>
            <View style={styles.cardActions}>
              <TouchableOpacity onPress={() => openExercises(item)} hitSlop={8} style={styles.actionIcon}>
                <Ionicons name="list-outline" size={20} color="#A855F7" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => openEdit(item)} hitSlop={8} style={styles.actionIcon}>
                <Ionicons name="pencil-outline" size={20} color="#888" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => deleteRoutine(item)} hitSlop={8} style={styles.actionIcon}>
                <Ionicons name="trash-outline" size={20} color="#ff4444" />
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="barbell-outline" size={40} color="#333" />
            <Text style={styles.emptyText}>Sin rutinas base aún</Text>
          </View>
        }
      />

      {/* ── Modal Crear/Editar Rutina ── */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editingId ? 'Editar Rutina' : 'Nueva Rutina'}</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)} hitSlop={10}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 20 }}>
            <Text style={styles.label}>Nombre</Text>
            <TextInput style={styles.input} value={formName} onChangeText={setFormName}
              placeholder="Ej: Push Day" placeholderTextColor="#555" />

            <Text style={styles.label}>Descripción</Text>
            <TextInput style={styles.input} value={formDesc} onChangeText={setFormDesc}
              placeholder="Ej: Pecho, Hombro y Tríceps" placeholderTextColor="#555" />

            <Text style={styles.label}>Ícono</Text>
            <View style={styles.iconGrid}>
              {ICONS.map(icon => (
                <TouchableOpacity
                  key={icon}
                  style={[styles.iconOption, formIcon === icon && styles.iconOptionActive]}
                  onPress={() => setFormIcon(icon)}
                >
                  <Ionicons name={icon as any} size={24} color={formIcon === icon ? '#A855F7' : '#555'} />
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, saving && { opacity: 0.6 }]}
              onPress={saveRoutine} disabled={saving}
            >
              {saving
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.saveBtnText}>{editingId ? 'Guardar cambios' : 'Crear rutina'}</Text>
              }
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* ── Modal Ejercicios ── */}
      <Modal visible={exerciseModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setExerciseModal(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{selectedRoutine?.name}</Text>
            <TouchableOpacity onPress={() => setExerciseModal(false)} hitSlop={10}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 20 }}>
            {/* Lista de ejercicios */}
            {exercises.map(ex => (
              <View key={ex.id} style={styles.exerciseRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.exName}>{ex.exercise_name}</Text>
                  <Text style={styles.exDetail}>{ex.muscle_group} · {ex.sets}×{ex.reps} · {ex.rest_seconds}s</Text>
                </View>
                <TouchableOpacity onPress={() => deleteExercise(ex.id)} hitSlop={8}>
                  <Ionicons name="trash-outline" size={18} color="#ff4444" />
                </TouchableOpacity>
              </View>
            ))}

            {exercises.length === 0 && (
              <Text style={{ color: '#555', textAlign: 'center', marginBottom: 20 }}>
                Sin ejercicios — agrega el primero
              </Text>
            )}

            {/* Agregar ejercicio */}
            <Text style={[styles.label, { marginTop: 20 }]}>Agregar ejercicio</Text>
            <TextInput style={styles.input} value={exName} onChangeText={setExName}
              placeholder="Nombre del ejercicio" placeholderTextColor="#555" />
            <TextInput style={styles.input} value={exMuscle} onChangeText={setExMuscle}
              placeholder="Grupo muscular" placeholderTextColor="#555" />
            <View style={styles.row3}>
              <View style={{ flex: 1 }}>
                <Text style={styles.miniLabel}>Series</Text>
                <TextInput style={styles.inputSmall} value={exSets} onChangeText={setExSets}
                  keyboardType="numeric" placeholderTextColor="#555" />
              </View>
              <View style={{ flex: 1, marginHorizontal: 8 }}>
                <Text style={styles.miniLabel}>Reps</Text>
                <TextInput style={styles.inputSmall} value={exReps} onChangeText={setExReps}
                  keyboardType="numeric" placeholderTextColor="#555" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.miniLabel}>Descanso (s)</Text>
                <TextInput style={styles.inputSmall} value={exRest} onChangeText={setExRest}
                  keyboardType="numeric" placeholderTextColor="#555" />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, saving && { opacity: 0.6 }]}
              onPress={addExercise} disabled={saving}
            >
              {saving
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.saveBtnText}>Agregar ejercicio</Text>
              }
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: '#000', paddingHorizontal: 20, paddingTop: 60 },
  center:     { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  header:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title:      { color: '#fff', fontSize: 26, fontWeight: 'bold' },
  subtitle:   { color: '#A855F7', fontSize: 13 },
  addBtn:     { backgroundColor: '#A855F7', width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  routineCard:{ backgroundColor: '#0A0A0A', borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#1A1A1A', flexDirection: 'row', alignItems: 'center' },
  cardLeft:   { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconBox:    { backgroundColor: '#1A1A1A', padding: 10, borderRadius: 12, marginRight: 12 },
  routineName:{ color: '#fff', fontSize: 15, fontWeight: '600' },
  routineDesc:{ color: '#555', fontSize: 12, marginTop: 2 },
  cardActions:{ flexDirection: 'row', alignItems: 'center' },
  actionIcon: { marginLeft: 12 },
  empty:      { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyText:  { color: '#555', fontSize: 15 },
  modalContainer: { flex: 1, backgroundColor: '#000' },
  modalHeader:{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#1A1A1A' },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  label:      { color: '#888', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  input:      { backgroundColor: '#0A0A0A', color: '#fff', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#1A1A1A', marginBottom: 16 },
  iconGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  iconOption: { width: 52, height: 52, borderRadius: 12, backgroundColor: '#0A0A0A', borderWidth: 1, borderColor: '#1A1A1A', justifyContent: 'center', alignItems: 'center' },
  iconOptionActive: { borderColor: '#A855F7', backgroundColor: '#A855F711' },
  saveBtn:    { backgroundColor: '#A855F7', borderRadius: 14, padding: 15, alignItems: 'center', marginTop: 8 },
  saveBtnText:{ color: '#fff', fontWeight: 'bold', fontSize: 15 },
  exerciseRow:{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#0A0A0A', borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#1A1A1A' },
  exName:     { color: '#fff', fontSize: 14, fontWeight: '600' },
  exDetail:   { color: '#555', fontSize: 12, marginTop: 2 },
  row3:       { flexDirection: 'row', marginBottom: 16 },
  miniLabel:  { color: '#888', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 6 },
  inputSmall: { backgroundColor: '#0A0A0A', color: '#fff', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#1A1A1A', textAlign: 'center' },
});