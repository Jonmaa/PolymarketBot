require("dotenv").config({ path: ".env" });
const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const axios = require("axios");

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

// Lista de slugs de los mercados diarios "Up or Down"
const MARKET_SLUGS = [
  "bitcoin-up-or-down-on-november-28",
  "nvda-up-or-down-on-november-28-2025",
  "amzn-up-or-down-on-november-28-2025",
  "meta-up-or-down-on-november-28-2025",
  "aapl-up-or-down-on-november-28-2025",
  "spx-up-or-down-on-november-28-2025",
  "ndx-up-or-down-on-november-28-2025",
  "ethereum-up-or-down-on-november-28",
  "solana-up-or-down-on-november-28",
  "xrp-up-or-down-on-november-28"
];

// Umbral de probabilidad para enviar alerta (80%)
const THRESHOLD = 0.85;

// Tiempo antes del cierre para enviar alerta (2 horas en milisegundos)
const TIME_BEFORE_CLOSE_MS = 2 * 60 * 60 * 1000;

// ID del canal de Discord donde enviar los mensajes
const CHANNEL_ID = process.env.CHANNEL_ID;

// Set para trackear qué mercados ya enviaron alerta (evitar duplicados)
const alertedMarkets = new Set();

async function getMarketBySlug(slug) {
  try {
    const timestamp = Date.now();
    const res = await axios.get(`https://gamma-api.polymarket.com/events?slug=${slug}&_t=${timestamp}`);
    const data = Array.isArray(res.data) ? res.data : res.data.data || [];
    return data.length > 0 ? data[0] : null;
  } catch (err) {
    console.error(`Error obteniendo ${slug}:`, err.message);
    return null;
  }
}

function parseMarketData(market) {
  let outcomes = market.outcomes;
  if (typeof outcomes === "string") {
    try { outcomes = JSON.parse(outcomes); } catch (e) { outcomes = []; }
  }

  let outcomePrices = [];
  if (Array.isArray(market.outcomePrices)) {
    outcomePrices = market.outcomePrices.map(p => parseFloat(p));
  } else if (typeof market.outcomePrices === "string") {
    try { outcomePrices = JSON.parse(market.outcomePrices).map(p => parseFloat(p)); } catch (e) {}
  }

  return { outcomes, outcomePrices };
}

function getTimeRemaining(endDate) {
  const now = new Date();
  const end = new Date(endDate);
  const diffMs = end - now;
  
  if (diffMs <= 0) return { expired: true, ms: 0, text: "Cerrado" };
  
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  return {
    expired: false,
    ms: diffMs,
    text: hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
  };
}

async function checkMarketsAndNotify() {
  console.log(`[${new Date().toLocaleString()}] Verificando mercados...`);

  const channel = client.channels.cache.get(CHANNEL_ID);
  if (!channel) {
    console.error("No se encontró el canal. Verifica CHANNEL_ID en .env");
    return;
  }

  const results = await Promise.all(MARKET_SLUGS.map(slug => getMarketBySlug(slug)));

  for (let i = 0; i < MARKET_SLUGS.length; i++) {
    const slug = MARKET_SLUGS[i];
    const event = results[i];
    if (!event || !event.markets || event.markets.length === 0) continue;

    const market = event.markets[0];
    const { outcomes, outcomePrices } = parseMarketData(market);

    // Verificar tiempo restante hasta el cierre
    const timeRemaining = getTimeRemaining(market.endDate);
    
    // Si ya cerró o queda más de 2 horas, saltar
    if (timeRemaining.expired) {
      console.log(`⏭️ ${event.title} - Ya cerrado`);
      continue;
    }
    
    if (timeRemaining.ms > TIME_BEFORE_CLOSE_MS) {
      console.log(`⏳ ${event.title} - Faltan ${timeRemaining.text} (esperando a <2h)`);
      continue;
    }

    // Si ya enviamos alerta para este mercado, saltar
    if (alertedMarkets.has(slug)) {
      console.log(`📨 ${event.title} - Ya alertado anteriormente`);
      continue;
    }

    // Buscar si alguna opción supera el umbral
    for (let j = 0; j < outcomePrices.length; j++) {
      if (outcomePrices[j] >= THRESHOLD) {
        const percent = (outcomePrices[j] * 100).toFixed(1);
        const option = outcomes[j] || "Desconocido";

        const embed = new EmbedBuilder()
          .setColor(option === "Up" ? 0x00ff00 : 0xff0000)
          .setTitle(`🎯 ${event.title}`)
          .setDescription(`La opción **${option}** tiene una probabilidad del **${percent}%**\n⏰ **Cierra en ${timeRemaining.text}**`)
          .addFields(
            { name: "📊 Opciones", value: outcomes.map((o, idx) => `${o}: ${(outcomePrices[idx] * 100).toFixed(1)}%`).join("\n"), inline: true },
            { name: "💰 Volumen", value: `$${parseFloat(market.volume || 0).toLocaleString("en-US", { maximumFractionDigits: 0 })}`, inline: true },
            { name: "⏰ Cierre", value: market.endDate ? new Date(market.endDate).toLocaleString() : "N/A", inline: true }
          )
          .setURL(`https://polymarket.com/event/${event.slug}`)
          .setTimestamp();

        await channel.send({ embeds: [embed] });
        alertedMarkets.add(slug); // Marcar como alertado
        console.log(`✅ Alerta enviada: ${event.title} - ${option} ${percent}% (cierra en ${timeRemaining.text})`);
        break; // Solo enviar una alerta por mercado
      }
    }
  }
}

client.once("ready", async () => {
  console.log(`Bot conectado como ${client.user.tag}`);
  
  // Verificar mercados al iniciar
  await checkMarketsAndNotify();
  
  // Verificar cada 5 minutos
  setInterval(checkMarketsAndNotify, 5 * 60 * 1000);
});

client.login(process.env.DISCORD_TOKEN);



