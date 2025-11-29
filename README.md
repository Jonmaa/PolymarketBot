# PolymarketBot 🎯

Discord bot that monitors [Polymarket](https://polymarket.com) prediction markets and sends alerts when options exceed a probability threshold.

## 📁 Files

### `polymarketBot.js`
Discord bot that automatically monitors markets and sends alerts to separate channels.

**Features:**
- 🔄 Dynamically generates market slugs based on current date
- ⏰ Only alerts when less than 4 hours remain before market close (daily markets)
- 📊 Sends alert when an option exceeds 85% probability
- 🔔 Detects probability changes and sends updates
- 🔁 Checks markets every 5 minutes
- 📢 Separate Discord channels for Daily, Weekly, and Monthly markets
- 🏢 Shows company names for "Largest Company" markets
- 💰 Displays crypto prices with full formatting ($100,000)

**Monitored Markets:**

| Category | Markets |
|----------|---------|
| **Daily Crypto** | Bitcoin, Ethereum, Solana, XRP |
| **Daily Stocks** | NVIDIA, Amazon, Meta, Apple, Tesla |
| **Daily Indices** | S&P 500, Nasdaq 100 |
| **Daily Weather** | London & NYC Temperature |
| **Weekly** | Elon Musk Tweet Count |
| **Monthly Crypto** | BTC, ETH, SOL, XRP Price Targets |
| **Monthly Companies** | 1st, 2nd, 3rd Largest Company |

### `markets.js`
Console script to view current status of all markets.

**Features:**
- 📈 Shows all markets without filters
- 📊 Visual probability bar
- 💵 Price per share for each option
- ⏳ Time remaining until close
- ✅ Indicates if market is closed
- 🔹 Multi-option markets show all options with >1% probability

## 🚀 Installation

```bash
# Clone the repository
git clone https://github.com/Jonmaa/PolymarketBot.git
cd PolymarketBot

# Install dependencies
npm install
```

## ⚙️ Configuration

Create a `.env` file in the project root:

```env
DISCORD_TOKEN=your_discord_token
DAILY_CHANNEL_ID=channel_id_for_daily_alerts
WEEKLY_CHANNEL_ID=channel_id_for_weekly_alerts
MONTLY_CHANNEL_ID=channel_id_for_monthly_alerts
```

### Getting the Discord Token:
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Go to "Bot" and create a bot
4. Copy the token

### Getting Channel IDs:
1. In Discord, enable Developer Mode (Settings > Advanced > Developer Mode)
2. Right-click on the channel > Copy ID

## 📖 Usage

### View markets in console
```bash
node markets.js
```

Example output:
```
📊 Bitcoin Up or Down on November 29?
   ⏰ Status: ⏳ Closes in 2h 30m
   🟢 Up   : ████████████████░░░░  82.5% ($0.83)
   🔴 Down : ████░░░░░░░░░░░░░░░░  17.5% ($0.17)
   💰 Volume: $523,492

📊 Elon Musk # tweets November 25 - December 2, 2025?
   ⏰ Status: ⏳ Closes in 73h 24m
   🔹 280-299             : █████░░░░░░░░░░░░░░░  26.6%
   🔹 260-279             : █████░░░░░░░░░░░░░░░  24.8%
   🔹 300-319             : ███░░░░░░░░░░░░░░░░░  17.2%
   💰 Total Volume: $4,588,990

📊 What price will Bitcoin hit in November?
   ⏰ Status: ⏳ Closes in 37h 24m
   🔹 📈 $110,000         : ████████████████████ 100.0%
   🔹 📉 $100,000         : ██████████░░░░░░░░░░  50.5%
   💰 Total Volume: $51,684,450

📊 Largest Company end of November?
   ⏰ Status: ⏳ Closes in 8h 24m
   🔹 NVIDIA              : ████████████████████  99.9%
   💰 Total Volume: $24,080,450
```

### Run the Discord bot
```bash
node polymarketBot.js
```

The bot will send embeds to Discord when:
1. An option exceeds 85% probability
2. Less than 4 hours remain before close (daily markets only)
3. Probabilities change from the last check

## 🌐 24/7 Deployment

### Railway 
1. Go to [railway.app](https://railway.app)
2. Connect your GitHub repository
3. Add environment variables (`DISCORD_TOKEN`, `DAILY_CHANNEL_ID`, `WEEKLY_CHANNEL_ID`, `MONTLY_CHANNEL_ID`)
4. Automatic deployment

### PM2 (On a server)
```bash
npm install -g pm2
pm2 start polymarketBot.js --name "polymarket-bot"
pm2 save
```

### PM2 (On personal PC)

To start automatically on boot:

```bash
npm install -g pm2
pm2 start polymarketBot.js --name "polymarket-bot"
pm2 save
pm2 startup
```

## 📦 Dependencies

- `discord.js` - Discord client
- `axios` - HTTP client for Polymarket API
- `dotenv` - Load environment variables

## 🔧 Advanced Configuration

You can modify these values in `polymarketBot.js`:

```javascript
// Probability threshold to trigger alert (0.85 = 85%)
const THRESHOLD = 0.85;

// Time before close to start alerting (4 hours) - Daily markets only
const TIME_BEFORE_CLOSE_MS = 4 * 60 * 60 * 1000;

// Check interval (5 minutes)
setInterval(checkMarketsAndNotify, 5 * 60 * 1000);
```

## 📋 Changelog

### v2.0
- ✨ Added multi-channel support (Daily, Weekly, Monthly)
- ✨ Added Weekly markets (Elon Musk tweet count)
- ✨ Added Monthly markets (Crypto prices, Largest companies)
- ✨ Multi-option markets display all options with >1% probability
- ✨ Company names shown for "Largest Company" markets
- ✨ Crypto prices displayed with full formatting ($100,000)
- ✨ Dynamic date-based slug generation for all market types
- 🔧 Improved change detection for multi-option markets

### v1.0
- 🎉 Initial release
- ✨ Daily crypto and stock market monitoring
- ✨ Discord alerts with probability threshold
- ✨ Visual probability bars in console
