import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { BlindLevel } from '../types';

interface JsonImporterProps {
  onImport: (structure: BlindLevel[]) => void;
  disabled?: boolean;
}

const JsonImporter: React.FC<JsonImporterProps> = ({ onImport, disabled = false }) => {
  const [isImporting, setIsImporting] = useState(false);

  const validateStructure = (data: any): BlindLevel[] | null => {
    try {
      let blindStructure: any[] = [];
      
      // Verificar si es el formato de la web (con blind_structure)
      if (data.blind_structure && Array.isArray(data.blind_structure)) {
        blindStructure = data.blind_structure;
      } 
      // Verificar si es un array directo
      else if (Array.isArray(data)) {
        blindStructure = data;
      } else {
        throw new Error('El archivo debe contener un array de niveles o un objeto con blind_structure');
      }

      // Validar cada nivel
      const validatedStructure: BlindLevel[] = blindStructure.map((level, index) => {
        if (!level || typeof level !== 'object') {
          throw new Error(`Nivel ${index + 1} no es un objeto válido`);
        }

        const {
          level: levelNumber,
          small_blind,
          big_blind,
          duration,
          duration_minutes,
          is_break = false
        } = level;

        // Validar campos requeridos
        if (typeof levelNumber !== 'number' || levelNumber < 1) {
          throw new Error(`Nivel ${index + 1}: level debe ser un número mayor a 0`);
        }
        if (typeof small_blind !== 'number' || small_blind < 0) {
          throw new Error(`Nivel ${index + 1}: small_blind debe ser un número mayor o igual a 0`);
        }
        if (typeof big_blind !== 'number' || big_blind < 0) {
          throw new Error(`Nivel ${index + 1}: big_blind debe ser un número mayor o igual a 0`);
        }
        // Usar duration_minutes si está disponible, sino duration
        const durationValue = duration_minutes || duration;
        if (typeof durationValue !== 'number' || durationValue < 1) {
          throw new Error(`Nivel ${index + 1}: duration debe ser un número mayor a 0`);
        }
        if (typeof is_break !== 'boolean') {
          throw new Error(`Nivel ${index + 1}: is_break debe ser un booleano`);
        }

        return {
          level: levelNumber,
          small_blind,
          big_blind,
          duration: durationValue,
          is_break
        };
      });

      // Verificar que no haya niveles duplicados
      const levels = validatedStructure.map(l => l.level);
      const uniqueLevels = new Set(levels);
      if (levels.length !== uniqueLevels.size) {
        throw new Error('No puede haber niveles duplicados');
      }

      // Ordenar por número de nivel
      validatedStructure.sort((a, b) => a.level - b.level);

      return validatedStructure;
    } catch (error) {
      console.log('❌ Error validando estructura:', error);
      return null;
    }
  };

  const handleImport = async () => {
    if (disabled) return;

    setIsImporting(true);
    try {
      // Seleccionar archivo JSON
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        setIsImporting(false);
        return;
      }

      const file = result.assets[0];
      console.log('📁 Archivo seleccionado:', file.name);

      // Leer el archivo
      const response = await fetch(file.uri);
      const jsonText = await response.text();
      
      // Parsear JSON
      const jsonData = JSON.parse(jsonText);
      console.log('📄 Datos del JSON:', jsonData);

      // Validar estructura
      const validatedStructure = validateStructure(jsonData);
      
      if (!validatedStructure) {
        Alert.alert(
          'Error de Validación',
          'El archivo JSON no tiene un formato válido para la estructura de blinds. Verifica que contenga un array de objetos con las propiedades: level, small_blind, big_blind, duration, is_break'
        );
        setIsImporting(false);
        return;
      }

      // Confirmar importación
      Alert.alert(
        'Confirmar Importación',
        `¿Deseas importar ${validatedStructure.length} niveles de blinds?`,
        [
          {
            text: 'Cancelar',
            style: 'cancel',
            onPress: () => setIsImporting(false)
          },
          {
            text: 'Importar',
            onPress: () => {
              onImport(validatedStructure);
              setIsImporting(false);
              Alert.alert('Éxito', 'Estructura de blinds importada correctamente');
            }
          }
        ]
      );

    } catch (error: any) {
      console.log('❌ Error importando JSON:', error);
      Alert.alert(
        'Error',
        `No se pudo importar el archivo: ${error.message}`
      );
      setIsImporting(false);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.importButton, disabled && styles.importButtonDisabled]}
      onPress={handleImport}
      disabled={disabled || isImporting}
    >
      {isImporting ? (
        <ActivityIndicator color="#ffffff" size="small" />
      ) : (
        <Ionicons name="cloud-upload" size={20} color="#ffffff" />
      )}
      <Text style={styles.importButtonText}>
        {isImporting ? 'Importando...' : 'Importar JSON'}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  importButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2ed573',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  importButtonDisabled: {
    backgroundColor: '#666',
    opacity: 0.6,
  },
  importButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default JsonImporter;
