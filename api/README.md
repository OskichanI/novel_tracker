# NovelTracker — API Backend

API intermedia entre la extensión de Chrome y MongoDB Atlas.

## Estructura

```
api/
├── server.js               # Punto de entrada
├── db.js                   # Conexión a MongoDB Atlas
├── package.json
├── .env.example            # Plantilla de variables de entorno
├── models/
│   ├── Dominio.js          # Schema: dominios de novelas
│   ├── Novela.js           # Schema: novelas registradas
│   └── Capitulo.js         # Schema: capítulos guardados
├── controllers/
│   ├── dominiosController.js
│   ├── novelasController.js
│   └── capitulosController.js
├── routes/
│   ├── dominios.js
│   ├── novelas.js
│   └── capitulos.js
└── middleware/
    └── validar.js          # Validación de entrada con express-validator
```

## Instalación

```bash
cd api
npm install
cp .env.example .env
# Edita .env con tu connection string de MongoDB Atlas
npm run dev
```

## Endpoints

### Dominios

| Método | Ruta                | Descripción                 |
| ------ | ------------------- | --------------------------- |
| GET    | `/api/dominios`     | Listar todos los dominios   |
| POST   | `/api/dominios`     | Crear dominio (idempotente) |
| GET    | `/api/dominios/:id` | Obtener un dominio          |
| PUT    | `/api/dominios/:id` | Actualizar regex            |
| DELETE | `/api/dominios/:id` | Eliminar dominio            |

### Novelas

| Método | Ruta               | Descripción                                         |
| ------ | ------------------ | --------------------------------------------------- |
| GET    | `/api/novelas`     | Listar (`?dominio_id=`, `?q=`, `?page=`, `?limit=`) |
| POST   | `/api/novelas`     | Crear novela (idempotente por URL)                  |
| GET    | `/api/novelas/:id` | Obtener una novela                                  |
| PUT    | `/api/novelas/:id` | Actualizar título                                   |
| DELETE | `/api/novelas/:id` | Eliminar novela + capítulos                         |

### Capítulos

| Método   | Ruta                                  | Descripción                             |
| -------- | ------------------------------------- | --------------------------------------- |
| GET      | `/api/capitulos`                      | Listar (`?novela_id=`, `?page=`, `?q=`) |
| GET      | `/api/capitulos/:id`                  | Obtener capítulo completo               |
| POST     | `/api/capitulos`                      | Insertar capítulo                       |
| **POST** | **`/api/capitulos/guardar-completo`** | **Endpoint principal de la extensión**  |
| DELETE   | `/api/capitulos/:id`                  | Eliminar capítulo                       |

## Endpoint principal: `POST /api/capitulos/guardar-completo`

La extensión llama a este único endpoint al detectar un capítulo. Crea automáticamente el dominio y la novela si no existen.

```json
{
  "dominio": {
    "nombre": "www.ejemplo.com",
    "regex_novela": "^/novel/([^/]+)",
    "regex_capitulo": "chapter-([\\d.]+)",
    "regex_titulo": null
  },
  "novela": {
    "titulo": "Mi Novela",
    "url_novela": "https://www.ejemplo.com/novel/mi-novela"
  },
  "capitulo": {
    "capitulo_num": 42,
    "titulo": "Capítulo 42: El comienzo",
    "url": "https://www.ejemplo.com/novel/mi-novela/chapter-42"
  }
}
```
