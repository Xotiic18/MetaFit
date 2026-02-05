import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@metafit_routines';

// Guarda todas las rutinas
export const saveRoutinesToStorage = async (routines: any[]) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(routines));
  } catch (e) {
    console.error("Error al guardar en el disco", e);
  }
};

// Carga las rutinas guardadas
export const getRoutinesFromStorage = async () => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Error al cargar del disco", e);
    return [];
  }
};