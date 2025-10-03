import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { useTournamentStore } from '../store/tournamentStore';
import { BlindLevel } from '../types';
import DateTimePickerComponent from '../components/DateTimePicker';
import JsonImporter from '../components/JsonImporter';

const CreateTournamentScreen: React.FC = ({ navigation }: any) => {
  const { user } = useAuthStore();
  const { createTournament, loading } = useTournamentStore();
  const [isCreating, setIsCreating] = useState(false);

  // Estados del formulario
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    max_players: '100',
    entry_fee: '100',
    initial_chips: '10000',
    rebuy_chips: '10000',
    addon_chips: '15000',
    max_rebuys: '3',
    max_addons: '1',
  });

  // Estados para fecha y hora
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const now = new Date();
    now.setHours(now.getHours() + 1); // 1 hora en el futuro
    return now;
  });
  const [selectedTime, setSelectedTime] = useState<Date>(() => {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    return now;
  });

  const [structure, setStructure] = useState<BlindLevel[]>([
    { level: 1, small_blind: 25, big_blind: 50, duration: 20, is_break: false },
    { level: 2, small_blind: 50, big_blind: 100, duration: 20, is_break: false },
    { level: 3, small_blind: 75, big_blind: 150, duration: 20, is_break: false },
  ]);

  // Sistema de puntos (por defecto: 1er lugar = 100, 2do = 50, 3ro = 25)
  const [pointSystem, setPointSystem] = useState([
    { position: 1, points: 100 },
    { position: 2, points: 50 },
    { position: 3, points: 25 }
  ]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addBlindLevel = () => {
    const newLevel = structure.length + 1;
    setStructure(prev => [
      ...prev,
      {
        level: newLevel,
        small_blind: prev[prev.length - 1]?.big_blind || 100,
        big_blind: (prev[prev.length - 1]?.big_blind || 100) * 2,
        duration: 20,
        is_break: false,
      }
    ]);
  };

  const removeBlindLevel = (index: number) => {
    if (structure.length > 1) {
      const newStructure = structure.filter((_, i) => i !== index);
      // Renumerar niveles
      const renumberedStructure = newStructure.map((level, i) => ({
        ...level,
        level: i + 1,
      }));
      setStructure(renumberedStructure);
    }
  };

  const updateBlindLevel = (index: number, field: keyof BlindLevel, value: any) => {
    const newStructure = [...structure];
    newStructure[index] = { ...newStructure[index], [field]: value };
    setStructure(newStructure);
  };

  const handleJsonImport = (importedStructure: BlindLevel[]) => {
    console.log('📥 Importando estructura JSON:', importedStructure);
    setStructure(importedStructure);
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'El nombre del torneo es obligatorio');
      return false;
    }
    
    // Combinar fecha y hora seleccionadas
    const combinedDateTime = new Date(selectedDate);
    combinedDateTime.setHours(selectedTime.getHours());
    combinedDateTime.setMinutes(selectedTime.getMinutes());
    combinedDateTime.setSeconds(0);
    combinedDateTime.setMilliseconds(0);

    // Verificar que la fecha no sea en el pasado
    if (combinedDateTime <= new Date()) {
      Alert.alert('Error', 'La fecha y hora del torneo debe ser en el futuro');
      return false;
    }
    
    if (structure.length === 0) {
      Alert.alert('Error', 'Debe haber al menos un nivel de blinds');
      return false;
    }
    return true;
  };

  const handleCreateTournament = async () => {
    if (!validateForm()) return;

    setIsCreating(true);
    try {
      // Combinar fecha y hora seleccionadas
      const combinedDateTime = new Date(selectedDate);
      combinedDateTime.setHours(selectedTime.getHours());
      combinedDateTime.setMinutes(selectedTime.getMinutes());
      combinedDateTime.setSeconds(0);
      combinedDateTime.setMilliseconds(0);

      const tournamentData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        scheduled_start_time: combinedDateTime.toISOString(),
        max_players: parseInt(formData.max_players),
        entry_fee: parseInt(formData.entry_fee),
        initial_chips: parseInt(formData.initial_chips),
        rebuy_chips: parseInt(formData.rebuy_chips),
        addon_chips: parseInt(formData.addon_chips),
        max_rebuys: parseInt(formData.max_rebuys),
        max_addons: parseInt(formData.max_addons),
        blind_structure: structure,
        point_system: pointSystem,
        created_by: user?.id || '',
        status: 'scheduled' as const,
      };

      console.log('🚀 Creando torneo con datos:', tournamentData);
      console.log('👤 Usuario actual:', user);
      
      await createTournament(tournamentData);
      
      Alert.alert(
        'Torneo Creado',
        'El torneo ha sido creado exitosamente.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'No se pudo crear el torneo. Inténtalo nuevamente.');
    } finally {
      setIsCreating(false);
    }
  };

  const formatDateForInput = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };


  return (
    <LinearGradient colors={['#0c0c0c', '#1a1a1a']} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView style={styles.scrollView}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#ffffff" />
            </TouchableOpacity>
            <Text style={styles.title}>Crear Torneo</Text>
          </View>

          {/* Formulario */}
          <View style={styles.form}>
            {/* Información Básica */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Información Básica</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nombre del Torneo *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej: Copa Desafío"
                  placeholderTextColor="#666"
                  value={formData.name}
                  onChangeText={(value) => handleInputChange('name', value)}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Descripción</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Descripción del torneo..."
                  placeholderTextColor="#666"
                  value={formData.description}
                  onChangeText={(value) => handleInputChange('description', value)}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.dateTimeContainer}>
                <DateTimePickerComponent
                  value={selectedDate}
                  onChange={setSelectedDate}
                  mode="date"
                  title="Fecha del Torneo"
                  placeholder="Seleccionar fecha"
                  minimumDate={new Date()}
                />
                
                <DateTimePickerComponent
                  value={selectedTime}
                  onChange={setSelectedTime}
                  mode="time"
                  title="Hora del Torneo"
                  placeholder="Seleccionar hora"
                />
              </View>
            </View>

            {/* Configuración del Torneo */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Configuración</Text>
              
              <View style={styles.row}>
                <View style={[styles.inputGroup, styles.halfWidth]}>
                  <Text style={styles.label}>Fichas Iniciales</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="10000"
                    placeholderTextColor="#666"
                    value={formData.initial_chips}
                    onChangeText={(value) => handleInputChange('initial_chips', value)}
                    keyboardType="numeric"
                  />
                </View>

                <View style={[styles.inputGroup, styles.halfWidth]}>
                  <Text style={styles.label}>Entry Fee ($)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="100"
                    placeholderTextColor="#666"
                    value={formData.entry_fee}
                    onChangeText={(value) => handleInputChange('entry_fee', value)}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, styles.halfWidth]}>
                  <Text style={styles.label}>Fichas de Rebuy</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="10000"
                    placeholderTextColor="#666"
                    value={formData.rebuy_chips}
                    onChangeText={(value) => handleInputChange('rebuy_chips', value)}
                    keyboardType="numeric"
                  />
                </View>

                <View style={[styles.inputGroup, styles.halfWidth]}>
                  <Text style={styles.label}>Fichas de Addon</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="15000"
                    placeholderTextColor="#666"
                    value={formData.addon_chips}
                    onChangeText={(value) => handleInputChange('addon_chips', value)}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, styles.halfWidth]}>
                  <Text style={styles.label}>Máximo Rebuys</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="3"
                    placeholderTextColor="#666"
                    value={formData.max_rebuys}
                    onChangeText={(value) => handleInputChange('max_rebuys', value)}
                    keyboardType="numeric"
                  />
                </View>

                <View style={[styles.inputGroup, styles.halfWidth]}>
                  <Text style={styles.label}>Máximo Addons</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="1"
                    placeholderTextColor="#666"
                    value={formData.max_addons}
                    onChangeText={(value) => handleInputChange('max_addons', value)}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, styles.halfWidth]}>
                  <Text style={styles.label}>Máximo de Jugadores</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="100"
                    placeholderTextColor="#666"
                    value={formData.max_players}
                    onChangeText={(value) => handleInputChange('max_players', value)}
                    keyboardType="numeric"
                  />
                </View>

                <View style={[styles.inputGroup, styles.halfWidth]}>
                  {/* Campo vacío para mantener el layout */}
                </View>
              </View>
            </View>

            {/* Estructura de Blinds */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Estructura de Blinds</Text>
                <View style={styles.sectionButtons}>
                  <JsonImporter 
                    onImport={handleJsonImport}
                    disabled={isCreating}
                  />
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={addBlindLevel}
                    disabled={isCreating}
                  >
                    <Ionicons name="add" size={20} color="#ffffff" />
                  </TouchableOpacity>
                </View>
              </View>

              {structure.map((level, index) => (
                <View key={index} style={styles.blindLevel}>
                  <View style={styles.blindLevelHeader}>
                    <Text style={styles.blindLevelTitle}>Nivel {level.level}</Text>
                    {structure.length > 1 && (
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => removeBlindLevel(index)}
                      >
                        <Ionicons name="trash" size={16} color="#ff4757" />
                      </TouchableOpacity>
                    )}
                  </View>

                  <View style={styles.blindInputs}>
                    <View style={styles.blindInputGroup}>
                      <Text style={styles.blindLabel}>Small Blind</Text>
                      <TextInput
                        style={styles.blindInput}
                        value={level.small_blind.toString()}
                        onChangeText={(value) => updateBlindLevel(index, 'small_blind', parseInt(value) || 0)}
                        keyboardType="numeric"
                      />
                    </View>

                    <View style={styles.blindInputGroup}>
                      <Text style={styles.blindLabel}>Big Blind</Text>
                      <TextInput
                        style={styles.blindInput}
                        value={level.big_blind.toString()}
                        onChangeText={(value) => updateBlindLevel(index, 'big_blind', parseInt(value) || 0)}
                        keyboardType="numeric"
                      />
                    </View>

                    <View style={styles.blindInputGroup}>
                      <Text style={styles.blindLabel}>Duración (min)</Text>
                      <TextInput
                        style={styles.blindInput}
                        value={level.duration.toString()}
                        onChangeText={(value) => updateBlindLevel(index, 'duration', parseInt(value) || 0)}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                </View>
              ))}
            </View>

            {/* Botones */}
            <View style={styles.buttonsContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.createButton}
                onPress={handleCreateTournament}
                disabled={isCreating}
              >
                {isCreating ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Ionicons name="checkmark" size={20} color="#ffffff" />
                )}
                <Text style={styles.createButtonText}>
                  {isCreating ? 'Creando...' : 'Crear Torneo'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  form: {
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  dateTimeContainer: {
    marginBottom: 16,
  },
  halfWidth: {
    flex: 1,
    marginRight: 8,
  },
  row: {
    flexDirection: 'row',
  },
  label: {
    fontSize: 14,
    color: '#b0b0b0',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
    color: '#ffffff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  addButton: {
    backgroundColor: '#ff4757',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  blindLevel: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  blindLevelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  blindLevelTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  removeButton: {
    padding: 4,
  },
  blindInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  blindInputGroup: {
    flex: 1,
  },
  blindLabel: {
    fontSize: 12,
    color: '#b0b0b0',
    marginBottom: 4,
  },
  blindInput: {
    backgroundColor: '#0c0c0c',
    borderRadius: 6,
    padding: 8,
    color: '#ffffff',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#333',
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#333',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  createButton: {
    flex: 1,
    backgroundColor: '#ff4757',
    paddingVertical: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default CreateTournamentScreen;
