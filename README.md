# GrabadorPantalla.online

Una aplicación web moderna para grabar tu pantalla, inspirada en Loom, construida con Next.js, TypeScript, Tailwind CSS y PostgreSQL.

## Características

- 🎥 Grabación de pantalla en el navegador
- 👤 Sistema de autenticación con registro e inicio de sesión
- 💾 Almacenamiento local de videos
- 🎨 Interfaz moderna y atractiva inspirada en Loom
- 📊 Dashboard para gestionar tus grabaciones
- 🔒 Seguridad con NextAuth.js
- 🗄️ Base de datos PostgreSQL con Prisma

## Tecnologías

- **Frontend**: Next.js 14, React 18, TypeScript
- **Estilos**: Tailwind CSS
- **Autenticación**: NextAuth.js
- **Base de datos**: PostgreSQL
- **ORM**: Prisma
- **Grabación**: MediaRecorder API

## Instalación

1. Clona el repositorio:
```bash
git clone https://github.com/falconsoft3d/grabadordepantalla.online.git
cd grabadordepantalla.online
```

2. Instala las dependencias:
```bash
npm install
```

3. Configura las variables de entorno:
```bash
cp .env.example .env
```

Edita el archivo `.env` y configura:
- `DATABASE_URL`: Tu conexión a PostgreSQL
- `NEXTAUTH_SECRET`: Genera uno con `openssl rand -base64 32`

4. Configura la base de datos:
```bash
npx prisma generate
npx prisma db push
```

5. Inicia el servidor de desarrollo:
```bash
npm run dev
```

Visita [http://localhost:3000](http://localhost:3000)

## Estructura del Proyecto

```
├── app/
│   ├── api/              # Rutas API
│   ├── dashboard/        # Dashboard de usuario
│   ├── login/           # Página de login
│   ├── register/        # Página de registro
│   └── page.tsx         # Landing page
├── components/          # Componentes reutilizables
├── lib/                # Utilidades y configuración
├── prisma/             # Schema de base de datos
└── public/             # Archivos estáticos
```

## Scripts

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Construye para producción
- `npm start` - Inicia el servidor de producción
- `npm run lint` - Ejecuta el linter

## Configuración de PostgreSQL

Asegúrate de tener PostgreSQL instalado y corriendo. Crea una base de datos:

```sql
CREATE DATABASE grabadorpantalla;
```

## Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia

MIT

## Autor

Marlon Falcon - [@falconsoft3d](https://github.com/falconsoft3d)
