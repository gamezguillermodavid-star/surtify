/**
 * Traduce mensajes de error técnicos (Supabase, red) a algo que un usuario
 * pueda entender. El mensaje original siempre se registra en consola para
 * poder depurarlo.
 */
export function friendlyErrorMessage(rawMessage: string | undefined | null): string {
  console.error('Error:', rawMessage);

  const message = (rawMessage ?? '').toLowerCase();

  if (message.includes('timeout') || message.includes('gateway')) {
    return 'El servidor está tardando más de lo normal. Prueba a recargar en unos segundos.';
  }

  if (message.includes('fetch') || message.includes('network')) {
    return 'No se ha podido conectar. Comprueba tu conexión a internet e inténtalo de nuevo.';
  }

  if (message.includes('invalid login credentials')) {
    return 'Email o contraseña incorrectos.';
  }

  if (message.includes('user already registered')) {
    return 'Ya existe una cuenta con ese email.';
  }

  if (message.includes('row-level security') || message.includes('permission denied')) {
    return 'No tienes permiso para hacer esto.';
  }

  if (message.includes('duplicate key')) {
    return 'Ese registro ya existe.';
  }

  return 'Ha ocurrido un error. Inténtalo de nuevo en unos segundos.';
}
