# PolymarketBot 🎯

Bot de Discord que monitorea los mercados diarios "Up or Down" de [Polymarket](https://polymarket.com) y envía alertas cuando una opción supera un umbral de probabilidad.

## 📁 Archivos

### `polymarketBot.js`
Bot de Discord que monitorea automáticamente los mercados y envía alertas.

**Características:**
- 🔄 Genera slugs dinámicamente según la fecha actual
- ⏰ Solo alerta cuando faltan menos de 4 horas para el cierre del mercado
- 📊 Envía alerta cuando una opción supera el 85% de probabilidad
- 🔔 Detecta cambios en los porcentajes y envía actualizaciones
- 🔁 Verifica los mercados cada 5 minutos

**Mercados monitoreados:**
- **Crypto:** Bitcoin, Ethereum, Solana, XRP
- **Stocks:** NVIDIA, Amazon, Meta, Apple, Tesla
- **Índices:** S&P 500, Nasdaq 100

### `markets.js`
Script de consola para ver el estado actual de todos los mercados.

**Características:**
- 📈 Muestra todos los mercados sin filtros
- 📊 Barra visual de probabilidad
- 💵 Precio por share de cada opción
- ⏳ Tiempo restante hasta el cierre
- ✅ Indica si el mercado ya cerró

## 🚀 Instalación

```bash
# Clonar el repositorio
git clone https://github.com/Jonmaa/PolymarketBot.git
cd PolymarketBot

# Instalar dependencias
npm install
```

## ⚙️ Configuración

Crear un archivo `.env` en la raíz del proyecto:

```env
DISCORD_TOKEN=tu_token_de_discord
CHANNEL_ID=id_del_canal_de_discord
```

### Obtener el token de Discord:
1. Ve a [Discord Developer Portal](https://discord.com/developers/applications)
2. Crea una nueva aplicación
3. Ve a "Bot" y crea un bot
4. Copia el token

### Obtener el Channel ID:
1. En Discord, activa el modo desarrollador (Ajustes > Avanzado > Modo desarrollador)
2. Click derecho en el canal > Copiar ID

## 📖 Uso

### Ver mercados en consola
```bash
node markets.js
```

Salida ejemplo:
```
📊 Bitcoin Up or Down on November 28?
   ⏰ Estado: ⏳ Cierra en 2h 30m
   🟢 Up   : ████████████████░░░░  82.5% ($0.83)
   🔴 Down : ████░░░░░░░░░░░░░░░░  17.5% ($0.17)
   💰 Volumen: $523,492
```

### Ejecutar el bot de Discord
```bash
node polymarketBot.js
```

El bot enviará embeds a Discord cuando:
1. Una opción supere el 85% de probabilidad
2. Falten menos de 4 horas para el cierre
3. Los porcentajes cambien respecto al último check

## 🌐 Despliegue 24/7

### Railway 
1. Ve a [railway.app](https://railway.app)
2. Conecta tu repositorio de GitHub
3. Añade las variables de entorno (`DISCORD_TOKEN`, `CHANNEL_ID`)
4. Deploy automático

### PM2 (En servidor)
```bash
npm install -g pm2
pm2 start polymarketBot.js --name "polymarket-bot"
pm2 save
```
### PM2 (En pc personal)

Para que se inicie cada vez que inicias el pc.

```bash
npm install -g pm2
pm2 start polymarketBot.js --name "polymarket-bot"
pm2 save
pm2 startup
```

## 📦 Dependencias

- `discord.js` - Cliente de Discord
- `axios` - Cliente HTTP para la API de Polymarket
- `dotenv` - Cargar variables de entorno

## 🔧 Configuración avanzada

Puedes modificar estos valores en `polymarketBot.js`:

```javascript
// Umbral de probabilidad para alertar (0.85 = 85%)
const THRESHOLD = 0.85;

// Tiempo antes del cierre para empezar a alertar (4 horas)
const TIME_BEFORE_CLOSE_MS = 4 * 60 * 60 * 1000;

// Intervalo de verificación (5 minutos)
setInterval(checkMarketsAndNotify, 5 * 60 * 1000);
```
