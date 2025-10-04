import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface PlayerEliminationModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (position: number, points: number) => void;
  playerName: string;
  totalPlayers: number;
  eliminatedPlayers: number;
}

const PlayerEliminationModal: React.FC<PlayerEliminationModalProps> = ({
  visible,
  onClose,
  onConfirm,
  playerName,
  totalPlayers,
  eliminatedPlayers,
}) => {
  const [position, setPosition] = useState('');
  const [points, setPoints] = useState('');

  useEffect(() => {
    if (visible) {
      // Calcular valores automáticamente cuando se abre el modal
      const calculatedPosition = totalPlayers - eliminatedPlayers;
      const calculatedPoints = eliminatedPlayers + 1;
      
      setPosition(calculatedPosition.toString());
      setPoints(calculatedPoints.toString());
    }
  }, [visible, totalPlayers, eliminatedPlayers]);

  const handleConfirm = () => {
    const pos = parseInt(position);
    const pts = parseInt(points);

    if (!pos || pos < 1) {
      Alert.alert('Error', 'Por favor ingresa una posición válida');
      return;
    }

    if (!pts || pts < 0) {
      Alert.alert('Error', 'Por favor ingresa puntos válidos');
      return;
    }

    onConfirm(pos, pts);
    onClose();
  };

  const calculatedPosition = totalPlayers - eliminatedPlayers;
  const calculatedPoints = eliminatedPlayers + 1;

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <LinearGradient
          colors={['#1a1a1a', '#2d2d2d']}
          style={styles.modalView}
        >
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close-circle" size={30} color="#ff4757" />
          </TouchableOpacity>

          <Text style={styles.modalTitle}>Eliminar Jugador</Text>
          <Text style={styles.playerName}>{playerName}</Text>

          <ScrollView style={styles.contentContainer}>
            {/* Información del torneo */}
            <View style={styles.infoContainer}>
              <Text style={styles.infoTitle}>Información del Torneo</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Total de jugadores:</Text>
                <Text style={styles.infoValue}>{totalPlayers}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Ya eliminados:</Text>
                <Text style={styles.infoValue}>{eliminatedPlayers}</Text>
              </View>
            </View>

            {/* Valores calculados automáticamente */}
            <View style={styles.calculatedContainer}>
              <Text style={styles.calculatedTitle}>Valores Calculados Automáticamente</Text>
              <View style={styles.calculatedRow}>
                <Text style={styles.calculatedLabel}>Posición:</Text>
                <Text style={styles.calculatedValue}>{calculatedPosition}</Text>
              </View>
              <View style={styles.calculatedRow}>
                <Text style={styles.calculatedLabel}>Puntos:</Text>
                <Text style={styles.calculatedValue}>{calculatedPoints}</Text>
              </View>
            </View>

            {/* Campos de entrada */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputTitle}>Valores Finales (Puedes modificar)</Text>
              
              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>Posición Final:</Text>
                <TextInput
                  style={styles.input}
                  value={position}
                  onChangeText={setPosition}
                  keyboardType="numeric"
                  placeholder="Posición"
                  placeholderTextColor="#666"
                />
              </View>

              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>Puntos Obtenidos:</Text>
                <TextInput
                  style={styles.input}
                  value={points}
                  onChangeText={setPoints}
                  keyboardType="numeric"
                  placeholder="Puntos"
                  placeholderTextColor="#666"
                />
              </View>
            </View>

            {/* Botones de acción rápida */}
            <View style={styles.quickActionsContainer}>
              <Text style={styles.quickActionsTitle}>Acciones Rápidas</Text>
              <View style={styles.quickActionsRow}>
                <TouchableOpacity
                  style={styles.quickActionButton}
                  onPress={() => {
                    setPosition(calculatedPosition.toString());
                    setPoints(calculatedPoints.toString());
                  }}
                >
                  <Ionicons name="refresh" size={20} color="#2ed573" />
                  <Text style={styles.quickActionText}>Usar Calculados</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.quickActionButton}
                  onPress={() => {
                    setPosition('1');
                    setPoints(totalPlayers.toString());
                  }}
                >
                  <Ionicons name="trophy" size={20} color="#ffa502" />
                  <Text style={styles.quickActionText}>Campeón</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          {/* Botones de acción */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
              <Ionicons name="person-remove" size={20} color="#ffffff" />
              <Text style={styles.confirmButtonText}>Eliminar Jugador</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalView: {
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#444',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  playerName: {
    fontSize: 18,
    color: '#ff4757',
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  contentContainer: {
    width: '100%',
    maxHeight: 400,
  },
  infoContainer: {
    backgroundColor: '#0c0c0c',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#b0b0b0',
  },
  infoValue: {
    fontSize: 14,
    color: '#2ed573',
    fontWeight: 'bold',
  },
  calculatedContainer: {
    backgroundColor: '#1a2f1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2ed573',
  },
  calculatedTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2ed573',
    marginBottom: 12,
  },
  calculatedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  calculatedLabel: {
    fontSize: 14,
    color: '#b0b0b0',
  },
  calculatedValue: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 14,
    color: '#b0b0b0',
    width: 120,
  },
  input: {
    flex: 1,
    backgroundColor: '#0c0c0c',
    borderRadius: 8,
    padding: 12,
    color: '#ffffff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  quickActionsContainer: {
    marginBottom: 16,
  },
  quickActionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0c0c0c',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  quickActionText: {
    color: '#ffffff',
    fontSize: 12,
    marginLeft: 6,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#333',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  confirmButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff4757',
    borderRadius: 10,
    padding: 12,
  },
  confirmButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 6,
  },
});

export default PlayerEliminationModal;
