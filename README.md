# Viajecillos

## Sincronización entre dispositivos

La app ya está preparada para compartir los gastos en tiempo real con Firebase,
sin mostrar una pantalla de inicio de sesión. Antes de usarla en más de un
dispositivo, activa estos dos servicios en el proyecto `viajecillos-d57ea`:

1. **Authentication → Sign-in method → Anonymous**: activar.
2. **Firestore Database → Create database**: crearla en modo producción y pegar
   estas reglas en la pestaña **Rules**:

```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /viajecillosShared/viaje-norte-lider-2-2026 {
      allow read, write: if request.auth != null;
    }
  }
}
```

También agrega `mjm03.github.io` en **Authentication → Settings → Authorized
domains**, para que funcione desde GitHub Pages.

Mientras Firebase no esté activo o no haya internet, los gastos siguen
guardándose en el dispositivo y se intentan sincronizar cuando la conexión se
recupere.

Web móvil para controlar los viáticos reales del viaje Norte (Líder 2) del 6 al 20 de septiembre de 2026.

## V1

- 15 días y destinos precargados desde la hoja `V1 OPTIMIZADA`.
- 6 personas.
- Registro diario de Transporte, Hospedaje, Alimentación y Movilidad.
- Comparación del gasto real con el gasto objetivo del presupuesto.
- Ahorro real acumulado del grupo y ahorro por persona.
- Proyección automática del ahorro final: usa los gastos reales de días cerrados y el gasto objetivo para días pendientes.
- Proyección de gasto final y porcentaje del disponible neto utilizado.
- Datos guardados localmente en el navegador del dispositivo.

## Lógica financiera

La web distingue:

1. **Presupuesto bruto**: importe presupuestado/facturable.
2. **Disponible neto**: presupuesto después del 18% de IGV.
3. **Gasto objetivo**: gasto esperado del grupo según la hoja optimizada.
4. **Gasto real**: lo que se registra diariamente.
5. **Ahorro real**: disponible neto menos gasto real.
6. **Ahorro por persona**: ahorro del grupo dividido entre 6.

## Siguiente versión

Conectar Firebase para sincronización entre iPhone, PC y otros usuarios, y añadir historial de cambios/autenticación.
