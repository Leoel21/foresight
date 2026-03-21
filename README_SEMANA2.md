# Foresight — Semana 2: Backend + Supabase

## Lo que hay en esta semana

```
backend/
├── index.js                 → Servidor Express (punto de entrada)
├── package.json             → Dependencias
├── .env.example             → Plantilla de variables de entorno
│
├── db/
│   ├── supabase.js          → Cliente de Supabase
│   └── schema.sql           → Tablas + datos de ejemplo (ejecutar en Supabase)
│
├── routes/
│   ├── markets.js           → GET/POST mercados
│   ├── predictions.js       → POST predicciones, GET historial
│   ├── users.js             → GET/POST usuarios
│   └── leagues.js           → GET leaderboard, POST promoción
│
└── services/
    └── oracle.js            → Resuelve mercados automáticamente

frontend/js/
└── api.js                   → Cliente que conecta el frontend con el backend
```

---

## PASO 1 — Instalar Node.js

1. Ve a https://nodejs.org
2. Descarga la versión **LTS** (la izquierda, más estable)
3. Instálala con las opciones por defecto
4. Abre la terminal en VSCode: menú → Terminal → New Terminal
5. Comprueba que funciona:
   ```
   node --version
   npm --version
   ```
   Debe mostrarte dos números de versión (ej: v20.11.0 y 10.2.4)

---

## PASO 2 — Configurar Supabase

1. Ve a https://supabase.com y entra en tu proyecto
2. En el menú lateral → **SQL Editor** → **New Query**
3. Pega todo el contenido de `backend/db/schema.sql`
4. Pulsa **Run** — esto crea las tablas y los datos de ejemplo

5. Ve a **Settings** → **API**
6. Copia:
   - **Project URL** (empieza por https://...)
   - **anon public** key (empieza por eyJ...)

---

## PASO 3 — Configurar variables de entorno

1. En la carpeta `backend/`, duplica `.env.example` y renómbralo a `.env`
2. Pega tus credenciales de Supabase:
   ```
   SUPABASE_URL=https://tu-proyecto.supabase.co
   SUPABASE_KEY=eyJhbGciOiJ...
   PORT=3000
   ```
3. **IMPORTANTE**: `.env` nunca va a git. Ya está en `.gitignore`.

---

## PASO 4 — Instalar dependencias y arrancar

Abre la terminal de VSCode dentro de la carpeta `backend/`:

```bash
cd backend
npm install
npm run dev
```

Deberías ver:
```
Foresight backend corriendo en http://localhost:3000
```

Para comprobar que funciona, abre en el navegador:
http://localhost:3000

Deberías ver: `{"status":"ok","app":"foresight"}`

---

## PASO 5 — Probar los endpoints

Instala la extensión **Thunder Client** en VSCode y prueba:

| Método | URL | Descripción |
|--------|-----|-------------|
| GET  | http://localhost:3000/api/markets | Todos los mercados |
| GET  | http://localhost:3000/api/markets?category=crypto | Solo crypto |
| GET  | http://localhost:3000/api/leagues/gold | Leaderboard oro |

---

## PASO 6 — Conectar el frontend

En cada página HTML añade `api.js` antes del cierre de `</body>`:

```html
<script src="js/api.js"></script>
```

Luego sustituye las llamadas a `MARKETS` (data.js) por llamadas reales:

**Antes (Semana 1):**
```javascript
renderMarkets(MARKETS);
```

**Ahora (Semana 2):**
```javascript
const markets = await getMarkets();
renderMarkets(markets);
```

---

## Correr el oráculo manualmente

```bash
cd backend
npm run oracle
```

Busca mercados cerrados y los resuelve automáticamente.
En producción esto correría cada hora con un cron job.

---

## Errores comunes

**"Cannot find module 'express'"**
→ No has corrido `npm install`. Hazlo dentro de la carpeta `backend/`.

**"invalid API key"**
→ Las credenciales en `.env` son incorrectas. Revisa el paso 3.

**CORS error en el navegador**
→ El backend está caído. Comprueba que `npm run dev` sigue corriendo.
