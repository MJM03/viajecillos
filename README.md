# Viajecillos

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
