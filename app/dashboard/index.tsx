import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

export default function Dashboard() {
  const router = useRouter();

  const cerrarSesion = () => {
    // ✅ Replace para que no se pueda volver con "atrás"
    router.replace('/login');
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 24, gap: 12 }}>
      <Text style={{ fontSize: 22, textAlign: 'center' }}>Dashboard VetFarm 🧰</Text>

      {/* ✅ BOTÓN CERRAR SESIÓN */}
      <Pressable
        onPress={cerrarSesion}
        style={{
          backgroundColor: '#111',
          padding: 12,
          borderRadius: 8,
          marginTop: 10,
        }}
      >
        <Text style={{ color: '#fff', textAlign: 'center', fontSize: 16 }}>
          Cerrar sesión
        </Text>
      </Pressable>
    </View>
  );
}
