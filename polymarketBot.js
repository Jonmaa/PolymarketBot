require("dotenv").config({ path: ".env" });
const { Client, GatewayIntentBits } = require("discord.js");
const axios = require("axios");

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

async function getMarketData(marketId) {
  try {
    const res = await axios.get(`https://clob.polymarket.com/market/${marketId}`);
    return res.data;
  } catch (e) {
    console.error("Error consultando Polymarket:", e.response?.status, e.response?.data);
    return null;
  }
}

async function getAllMarkets(nextCursor = "") {
  try {
    const url = `https://clob.polymarket.com/markets${ nextCursor ? '?next_cursor=' + encodeURIComponent(nextCursor) : '' }`;
    const res = await axios.get(url);
    return res.data; // data: { limit, count, next_cursor, data: [...] }
  } catch (e) {
    console.error("Error listando mercados:", e.response?.status, e.response?.data);
    return null;
  }
}



client.once("clientReady", async () => {
  console.log("Bot conectado.");

  const marketsResp = await getAllMarkets();
  if (!marketsResp) return;

  const markets = marketsResp.data;
  console.log("Mercados disponibles:", markets.length);

  // Por ejemplo filtrar por slug, pregunta, o category...
  // Luego podemos imprimir algunos para inspección
  markets.slice(0, 10).forEach(m => console.log(m.id, m.question, m.slug));
});




client.login(process.env.DISCORD_TOKEN);



