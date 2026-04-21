# =============================================
# INSTRUCCIONES PARA EJECUTAR LA EXTENSIÓN DE BASE DE DATOS
# =============================================

## PASO 1: Ejecutar el Script SQL
# Ejecuta el archivo database_extension.sql en SQL Server Management Studio
# o mediante línea de comandos:
#
# sqlcmd -S TU_SERVIDOR -d sistema_pago_nomina -i database_extension.sql

## PASO 2: Actualizar Prisma
# Una vez ejecutado el script SQL, actualiza el cliente de Prisma:
cd backend
npx prisma generate

## PASO 3: Crear Migración de Prisma (Opcional)
# Si deseas crear una migración de Prisma en lugar de ejecutar SQL directo:
# npx prisma migrate dev --name add_business_features

## ESTRUCTURA DE TABLAS AGREGADAS:

### 1. Estados de Nómina
- EstadoNomina: Define los estados por los que pasa una nómina
- HistorialEstadoNomina: Registra cambios de estado con auditoría

### 2. Control de Ventas
- Cliente: Información de clientes
- ProductoServicio: Catálogo de productos/servicios
- Venta: Encabezado de ventas
- DetalleVenta: Detalles de cada venta

### 3. Control de Capital y Finanzas
- CuentaBancariaEmpresa: Cuentas bancarias de la empresa
- MovimientoFinanciero: Todos los movimientos de dinero

### 4. Estadísticas y Eficiencia
- IndicadorEficiencia: Definición de KPIs
- EstadisticaMensual: Valores mensuales de indicadores
- PresupuestoAnual: Presupuestos por año

### 5. Modificaciones a Tablas Existentes
- NominaEncabezado: Agregada columna IdEstadoActual
- Empresa: Agregadas columnas CapitalInicial y CapitalActual

## FUNCIONALIDADES HABILITADAS:

✅ Flujo de aprobación de nóminas con estados
✅ Registro completo de ventas y clientes
✅ Control de capital y movimientos financieros
✅ Dashboard de estadísticas mensuales/anuales
✅ Presupuestos anuales
✅ Vistas para reportes automáticos

## PRÓXIMOS PASOS DESPUÉS DE LA EJECUCIÓN:

1. Actualizar DTOs en el backend para incluir nuevos campos
2. Crear módulos para ventas, finanzas y estadísticas
3. Actualizar frontend con nuevas interfaces
4. Implementar lógica de estados de nómina
5. Crear reportes y dashboards