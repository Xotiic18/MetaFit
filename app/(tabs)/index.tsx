import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Modal, TextInput, Alert
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '../../services/supabase';
import { Ionicons } from '@expo/vector-icons';

type Routine = {
  id: string;
  name: string;
  created_at: string;
  user_id: string;
};

export default function RoutinesScreen() {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [newRoutineName, setNewRoutineName] = useState('');
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  const fetchRoutines = async () => {
    try {
      // ✅ getSession() usa cache local — sin round-trip de red
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data, error } = await supabase
        .from('routines')
        .select('id, name, created_at, user_id')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRoutines(data || []);
    } catch (error: any) {
      console.error('fetchRoutines:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchRoutines();
    }, [])
  );

  const createRoutine = async () => {
    if (!newRoutineName.trim()) return;
    setCreating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('Sin sesión activa');

      const { data, error } = await supabase
        .from('routines')
        .insert([{ name: newRoutineName.trim(), user_id: session.user.id }])
        .select()
        .single();

      if (error) throw error;

      // ✅ Actualizar lista localmente sin re-fetch
      setRoutines(prev => [data, ...prev]);
      setModalVisible(false);
      setNewRoutineName('');
      router.push(`/(tabs)/${data.id}`);
    } catch (error: any) {
      Alert.alert('Error', 'No se pudo crear la rutina');
    } finally {
      setCreating(false);
    }
  };

  const deleteRoutine = (id: string, name: string) => {
    Alert.alert(
      'Eliminar Rutina',
      `¿Eliminar "${name}"? Se perderán todos sus ejercicios.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('routines')
                .delete()
                .eq('id', id);

              if (error) throw error;

              // ✅ Actualizar localmente — sin re-fetch a Supabase
              setRoutines(prev => prev.filter(r => r.id !== id));
            } catch {
              Alert.alert('Error', 'No se pudo eliminar la rutina');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#A855F7" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Mis Rutinas</Text>
          <Text style={styles.subtitle}>Gestión de entrenamiento</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
          accessibilityLabel="Crear nueva rutina"
          accessibilityRole="button"
        >
          <Ionicons name="add" size={30} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={routines}
        keyExtractor={(item) => item.id}
        contentContainerStyle={routines.length === 0 ? { flex: 1 } : undefined}
        renderItem={({ item }) => (
          <View style={styles.routineCardContainer}>
            <TouchableOpacity
              style={styles.routineCard}
              onPress={() => router.push(`/(tabs)/${item.id}`)}
              accessibilityRole="button"
              accessibilityLabel={`Abrir rutina ${item.name}`}
            >
              <View style={styles.cardInfo}>
                <View style={styles.iconContainer}>
                  <Ionicons name="barbell-outline" size={22} color="#A855F7" />
                </View>
                <Text style={styles.routineName}>{item.name}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteIconBtn}
              onPress={() => deleteRoutine(item.id, item.name)}
              hitSlop={10}
              accessibilityLabel={`Eliminar rutina ${item.name}`}
              accessibilityRole="button"
            >
              <Ionicons name="trash-outline" size={20} color="#ff4444" />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.helperBox}>
              <Ionicons name="arrow-up" size={30} color="#A855F7" style={styles.arrowIcon} />
              <Text style={styles.helperTitle}>¡Empieza aquí!</Text>
              <Text style={styles.helperText}>
                Toca el botón{' '}
                <Text style={{ color: '#A855F7', fontWeight: 'bold' }}>+</Text>
                {' '}para crear tu primera rutina personalizada.
              </Text>
            </View>
          </View>
        }
      />

      <Modal animationType="fade" transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nueva Rutina</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Ej: Push Day, Pierna Fuerza..."
              placeholderTextColor="#555"
              value={newRoutineName}
              onChangeText={setNewRoutineName}
              autoFocus
              maxLength={50}
              onSubmitEditing={createRoutine}
              returnKeyType="done"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => { setModalVisible(false); setNewRoutineName(''); }}
                disabled={creating}
              >
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.createBtn, creating && { opacity: 0.6 }]}
                onPress={createRoutine}
                disabled={creating}
              >
                {creating
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.createBtnText}>Crear</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', paddingHorizontal: 20, paddingTop: 60 },
  center: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  title: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  subtitle: { color: '#A855F7', fontSize: 13 },
  addButton: { backgroundColor: '#A855F7', width: 50, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  routineCardContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  routineCard: { flex: 1, backgroundColor: '#0A0A0A', padding: 18, borderRadius: 18, borderWidth: 1, borderColor: '#1A1A1A' },
  cardInfo: { flexDirection: 'row', alignItems: 'center' },
  iconContainer: { backgroundColor: '#1A1A1A', padding: 10, borderRadius: 12, marginRight: 15 },
  routineName: { color: '#fff', fontSize: 17, fontWeight: '600' },
  deleteIconBtn: { padding: 15, marginLeft: 5 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  helperBox: { backgroundColor: '#0A0A0A', padding: 25, borderRadius: 20, borderWidth: 1, borderColor: '#A855F744', borderStyle: 'dashed', alignItems: 'center', width: '100%' },
  arrowIcon: { position: 'absolute', top: -35, right: 10 },
  helperTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  helperText: { color: '#888', textAlign: 'center', lineHeight: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#111', width: '85%', padding: 25, borderRadius: 25, borderWidth: 1, borderColor: '#222' },
  modalTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  modalInput: { backgroundColor: '#000', color: '#fff', padding: 18, borderRadius: 15, marginBottom: 25, borderWidth: 1, borderColor: '#333' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  cancelBtn: { flex: 1, alignItems: 'center', padding: 15 },
  cancelBtnText: { color: '#555', fontWeight: 'bold' },
  createBtn: { flex: 1, backgroundColor: '#A855F7', padding: 15, borderRadius: 15, alignItems: 'center' },
  createBtnText: { color: '#fff', fontWeight: 'bold' },
});