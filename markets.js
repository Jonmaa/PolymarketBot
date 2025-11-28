const axios = require("axios");

// Lista de slugs de los mercados diarios "Up or Down" del 28 de noviembre
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

async function getPolymarkets() {
  const now = new Date();
  console.log(`Buscando mercados Up or Down del 28 de noviembre en Polymarket...`);
  console.log(`Última actualización: ${now.toLocaleString()}\n`);
  
  // Hacer todas las peticiones en paralelo para obtener datos más rápido
  const results = await Promise.all(MARKET_SLUGS.map(slug => getMarketBySlug(slug)));
  
  for (let i = 0; i < MARKET_SLUGS.length; i++) {
    const event = results[i];
    const slug = MARKET_SLUGS[i];
    
    if (event) {
      console.log(`=== ${event.title} ===`);
      
      if (event.markets && event.markets.length > 0) {
        const market = event.markets[0];
        
        // Parsear outcomes y precios
        let outcomes = market.outcomes;
        if (typeof outcomes === "string") {
          try { outcomes = JSON.parse(outcomes); } catch (e) {}
        }
        
        let outcomePrices = [];
        if (Array.isArray(market.outcomePrices)) {
          outcomePrices = market.outcomePrices.map(p => parseFloat(p));
        } else if (typeof market.outcomePrices === "string") {
          try { outcomePrices = JSON.parse(market.outcomePrices).map(p => parseFloat(p)); } catch (e) {}
        }
        
        // Mostrar probabilidades en porcentaje
        const pricesPercent = outcomePrices.map(p => (p * 100).toFixed(1) + "%");
        
        console.log("ID:", market.id);
        console.log("Opciones:", outcomes.join(" / "));
        console.log("Probabilidades:", pricesPercent.join(" / "));
        console.log("Volumen: $" + parseFloat(market.volume || 0).toLocaleString("en-US", { maximumFractionDigits: 0 }));
        console.log("Cierre:", market.endDate);
        console.log("");
      }
    } else {
      console.log(`=== ${slug} ===`);
      console.log("No encontrado\n");
    }
  }
}

getPolymarkets();
