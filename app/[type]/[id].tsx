import { Redirect, useLocalSearchParams } from 'expo-router';

// Recibe deep links tipo empleosnarino://offer/:id y empleosnarino://service/:id
// y los redirige a la pantalla de inicio con el parámetro correspondiente,
// donde el feed abre el modal del ítem compartido (ver app/(tabs)/index.tsx).
export default function DeepLinkRedirect() {
  const { type, id } = useLocalSearchParams<{ type?: string; id?: string }>();
  const params = type === 'service' ? { service: id } : { offer: id };
  return <Redirect href={{ pathname: '/', params } as any} />;
}
