const axios = require("axios");

// Nombres de los meses en inglés
const MONTH_NAMES = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december"
];

// Función para generar los slugs dinámicamente según la fecha actual
function generateMarketSlugs() {
  const today = new Date();
  const month = MONTH_NAMES[today.getMonth()];
  const day = today.getDate();
  const year = today.getFullYear();

  // Crypto markets: sin año en el slug
  const cryptoSlugs = [
    `bitcoin-up-or-down-on-${month}-${day}`,
    `ethereum-up-or-down-on-${month}-${day}`,
    `solana-up-or-down-on-${month}-${day}`,
    `xrp-up-or-down-on-${month}-${day}`
  ];

  // Stock/Index markets: con año en el slug
  const stockSlugs = [
    `nvda-up-or-down-on-${month}-${day}-${year}`,
    `amzn-up-or-down-on-${month}-${day}-${year}`,
    `meta-up-or-down-on-${month}-${day}-${year}`,
    `aapl-up-or-down-on-${month}-${day}-${year}`,
    `tsla-up-or-down-on-${month}-${day}-${year}`,
    `spx-up-or-down-on-${month}-${day}-${year}`,
    `ndx-up-or-down-on-${month}-${day}-${year}`
  ];

  return [...cryptoSlugs, ...stockSlugs];
}

async function getMarketBySlug(slug) {
  try {
    // Añadir timestamp para evitar caché y obtener datos frescos
    const timestamp = Date.now();
    const res = await axios.get(`https://gamma-api.polymarket.com/events?slug=${slug}&_t=${timestamp}`);
    const data = Array.isArray(res.data) ? res.data : res.data.data || [];
    return data.length > 0 ? data[0] : null;
  } catch (err) {
    console.error(`Error obteniendo ${slug}:`, err.message);
    return null;
  }
}

function getTimeRemaining(endDate) {
  const now = new Date();
  const end = new Date(endDate);
  const diffMs = end - now;
  
  if (diffMs <= 0) return { expired: true, text: "Cerrado" };
  
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  return {
    expired: false,
    text: hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
  };
}

async function getPolymarkets() {
  const MARKET_SLUGS = generateMarketSlugs();
  const now = new Date();
  const month = MONTH_NAMES[now.getMonth()];
  const day = now.getDate();
  
  console.log(`\n🔍 Buscando mercados Up or Down para ${month} ${day}...`);
  console.log(`📅 Última actualización: ${now.toLocaleString()}\n`);
  console.log("=".repeat(60));
  
  // Hacer todas las peticiones en paralelo para obtener datos más rápido
  const results = await Promise.all(MARKET_SLUGS.map(slug => getMarketBySlug(slug)));
  
  for (let i = 0; i < MARKET_SLUGS.length; i++) {
    const event = results[i];
    const slug = MARKET_SLUGS[i];
    
    if (event && event.markets && event.markets.length > 0) {
      const market = event.markets[0];
      
      // Parsear outcomes y precios
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
      
      // Calcular tiempo restante
      const timeRemaining = getTimeRemaining(market.endDate);
      
      // Mostrar info del mercado
      console.log(`\n📊 ${event.title}`);
      console.log(`   ⏰ Estado: ${timeRemaining.expired ? "❌ Cerrado" : `⏳ Cierra en ${timeRemaining.text}`}`);
      
      // Mostrar opciones con formato visual
      outcomes.forEach((option, idx) => {
        const percent = (outcomePrices[idx] * 100).toFixed(1);
        const price = outcomePrices[idx].toFixed(2);
        const bar = "█".repeat(Math.round(outcomePrices[idx] * 20)) + "░".repeat(20 - Math.round(outcomePrices[idx] * 20));
        const emoji = option === "Up" ? "🟢" : "🔴";
        console.log(`   ${emoji} ${option.padEnd(5)}: ${bar} ${percent.padStart(5)}% ($${price})`);
      });
      
      console.log(`   💰 Volumen: $${parseFloat(market.volume || 0).toLocaleString("en-US", { maximumFractionDigits: 0 })}`);
    } else {
      console.log(`\n❌ ${slug} - No encontrado`);
    }
  }
  
  console.log("\n" + "=".repeat(60));
  console.log("✅ Búsqueda completada\n");
}

getPolymarkets();
