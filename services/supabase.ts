import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'https://nmdfdkgnvhpveqqznelw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tZGZka2dudmhwdmVxcXpuZWx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MDgyNDUsImV4cCI6MjA4ODA4NDI0NX0.MZFU4kR916OYoIFGRJAG3NYgOB3zZJUvs7_wWqS0ivg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});