import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

interface DateTimePickerComponentProps {
  value: Date;
  onChange: (date: Date) => void;
  mode: 'date' | 'time' | 'datetime';
  title: string;
  placeholder?: string;
  minimumDate?: Date;
  maximumDate?: Date;
}

const DateTimePickerComponent: React.FC<DateTimePickerComponentProps> = ({
  value,
  onChange,
  mode,
  title,
  placeholder,
  minimumDate,
  maximumDate,
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [tempDate, setTempDate] = useState(value);

  const formatDate = (date: Date) => {
    if (mode === 'date') {
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } else if (mode === 'time') {
      return date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else {
      return date.toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    
    if (selectedDate) {
      setTempDate(selectedDate);
      if (Platform.OS === 'android') {
        onChange(selectedDate);
      }
    }
  };

  const handleConfirm = () => {
    onChange(tempDate);
    setShowPicker(false);
  };

  const handleCancel = () => {
    setTempDate(value);
    setShowPicker(false);
  };

  const showDateTimePicker = () => {
    setTempDate(value);
    setShowPicker(true);
  };

  const renderPicker = () => {
    if (Platform.OS === 'ios') {
      return (
        <Modal
          visible={showPicker}
          transparent={true}
          animationType="slide"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={handleCancel}>
                  <Text style={styles.cancelButton}>Cancelar</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>{title}</Text>
                <TouchableOpacity onPress={handleConfirm}>
                  <Text style={styles.confirmButton}>Confirmar</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.pickerContainer}>
                <DateTimePicker
                  value={tempDate}
                  mode={mode}
                  display="default"
                  onChange={handleDateChange}
                  minimumDate={minimumDate}
                  maximumDate={maximumDate}
                  style={styles.picker}
                />
              </View>
            </View>
          </View>
        </Modal>
      );
    } else {
      return showPicker && (
        <DateTimePicker
          value={tempDate}
          mode={mode}
          display="default"
          onChange={handleDateChange}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
        />
      );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{title}</Text>
      <TouchableOpacity
        style={styles.input}
        onPress={showDateTimePicker}
      >
        <Text style={[
          styles.inputText,
          !value && styles.placeholderText
        ]}>
          {value ? formatDate(value) : placeholder || 'Seleccionar fecha'}
        </Text>
        <Ionicons 
          name={mode === 'time' ? 'time' : 'calendar'} 
          size={20} 
          color="#b0b0b0" 
        />
      </TouchableOpacity>
      
      {renderPicker()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
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
    borderWidth: 1,
    borderColor: '#333',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputText: {
    color: '#ffffff',
    fontSize: 16,
    flex: 1,
  },
  placeholderText: {
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  cancelButton: {
    color: '#ff4757',
    fontSize: 16,
  },
  confirmButton: {
    color: '#ff4757',
    fontSize: 16,
    fontWeight: 'bold',
  },
  pickerContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  picker: {
    backgroundColor: '#0c0c0c',
  },
});

export default DateTimePickerComponent;

