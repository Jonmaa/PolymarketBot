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

  // Daily - Crypto markets: sin año en el slug
  const cryptoSlugs = [
    `bitcoin-up-or-down-on-${month}-${day}`,
    `ethereum-up-or-down-on-${month}-${day}`,
    `solana-up-or-down-on-${month}-${day}`,
    `xrp-up-or-down-on-${month}-${day}`
  ];

  // Daily - Weather markets: sin año en el slug
  const weatherSlugs = [
    `highest-temperature-in-london-on-${month}-${day}`,
    `highest-temperature-in-nyc-on-${month}-${day}`
  ];

  // Daily - Stock/Index markets: con año en el slug
  const stockSlugs = [
    `nvda-up-or-down-on-${month}-${day}-${year}`,
    `amzn-up-or-down-on-${month}-${day}-${year}`,
    `meta-up-or-down-on-${month}-${day}-${year}`,
    `aapl-up-or-down-on-${month}-${day}-${year}`,
    `tsla-up-or-down-on-${month}-${day}-${year}`,
    `spx-up-or-down-on-${month}-${day}-${year}`,
    `ndx-up-or-down-on-${month}-${day}-${year}`
  ];

  // Weekly markets - Calcular semana actual (jueves a miércoles)
  const weeklySlugs = generateWeeklySlugs(today);

  // Monthly markets: mercados mensuales
  const monthlySlugs = [
    `what-price-will-bitcoin-hit-in-${month}-${year}`,
    `what-price-will-ethereum-hit-in-${month}-${year}`,
    `what-price-will-solana-hit-in-${month}-${year}`,
    `what-price-will-xrp-hit-in-${month}-${year}`,
    `largest-company-end-of-${month}`,
    `2nd-largest-company-end-of-${month}`,
    `3rd-largest-company-end-of-${month}`
  ];

  // Retornar con categorías
  return {
    daily: [...cryptoSlugs, ...weatherSlugs, ...stockSlugs],
    weekly: weeklySlugs,
    monthly: monthlySlugs
  };
}

// Función para generar slugs semanales (semanas de martes a lunes, 7 días)
function generateWeeklySlugs(today) {
  const slugs = [];
  
  // Encontrar el martes de esta semana (día 2)
  const dayOfWeek = today.getDay(); // 0=domingo, 2=martes
  const daysToTuesday = (dayOfWeek >= 2) ? dayOfWeek - 2 : dayOfWeek + 5;
  
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - daysToTuesday);
  
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);
  
  const startMonth = MONTH_NAMES[weekStart.getMonth()];
  const startDay = weekStart.getDate();
  const endMonth = MONTH_NAMES[weekEnd.getMonth()];
  const endDay = weekEnd.getDate();
  
  // Elon Musk tweets weekly
  slugs.push(`elon-musk-of-tweets-${startMonth}-${startDay}-${endMonth}-${endDay}`);
  
  return slugs;
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

