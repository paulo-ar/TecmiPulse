# TecmiPulse - Control del Gym

Plataforma integral web para el control de accesos, gestion de usuarios y monitoreo en tiempo real del gimnasio institucional de Tecmilenio. El sistema funciona como un panel administrativo y dashboard interactivo que se comunica de forma bidireccional con modulos de hardware ESP32 con lectores NFC y una base de datos centralizada.

## El Problema y la Solucion

### El Problema

La gestion de accesos en instalaciones deportivas escolares frecuentemente depende de procesos manuales o sistemas de registro desconectados. Esto provoca cuellos de botella en las entradas, dificulta la validacion estricta de requisitos institucionales como certificados medicos, cartas responsivas y reglamentos, y deja a la administracion sin visibilidad clara sobre el aforo real, los picos de asistencia y la trazabilidad historica de los alumnos.

### La Solucion

TecmiPulse moderniza la operacion mediante un ecosistema automatizado y una interfaz con diseno institucional oscuro optimizada para reducir la fatiga visual. Un modulo IoT lee las credenciales fisicas e interactua de inmediato con el backend, donde se validan las reglas de negocio, como acceso automatico para nivel Profesional o bloqueo por falta de documentos.

El personal de administracion cuenta con un panel que permite:

- Visualizar en tiempo real el aforo mediante KPIs interactivos.
- Analizar el flujo diario con una grafica de ingresos y salidas.
- Explorar el historial de visitas mediante un componente de Time Travel con calendario para tomar decisiones operativas basadas en datos.
- Gestionar perfiles, documentos y cierres de sesion de manera centralizada.

## Stack Tecnologico

- **Next.js 14:** framework principal elegido por su enrutamiento con App Router y la facilidad para crear rutas de API seguras para el hardware y la proteccion de llaves maestras.
- **React 18:** biblioteca base para construir la interfaz mediante componentes modulares, estado global y overlays de detalle.
- **TypeScript:** utilizado para tipar estrictamente el esquema de base de datos y los modelos de datos, como `NivelEducativo` y `EstatusRegistro`, garantizando mayor robustez en el desarrollo.
- **Tailwind CSS:** framework de utilidades implementado para construir el sistema visual de la plataforma, con identidad institucional oscura, acentos verdes y semantica de estados.
- **Recharts:** libreria de graficos seleccionada para renderizar la linea de tiempo interactiva que refleja los patrones de entrada y salida del dia.
- **Supabase:** Backend-as-a-Service que resuelve la persistencia en PostgreSQL, autenticacion de administradores, reactividad del dashboard mediante Realtime y funciones RPC para agilizar las validaciones del hardware.

## Instalacion y Configuracion Local

### 1. Clonar el repositorio

```bash
git clone <URL_DEL_REPOSITORIO>
cd tecmipulse
```

### 2. Configurar variables de entorno

Crea un archivo `.env.local` en la raiz del proyecto. Este archivo es necesario para la conexion segura con Supabase y la gestion de permisos administrativos.

```env
NEXT_PUBLIC_SUPABASE_URL="tu_url_de_supabase"
NEXT_PUBLIC_SUPABASE_ANON_KEY="tu_llave_anonima_publica"
SUPABASE_SERVICE_ROLE_KEY="tu_llave_maestra_service_role"
```

### 3. Instalar dependencias

Ejecuta el siguiente comando utilizando `pnpm`. Se recomienda `--ignore-scripts` para evitar la ejecucion automatica de scripts de terceros durante la instalacion.

```bash
pnpm install --ignore-scripts
```

### 4. Ejecutar el entorno de desarrollo

```bash
pnpm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador para ver la aplicacion en funcionamiento.

## Scripts Disponibles

- `pnpm run dev`: inicia el servidor de desarrollo.
- `pnpm run build`: genera la version de produccion.
- `pnpm run start`: ejecuta la version compilada.
- `pnpm run lint`: ejecuta la revision de lint configurada para Next.js.

## Autoria

Proyecto de Innovacion Tecnologica. Diseno y desarrollo por Juan Paulo Arellano Aguilar.
