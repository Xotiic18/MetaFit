import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@metafit_routines';
const HISTORY_KEY = '@metafit_history';

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

// Guardar una nueva sesión terminada
export const saveSessionToHistory = async (session: any) => {
  try {
    const existingHistory = await getHistoryFromStorage();
    const updatedHistory = [session, ...existingHistory]; // La más reciente primero
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
  } catch (e) {
    console.error("Error al guardar historial", e);
  }
};

// Obtener todas las sesiones pasadas
export const getHistoryFromStorage = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(HISTORY_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (e) {
    return [];
  }
};