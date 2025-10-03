import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../config/supabase';

interface User {
  id: string;
  email: string;
  name: string;
  nickname: string;
}

interface PlayerSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectPlayer: (user: User) => void;
  tournamentId: string;
}

const PlayerSelectionModal: React.FC<PlayerSelectionModalProps> = ({
  visible,
  onClose,
  onSelectPlayer,
  tournamentId,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (visible) {
      loadUsers();
    }
  }, [visible]);

  useEffect(() => {
    filterUsers();
  }, [searchQuery, users]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      console.log('🔍 Cargando usuarios desde Supabase...');
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, name, nickname')
        .order('name', { ascending: true });

      if (error) {
        console.log('❌ Error de Supabase:', error);
        throw error;
      }

      console.log('✅ Usuarios cargados:', data?.length || 0, 'usuarios');
      console.log('📋 Datos de usuarios:', data);
      
      setUsers(data || []);
    } catch (error) {
      console.error('❌ Error cargando usuarios:', error);
      Alert.alert('Error', `No se pudieron cargar los usuarios: ${error.message || 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    if (!searchQuery.trim()) {
      setFilteredUsers(users);
      return;
    }

    const filtered = users.filter(user => {
      const name = user.name || '';
      const nickname = user.nickname || '';
      const email = user.email || '';
      
      return name.toLowerCase().includes(searchQuery.toLowerCase()) ||
             nickname.toLowerCase().includes(searchQuery.toLowerCase()) ||
             email.toLowerCase().includes(searchQuery.toLowerCase());
    });

    setFilteredUsers(filtered);
  };

  const handleSelectUser = (user: User) => {
    onSelectPlayer(user);
    onClose();
  };

  const renderUserItem = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => handleSelectUser(item)}
    >
      <View style={styles.userInfo}>
        <Text style={styles.userName}>
          {item.nickname || item.name || 'Sin nombre'}
        </Text>
        <Text style={styles.userEmail}>{item.email || 'Sin email'}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#b0b0b0" />
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.title}>Agregar Jugador al Torneo</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Search Section */}
        <View style={styles.searchSection}>
          <Text style={styles.searchLabel}>Buscar y Seleccionar Usuario</Text>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#b0b0b0" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Escribe para buscar..."
              placeholderTextColor="#666"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                style={styles.clearButton}
              >
                <Ionicons name="close-circle" size={20} color="#b0b0b0" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Users List */}
        <View style={styles.listContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#ff4757" size="large" />
              <Text style={styles.loadingText}>Cargando usuarios...</Text>
            </View>
          ) : (
            <FlatList
              data={filteredUsers}
              keyExtractor={(item) => item.id}
              renderItem={renderUserItem}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="people-outline" size={64} color="#666" />
                  <Text style={styles.emptyText}>
                    {searchQuery ? 'No se encontraron usuarios' : 'No hay usuarios disponibles'}
                  </Text>
                </View>
              }
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c0c0c',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  searchSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  searchLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff4757',
    marginBottom: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ff4757',
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: '#ffffff',
    fontSize: 16,
  },
  clearButton: {
    padding: 4,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: 20,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#b0b0b0',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#b0b0b0',
    marginTop: 16,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
});

export default PlayerSelectionModal;
