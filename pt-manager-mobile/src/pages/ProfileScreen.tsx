import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';

const ProfileScreen: React.FC = ({ navigation }: any) => {
  const { user, signOut, updateProfile } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [nickname, setNickname] = useState(user?.nickname || '');
  const [loading, setLoading] = useState(false);

  const handleSaveProfile = async () => {
    if (!user) return;

    setLoading(true);
    try {
      await updateProfile({
        full_name: fullName,
        nickname: nickname,
      });
      setIsEditing(false);
      Alert.alert('Éxito', 'Perfil actualizado correctamente');
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setFullName(user?.full_name || '');
    setNickname(user?.nickname || '');
    setIsEditing(false);
  };

  const handleSignOut = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar Sesión', onPress: signOut, style: 'destructive' },
      ]
    );
  };

  const getUserDisplayName = () => {
    return user?.nickname || user?.full_name || user?.email || 'Usuario';
  };

  return (
    <LinearGradient
      colors={['#0c0c0c', '#1a1a1a']}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Perfil</Text>
        </View>

        {/* Información del usuario */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            {user?.avatar_url ? (
              <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={40} color="#b0b0b0" />
              </View>
            )}
            <TouchableOpacity style={styles.editAvatarButton}>
              <Ionicons name="camera" size={16} color="#ffffff" />
            </TouchableOpacity>
          </View>

          <Text style={styles.displayName}>{getUserDisplayName()}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          
          {user?.is_admin && (
            <View style={styles.adminBadge}>
              <Ionicons name="shield-checkmark" size={16} color="#ff4757" />
              <Text style={styles.adminBadgeText}>Administrador</Text>
            </View>
          )}
        </View>

        {/* Información editable */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Información Personal</Text>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setIsEditing(!isEditing)}
            >
              <Ionicons
                name={isEditing ? 'close' : 'create'}
                size={20}
                color="#ff4757"
              />
              <Text style={styles.editButtonText}>
                {isEditing ? 'Cancelar' : 'Editar'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nombre Completo</Text>
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Ingresa tu nombre completo"
                placeholderTextColor="#666"
                editable={isEditing}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Apodo</Text>
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                value={nickname}
                onChangeText={setNickname}
                placeholder="Ingresa tu apodo"
                placeholderTextColor="#666"
                editable={isEditing}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={[styles.input, styles.inputDisabled]}
                value={user?.email || ''}
                placeholder="Email"
                placeholderTextColor="#666"
                editable={false}
              />
              <Text style={styles.inputHelp}>
                El email no se puede cambiar
              </Text>
            </View>

            {isEditing && (
              <View style={styles.editActions}>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSaveProfile}
                  disabled={loading}
                >
                  <Text style={styles.saveButtonText}>
                    {loading ? 'Guardando...' : 'Guardar Cambios'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleCancelEdit}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Estadísticas del usuario */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Estadísticas</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="trophy" size={24} color="#ffa502" />
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Torneos Jugados</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="medal" size={24} color="#2ed573" />
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Victorias</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="star" size={24} color="#ff4757" />
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Puntos Totales</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="cash" size={24} color="#3742fa" />
              <Text style={styles.statNumber}>$0</Text>
              <Text style={styles.statLabel}>Ganancias</Text>
            </View>
          </View>
        </View>

        {/* Configuración */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configuración</Text>
          
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Ionicons name="notifications" size={20} color="#ff4757" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Notificaciones</Text>
              <Text style={styles.settingDescription}>
                Gestiona las notificaciones del torneo
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#b0b0b0" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Ionicons name="moon" size={20} color="#ff4757" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Tema Oscuro</Text>
              <Text style={styles.settingDescription}>
                Siempre activado
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#b0b0b0" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Ionicons name="help-circle" size={20} color="#ff4757" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Ayuda y Soporte</Text>
              <Text style={styles.settingDescription}>
                Preguntas frecuentes y contacto
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#b0b0b0" />
          </TouchableOpacity>
        </View>

        {/* Cerrar sesión */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <Ionicons name="log-out" size={20} color="#ff4757" />
            <Text style={styles.signOutButtonText}>Cerrar Sesión</Text>
          </TouchableOpacity>
        </View>

        {/* Información de la app */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>PT Manager v1.0.0</Text>
          <Text style={styles.appInfoText}>Desarrollado para torneos de póker</Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  profileSection: {
    alignItems: 'center',
    padding: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#333',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#ff4757',
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  displayName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: '#b0b0b0',
    marginBottom: 12,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ff4757',
  },
  adminBadgeText: {
    color: '#ff4757',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButtonText: {
    color: '#ff4757',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  form: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: '#b0b0b0',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#0c0c0c',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#333',
  },
  inputDisabled: {
    backgroundColor: '#1a1a1a',
    color: '#666',
  },
  inputHelp: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  saveButton: {
    backgroundColor: '#2ed573',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  cancelButton: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  cancelButtonText: {
    color: '#b0b0b0',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#b0b0b0',
    textAlign: 'center',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0c0c0c',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#b0b0b0',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ff4757',
  },
  signOutButtonText: {
    color: '#ff4757',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  appInfo: {
    alignItems: 'center',
    padding: 20,
    paddingBottom: 40,
  },
  appInfoText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
});

export default ProfileScreen;

