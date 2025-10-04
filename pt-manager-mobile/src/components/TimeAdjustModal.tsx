import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TimeAdjustModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (minutes: number, seconds: number) => void;
  currentTimeRemaining: number;
}

const TimeAdjustModal: React.FC<TimeAdjustModalProps> = ({
  visible,
  onClose,
  onConfirm,
  currentTimeRemaining,
}) => {
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [capturedTime, setCapturedTime] = useState(0);

  useEffect(() => {
    if (visible) {
      // Capturar el tiempo solo cuando se abre el modal
      const totalSeconds = Math.ceil(currentTimeRemaining);
      setCapturedTime(totalSeconds);
      setMinutes(Math.floor(totalSeconds / 60));
      setSeconds(totalSeconds % 60);
    }
  }, [visible]); // Remover currentTimeRemaining de las dependencias

  const handleConfirm = () => {
    const totalSeconds = minutes * 60 + seconds;
    onConfirm(minutes, seconds);
    onClose();
  };

  const generateNumbers = (max: number) => {
    return Array.from({ length: max + 1 }, (_, i) => i);
  };

  const formatNumber = (num: number) => num.toString().padStart(2, '0');

  const minutesNumbers = generateNumbers(59);
  const secondsNumbers = generateNumbers(59);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Ajustar Tiempo</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>

          <View style={styles.timeDisplay}>
            <Text style={styles.timeText}>
              {formatNumber(minutes)}:{formatNumber(seconds)}
            </Text>
          </View>

          <View style={styles.pickerContainer}>
            <View style={styles.pickerColumn}>
              <Text style={styles.pickerLabel}>Minutos</Text>
              <ScrollView
                style={styles.picker}
                showsVerticalScrollIndicator={false}
                snapToInterval={50}
                decelerationRate="fast"
              >
                {minutesNumbers.map((num) => (
                  <TouchableOpacity
                    key={num}
                    style={[
                      styles.pickerItem,
                      minutes === num && styles.pickerItemSelected,
                    ]}
                    onPress={() => setMinutes(num)}
                  >
                    <Text
                      style={[
                        styles.pickerItemText,
                        minutes === num && styles.pickerItemTextSelected,
                      ]}
                    >
                      {formatNumber(num)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.pickerColumn}>
              <Text style={styles.pickerLabel}>Segundos</Text>
              <ScrollView
                style={styles.picker}
                showsVerticalScrollIndicator={false}
                snapToInterval={50}
                decelerationRate="fast"
              >
                {secondsNumbers.map((num) => (
                  <TouchableOpacity
                    key={num}
                    style={[
                      styles.pickerItem,
                      seconds === num && styles.pickerItemSelected,
                    ]}
                    onPress={() => setSeconds(num)}
                  >
                    <Text
                      style={[
                        styles.pickerItemText,
                        seconds === num && styles.pickerItemTextSelected,
                      ]}
                    >
                      {formatNumber(num)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
              <Text style={styles.confirmButtonText}>Aplicar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: '#333',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  closeButton: {
    padding: 8,
  },
  timeDisplay: {
    alignItems: 'center',
    marginBottom: 30,
    padding: 20,
    backgroundColor: '#2d2d2d',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#444',
  },
  timeText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#2ed573',
  },
  pickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 30,
  },
  pickerColumn: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 10,
  },
  pickerLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#b0b0b0',
    marginBottom: 10,
  },
  picker: {
    height: 200,
    width: '100%',
  },
  pickerItem: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginVertical: 2,
  },
  pickerItemSelected: {
    backgroundColor: '#2ed573',
  },
  pickerItemText: {
    fontSize: 18,
    color: '#ffffff',
  },
  pickerItemTextSelected: {
    color: '#000000',
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  cancelButton: {
    backgroundColor: '#ff4757',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 0.4,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  confirmButton: {
    backgroundColor: '#2ed573',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 0.4,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#000000',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default TimeAdjustModal;