async function displayMarkets(slugs, category) {
  if (slugs.length === 0) return;
  
  const results = await Promise.all(slugs.map(slug => getMarketBySlug(slug)));
  
  for (let i = 0; i < slugs.length; i++) {
    const event = results[i];
    const slug = slugs[i];
    
    if (event && event.markets && event.markets.length > 0) {
      // Detectar tipo de mercado
      const isCompanyMarket = slug.includes("largest-company");
      const isCryptoPriceMarket = slug.includes("what-price-will");
      const isMultiMarket = (category === "weekly" || category === "monthly") && event.markets.length > 1;
      
      // Calcular tiempo restante
      const market = event.markets[0];
      const timeRemaining = getTimeRemaining(market.endDate);
      
      // Mostrar info del mercado
      console.log(`\n📊 ${event.title}`);
      console.log(`   ⏰ Estado: ${timeRemaining.expired ? "❌ Cerrado" : `⏳ Cierra en ${timeRemaining.text}`}`);
      
      if (isMultiMarket) {
        // Procesar mercados con múltiples sub-opciones
        const allOptions = [];
        let totalVolume = 0;
        
        for (const m of event.markets) {
          let outcomes = m.outcomes;
          if (typeof outcomes === "string") {
            try { outcomes = JSON.parse(outcomes); } catch (e) { outcomes = []; }
          }
          
          let outcomePrices = [];
          if (Array.isArray(m.outcomePrices)) {
            outcomePrices = m.outcomePrices.map(p => parseFloat(p));
          } else if (typeof m.outcomePrices === "string") {
            try { outcomePrices = JSON.parse(m.outcomePrices).map(p => parseFloat(p)); } catch (e) {}
          }
          
          const yesIndex = outcomes.indexOf("Yes");
          if (yesIndex !== -1 && outcomePrices[yesIndex] > 0.01) {
            let label;
            
            if (isCompanyMarket) {
              const companyMatch = m.question.match(/Will (.+?) be the/);
              label = companyMatch ? companyMatch[1] : "Unknown";
            } else if (isCryptoPriceMarket) {
              const priceMatch = m.question.match(/\$[\d,]+(?:\.\d+)?/);
              const actionMatch = m.question.match(/(reach|dip to)/i);
              const action = actionMatch ? (actionMatch[1].toLowerCase() === "reach" ? "📈" : "📉") : "";
              label = priceMatch ? `${action} ${priceMatch[0]}` : "?";
            } else {
              const rangeMatch = m.question.match(/(\d+[-+]?\d*)/);
              label = rangeMatch ? rangeMatch[0] : "?";
            }
            
            allOptions.push({
              label: label,
              percent: outcomePrices[yesIndex] * 100,
              volume: parseFloat(m.volume || 0)
            });
          }
          totalVolume += parseFloat(m.volume || 0);
        }
        
        // Ordenar por probabilidad descendente
        allOptions.sort((a, b) => b.percent - a.percent);
        
        // Mostrar todas las opciones con >1%
        allOptions.forEach(o => {
          const bar = "█".repeat(Math.round(o.percent / 5)) + "░".repeat(20 - Math.round(o.percent / 5));
          console.log(`   🔹 ${o.label.padEnd(20)}: ${bar} ${o.percent.toFixed(1).padStart(5)}%`);
        });
        
        console.log(`   💰 Volumen Total: $${totalVolume.toLocaleString("en-US", { maximumFractionDigits: 0 })}`);
        
      } else {
        // Mercado simple (Up/Down)
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
        
        // Mostrar opciones con formato visual
        outcomes.forEach((option, idx) => {
          const percent = (outcomePrices[idx] * 100).toFixed(1);
          const price = outcomePrices[idx].toFixed(2);
          const bar = "█".repeat(Math.round(outcomePrices[idx] * 20)) + "░".repeat(20 - Math.round(outcomePrices[idx] * 20));
          const emoji = option === "Up" ? "🟢" : "🔴";
          console.log(`   ${emoji} ${option.padEnd(5)}: ${bar} ${percent.padStart(5)}% ($${price})`);
        });
        
        console.log(`   💰 Volumen: $${parseFloat(market.volume || 0).toLocaleString("en-US", { maximumFractionDigits: 0 })}`);
      }
    } else {
      console.log(`\n❌ ${slug} - No encontrado`);
    }
  }
}

async function getPolymarkets() {
  const markets = generateMarketSlugs();
  const now = new Date();
  const month = MONTH_NAMES[now.getMonth()];
  const day = now.getDate();
  
  console.log(`\n🔍 Buscando mercados para ${month} ${day}...`);
  console.log(`📅 Última actualización: ${now.toLocaleString()}`);
  
  // Daily Markets
  console.log("\n" + "=".repeat(60));
  console.log("📆 DAILY MARKETS");
  console.log("=".repeat(60));
  await displayMarkets(markets.daily, "daily");
  
  // Weekly Markets
  if (markets.weekly.length > 0) {
    console.log("\n" + "=".repeat(60));
    console.log("📅 WEEKLY MARKETS");
    console.log("=".repeat(60));
    await displayMarkets(markets.weekly, "weekly");
  }
  
  // Monthly Markets
  console.log("\n" + "=".repeat(60));
  console.log("🗓️  MONTHLY MARKETS");
  console.log("=".repeat(60));
  await displayMarkets(markets.monthly, "monthly");
  
  console.log("\n" + "=".repeat(60));
  console.log("✅ Búsqueda completada\n");
}

getPolymarkets();
