# Foresight — Frontend Estático (Semana 1)

## Estructura
```
frontend/
├── index.html      → Pantalla principal con mercados
├── market.html     → Vista de un mercado individual (?id=1)
├── create.html     → Crear un nuevo mercado
├── profile.html    → Perfil y reputación onchain
│
├── css/
│   ├── main.css        → Variables CSS, reset, tipografía
│   └── components.css  → Nav, cards, botones, modales
│
└── js/
    ├── data.js     → Datos ficticios (sustituir por API en Semana 2)
    └── ui.js       → Funciones reutilizables (renderNav, createMarketCard...)
```

## Cómo usar en VSCode

1. Instala la extensión **Live Server** (busca "Live Server" de Ritwick Dey)
2. Abre la carpeta `frontend/` en VSCode
3. Haz click derecho sobre `index.html` → **Open with Live Server**
4. Se abrirá en `http://127.0.0.1:5500`

## Navegación entre páginas

- `index.html` → Lista de mercados, filtros, desafío diario
- `market.html?id=1` → Detalle de un mercado (cambia el id del 1 al 6)
- `create.html` → Formulario de creación
- `profile.html` → Perfil con stats y reputación

## Dónde tocar los datos

Todo el contenido está en `js/data.js`. Cambia los mercados,
el usuario, el leaderboard ahí y se actualiza en todas las páginas.

## Semana 2: conectar backend

En `js/ui.js` busca los comentarios `// Semana 2: aquí harás fetch(...)`.
Esos son los puntos exactos donde sustituirás los datos ficticios
por llamadas reales al backend Node.js.
