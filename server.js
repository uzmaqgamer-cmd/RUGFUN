const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// ─── Game State ───────────────────────────────────────────────────────────────
const rooms = new Map();

const TOKEN_POOL = [
  { name: 'PEPE',    emoji: '🐸', fullName: 'Pepe the Frog' },
  { name: 'BONK',    emoji: '🏏', fullName: 'Bonk' },
  { name: 'WIF',     emoji: '🐕‍🦺', fullName: 'dogwifhat' },
  { name: 'POPCAT',  emoji: '🐱', fullName: 'Popcat' },
  { name: 'MOODENG', emoji: '🦛', fullName: 'Moo Deng' },
  { name: 'PNUT',    emoji: '🐿️', fullName: 'Peanut the Squirrel' },
  { name: 'BRETT',   emoji: '🤙', fullName: 'Brett' },
  { name: 'TURBO',   emoji: '🌀', fullName: 'Turbo' },
  { name: 'FLOKI',   emoji: '⚡', fullName: 'Floki Inu' },
  { name: 'MOG',     emoji: '😺', fullName: 'Mog Coin' },
  { name: 'GIGA',    emoji: '💪', fullName: 'Gigachad' },
  { name: 'PONKE',   emoji: '🐒', fullName: 'Ponke' },
  { name: 'FWOG',    emoji: '🐸', fullName: 'Fwog' },
  { name: 'GOAT',    emoji: '🐐', fullName: 'Goat' },
  { name: 'NEIRO',   emoji: '🐶', fullName: 'Neiro' },
  { name: 'SUNDOG',  emoji: '☀️', fullName: 'Sundog' },
  { name: 'SLERF',   emoji: '😴', fullName: 'Slerf' },
  { name: 'MYRO',    emoji: '🐕', fullName: 'Myro' },
  { name: 'MAGA',    emoji: '🦅', fullName: 'Trump Maga' },
  { name: 'BODEN',   emoji: '🍦', fullName: 'Jeo Boden' },
  { name: 'SMOLE',   emoji: '🐭', fullName: 'Smole' },
  { name: 'CHILLGUY',emoji: '😎', fullName: 'Chill Guy' },
  { name: 'MICHI',   emoji: '🐈', fullName: 'Michi' },
  { name: 'RETARDIO',emoji: '🌈', fullName: 'Retardio' },
  { name: 'SIGMA',   emoji: '🔺', fullName: 'Sigma' },
];

const NEWS_POOL = [
  { type: 'bullish', text: '🚀 $TOKEN just got listed on CoinMarketCap!', impact: 0.18 },
  { type: 'bullish', text: '📈 $TOKEN DEX Screener banner purchased — eyes on the chart!', impact: 0.12 },
  { type: 'bullish', text: '🔥 Whale just aped in — $50K buy detected on-chain', impact: 0.22 },
  { type: 'bullish', text: '🎯 KOL with 500K followers just tweeted about $TOKEN', impact: 0.15 },
  { type: 'bullish', text: '💎 Dev just burned 10% of supply — diamond hands confirmed', impact: 0.14 },
  { type: 'bullish', text: '📣 $TOKEN trending #1 on DEX Screener!', impact: 0.20 },
  { type: 'bullish', text: '🏦 Rumor: Tier-1 CEX listing incoming for $TOKEN', impact: 0.25 },
  { type: 'bullish', text: '🤝 Partnership announcement: $TOKEN x major Solana protocol', impact: 0.16 },
  { type: 'bullish', text: '🌊 New ATH incoming — $TOKEN breaks resistance!', impact: 0.11 },
  { type: 'bearish', text: '⚠️ Insider wallets moving $TOKEN to exchanges...', impact: -0.15 },
  { type: 'bearish', text: '🔴 Dev wallet just sold 5% of $TOKEN supply', impact: -0.20 },
  { type: 'bearish', text: '😨 Whale wallet showing sell pressure on $TOKEN — dump incoming?', impact: -0.18 },
  { type: 'bearish', text: '📉 $TOKEN removed from trending on pump.fun', impact: -0.10 },
  { type: 'bearish', text: '🚨 Multiple wallets linked to $TOKEN team unlocking tokens', impact: -0.22 },
  { type: 'bearish', text: '😬 Liquidity pool showing unusual withdrawal patterns', impact: -0.12 },
  { type: 'bearish', text: '📰 Crypto journalist investigating $TOKEN tokenomics', impact: -0.08 },
  { type: 'neutral', text: '👀 $TOKEN consolidating — accumulation or distribution?', impact: 0.02 },
  { type: 'neutral', text: '🔍 On-chain analytics: 60% of $TOKEN holders in profit', impact: 0.04 },
  { type: 'neutral', text: '⏳ Market makers adjusting positions in $TOKEN', impact: -0.02 },
];

const RANDOM_EVENTS = [
  { id: 'rugpull', chance: 0.02, text: '💀 RUGPULL! Dev wallet drained the liquidity!', priceMultiplier: 0.05, type: 'catastrophe' },
  { id: 'cex_listing', chance: 0.015, text: '🏦 BREAKING: $TOKEN officially listed on Binance!', priceMultiplier: 5.0, type: 'euphoria' },
  { id: 'elon_tweet', chance: 0.02, text: '🐦 Elon Musk just tweeted about $TOKEN — CT is exploding!', priceMultiplier: 3.5, type: 'euphoria' },
  { id: 'sec_news', chance: 0.015, text: '⚖️ SEC issues statement on meme tokens — mass panic selling', priceMultiplier: 0.3, type: 'catastrophe' },
  { id: 'hack', chance: 0.015, text: '🔓 Bridge exploit — $2M drained from ecosystem', priceMultiplier: 0.45, type: 'catastrophe' },
  { id: 'massive_whale', chance: 0.025, text: '🐋 MEGA WHALE: 500 SOL buy just hit the $TOKEN order book!', priceMultiplier: 2.8, type: 'euphoria' },
  { id: 'viral_meme', chance: 0.02, text: '🦠 $TOKEN meme goes viral on X — 10M impressions!', priceMultiplier: 2.2, type: 'euphoria' },
];

const BOT_NAMES = [
  { name: 'SniperBot9000', type: 'sniper', emoji: '🎯' },
  { name: 'WhaleAlert', type: 'whale', emoji: '🐋' },
  { name: 'Degen_Dave', type: 'degen', emoji: '💊' },
  { name: 'PaperHands_Pete', type: 'paperhands', emoji: '📄' },
  { name: 'DiamondHands_Dan', type: 'diamond', emoji: '💎' },
  { name: 'FOMO_Fred', type: 'fomo', emoji: '😰' },
  { name: 'ScalperKing', type: 'sniper', emoji: '⚡' },
  { name: 'MEV_Bot', type: 'sniper', emoji: '🤖' },
  { name: 'AlphaCaller', type: 'whale', emoji: '📢' },
  { name: 'NightTrader_X', type: 'degen', emoji: '🌙' },
];

// ─── Room Management ───────────────────────────────────────────────────────────
function createRoom(hostId, maxPlayers, gameDuration, botCount) {
  const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  const token = TOKEN_POOL[Math.floor(Math.random() * TOKEN_POOL.length)];
  const room = {
    id: roomCode,
    hostId,
    maxPlayers: maxPlayers || 20,
    gameDuration: (gameDuration || 10) * 60 * 1000,
    botCount: botCount || 5,
    state: 'lobby',
    players: new Map(),
    bots: [],
    startTime: null,
    endTime: null,
    candles: [],
    currentCandle: null,
    marketCap: 10000,
    price: 0.0001,
    totalSupply: 100000000,
    tokenName: token.name,
    tokenEmoji: token.emoji,
    tokenFullName: token.fullName,
    newsHistory: [],
    lastNewsTime: 0,
    lastBotActionTime: 0,
    randomEventFired: false,
    rugpulled: false,
    countdownTimer: null,
    gameTimer: null,
    candleTimer: null,
    botTimer: null,
    newsTimer: null,
  };
  rooms.set(roomCode, room);
  return room;
}

function getPrice(marketCap, supply) {
  return marketCap / supply;
}

function addCandle(room) {
  const price = room.price;
  room.currentCandle = {
    time: Date.now(),
    open: price,
    high: price,
    low: price,
    close: price,
    volume: 0,
  };
}

function closeCandle(room) {
  if (room.currentCandle) {
    room.candles.push({ ...room.currentCandle });
    if (room.candles.length > 200) room.candles.shift();
  }
  addCandle(room);
}

function applyPriceChange(room, multiplier, volume = 0) {
  const oldMC = room.marketCap;
  room.marketCap = Math.max(100, room.marketCap * multiplier);
  room.price = getPrice(room.marketCap, room.totalSupply);

  if (room.currentCandle) {
    room.currentCandle.close = room.price;
    room.currentCandle.high = Math.max(room.currentCandle.high, room.price);
    room.currentCandle.low = Math.min(room.currentCandle.low, room.price);
    room.currentCandle.volume += volume;
  }
}

function broadcastToRoom(room, message) {
  const data = JSON.stringify(message);
  room.players.forEach((player) => {
    if (player.ws && player.ws.readyState === WebSocket.OPEN) {
      player.ws.send(data);
    }
  });
}

function getRoomState(room) {
  const players = Array.from(room.players.values()).map((p) => ({
    id: p.id,
    name: p.name,
    character: p.character,
    balance: p.balance,
    holdings: p.holdings,
    netWorth: p.balance + p.holdings * room.price,
    pnl: p.balance + p.holdings * room.price - 100,
    isHost: p.id === room.hostId,
  }));

  const bots = room.bots.map((b) => ({
    id: b.id,
    name: b.name,
    emoji: b.emoji,
    type: b.type,
    balance: b.balance,
    holdings: b.holdings,
    netWorth: b.balance + b.holdings * room.price,
  }));

  return {
    type: 'room_state',
    roomId: room.id,
    state: room.state,
    price: room.price,
    marketCap: room.marketCap,
    players,
    bots,
    candles: room.candles,
    currentCandle: room.currentCandle,
    newsHistory: room.newsHistory.slice(-20),
    startTime: room.startTime,
    endTime: room.endTime,
    rugpulled: room.rugpulled,
    tokenName: room.tokenName,
    tokenEmoji: room.tokenEmoji,
    tokenFullName: room.tokenFullName,
  };
}

function startCountdown(room) {
  room.state = 'countdown';
  let count = 5;
  broadcastToRoom(room, { type: 'countdown', count, message: 'Launch is coming...' });

  room.countdownTimer = setInterval(() => {
    count--;
    broadcastToRoom(room, { type: 'countdown', count, message: count > 0 ? 'Launch is coming...' : '🚀 LAUNCHED!' });
    if (count <= 0) {
      clearInterval(room.countdownTimer);
      startGame(room);
    }
  }, 1000);
}

function startGame(room) {
  room.state = 'playing';
  room.startTime = Date.now();
  room.endTime = room.startTime + room.gameDuration;

  // Init candles
  addCandle(room);

  // Reset player holdings
  room.players.forEach((p) => {
    p.balance = 100;
    p.holdings = 0;
    p.trades = [];
  });

  // Init bots
  const botCount = Math.min(room.botCount, BOT_NAMES.length);
  room.bots = BOT_NAMES.slice(0, botCount).map((b) => ({
    ...b,
    id: 'bot_' + uuidv4().substring(0, 8),
    balance: 100,
    holdings: 0,
  }));

  broadcastToRoom(room, { type: 'game_started', state: getRoomState(room) });

  // Candle timer — new candle every 30s
  room.candleTimer = setInterval(() => {
    if (room.state !== 'playing') return;
    closeCandle(room);
    broadcastToRoom(room, { type: 'candle_closed', candles: room.candles, currentCandle: room.currentCandle });
  }, 30000);

  // Price drift — natural organic movement every 2s
  room.driftTimer = setInterval(() => {
    if (room.state !== 'playing' || room.rugpulled) return;
    const drift = 0.995 + Math.random() * 0.015; // slight downward drift unless buys happen
    applyPriceChange(room, drift, 0);
    broadcastToRoom(room, {
      type: 'price_update',
      price: room.price,
      marketCap: room.marketCap,
      currentCandle: room.currentCandle,
    });
  }, 2000);

  // Bot actions — every 8-25 seconds
  scheduleBotAction(room);

  // News — every 45-90 seconds
  scheduleNews(room);

  // Random events — check every 30s
  room.randomEventTimer = setInterval(() => {
    if (room.state !== 'playing' || room.rugpulled) return;
    checkRandomEvents(room);
  }, 30000);

  // Game end timer
  room.gameTimer = setTimeout(() => {
    endGame(room);
  }, room.gameDuration);
}

function scheduleBotAction(room) {
  if (room.state !== 'playing') return;
  const delay = 8000 + Math.random() * 17000;
  room.botActionTimeout = setTimeout(() => {
    if (room.state !== 'playing' || room.rugpulled) return;
    executeBotAction(room);
    scheduleBotAction(room);
  }, delay);
}

function executeBotAction(room) {
  if (!room.bots.length) return;
  const bot = room.bots[Math.floor(Math.random() * room.bots.length)];

  let action, amount, multiplier, volume;

  if (bot.type === 'sniper') {
    // Snipers do small fast buys/sells
    if (bot.holdings === 0 || Math.random() < 0.6) {
      amount = 2 + Math.random() * 8;
      if (bot.balance >= amount) {
        const tokensToGet = (amount / room.price);
        bot.holdings += tokensToGet;
        bot.balance -= amount;
        multiplier = 1 + (amount / room.marketCap) * 2;
        volume = amount;
        action = 'buy';
      }
    } else {
      const sellTokens = bot.holdings * (0.3 + Math.random() * 0.5);
      const proceeds = sellTokens * room.price;
      bot.holdings -= sellTokens;
      bot.balance += proceeds;
      multiplier = 1 - (proceeds / room.marketCap) * 1.5;
      volume = proceeds;
      action = 'sell';
    }
  } else if (bot.type === 'whale') {
    // Whales do big buys, rare sells
    if (Math.random() < 0.65 && bot.balance >= 15) {
      amount = 15 + Math.random() * 30;
      amount = Math.min(amount, bot.balance);
      const tokensToGet = (amount / room.price);
      bot.holdings += tokensToGet;
      bot.balance -= amount;
      multiplier = 1 + (amount / room.marketCap) * 3;
      volume = amount;
      action = 'buy';
    } else if (bot.holdings > 0) {
      const sellTokens = bot.holdings * 0.4;
      const proceeds = sellTokens * room.price;
      bot.holdings -= sellTokens;
      bot.balance += proceeds;
      multiplier = 1 - (proceeds / room.marketCap) * 2.5;
      volume = proceeds;
      action = 'sell';
    }
  } else if (bot.type === 'fomo') {
    // FOMO bots buy when price is going up
    if (Math.random() < 0.75 && bot.balance >= 5) {
      amount = 5 + Math.random() * 20;
      amount = Math.min(amount, bot.balance);
      const tokensToGet = (amount / room.price);
      bot.holdings += tokensToGet;
      bot.balance -= amount;
      multiplier = 1 + (amount / room.marketCap) * 2.5;
      volume = amount;
      action = 'buy';
    }
  } else if (bot.type === 'paperhands') {
    // Paperhands sell early
    if (bot.holdings > 0 && Math.random() < 0.7) {
      const sellTokens = bot.holdings * (0.5 + Math.random() * 0.5);
      const proceeds = sellTokens * room.price;
      bot.holdings -= sellTokens;
      bot.balance += proceeds;
      multiplier = 1 - (proceeds / room.marketCap) * 1.8;
      volume = proceeds;
      action = 'sell';
    } else if (bot.balance >= 5) {
      amount = 5 + Math.random() * 10;
      amount = Math.min(amount, bot.balance);
      const tokensToGet = (amount / room.price);
      bot.holdings += tokensToGet;
      bot.balance -= amount;
      multiplier = 1 + (amount / room.marketCap) * 2;
      volume = amount;
      action = 'buy';
    }
  } else {
    // Degen — random aggressive
    if (Math.random() < 0.6 && bot.balance >= 5) {
      amount = bot.balance * (0.3 + Math.random() * 0.5);
      const tokensToGet = (amount / room.price);
      bot.holdings += tokensToGet;
      bot.balance -= amount;
      multiplier = 1 + (amount / room.marketCap) * 2;
      volume = amount;
      action = 'buy';
    } else if (bot.holdings > 0) {
      const sellTokens = bot.holdings * (0.2 + Math.random() * 0.8);
      const proceeds = sellTokens * room.price;
      bot.holdings -= sellTokens;
      bot.balance += proceeds;
      multiplier = 1 - (proceeds / room.marketCap) * 1.5;
      volume = proceeds;
      action = 'sell';
    }
  }

  if (action && multiplier) {
    applyPriceChange(room, multiplier, volume || 0);
    broadcastToRoom(room, {
      type: 'bot_action',
      botName: bot.name,
      botEmoji: bot.emoji,
      botType: bot.type,
      action,
      amount: amount ? parseFloat(amount.toFixed(2)) : parseFloat((volume || 0).toFixed(2)),
      price: room.price,
      marketCap: room.marketCap,
      currentCandle: room.currentCandle,
    });
  }
}

function scheduleNews(room) {
  if (room.state !== 'playing') return;
  const delay = 45000 + Math.random() * 45000;
  room.newsTimeout = setTimeout(() => {
    if (room.state !== 'playing' || room.rugpulled) return;
    fireNews(room);
    scheduleNews(room);
  }, delay);
}

function fireNews(room) {
  const raw = NEWS_POOL[Math.floor(Math.random() * NEWS_POOL.length)];
  const item = { ...raw, text: raw.text.replace(/\$TOKEN/g, '$' + room.tokenName) };
  const newsEntry = {
    id: uuidv4().substring(0, 8),
    time: Date.now(),
    ...item,
  };
  room.newsHistory.push(newsEntry);

  // Apply news price impact
  const multiplier = 1 + (item.impact * (0.5 + Math.random()));
  applyPriceChange(room, multiplier, Math.abs(item.impact) * room.marketCap * 0.1);

  broadcastToRoom(room, {
    type: 'news',
    news: newsEntry,
    price: room.price,
    marketCap: room.marketCap,
    currentCandle: room.currentCandle,
  });
}

function checkRandomEvents(room) {
  for (const event of RANDOM_EVENTS) {
    if (Math.random() < event.chance) {
      triggerRandomEvent(room, event);
      return; // Only one per check
    }
  }
}

function triggerRandomEvent(room, event) {
  if (event.id === 'rugpull') {
    room.rugpulled = true;
    room.state = 'playing';
  }

  applyPriceChange(room, event.priceMultiplier, room.marketCap * 0.2);

  if (event.id === 'rugpull') {
    room.players.forEach((p) => { p.holdings = 0; });
    room.bots.forEach((b) => { b.holdings = 0; });
  }

  const eventText = event.text.replace(/\$TOKEN/g, '$' + room.tokenName);

  broadcastToRoom(room, {
    type: 'random_event',
    event: { id: event.id, text: eventText, type: event.type },
    price: room.price,
    marketCap: room.marketCap,
    currentCandle: room.currentCandle,
    rugpulled: room.rugpulled,
  });

  if (event.id === 'rugpull') {
    setTimeout(() => endGame(room), 8000);
  }
}

function endGame(room) {
  if (room.state === 'ended') return;
  room.state = 'ended';

  clearInterval(room.driftTimer);
  clearInterval(room.candleTimer);
  clearInterval(room.randomEventTimer);
  clearTimeout(room.botActionTimeout);
  clearTimeout(room.newsTimeout);
  clearTimeout(room.gameTimer);

  // Close final candle
  if (room.currentCandle) room.candles.push({ ...room.currentCandle });

  const leaderboard = Array.from(room.players.values())
    .map((p) => ({
      id: p.id,
      name: p.name,
      character: p.character,
      finalBalance: p.balance,
      finalHoldings: p.holdings,
      finalPrice: room.price,
      netWorth: parseFloat((p.balance + p.holdings * room.price).toFixed(2)),
      pnl: parseFloat((p.balance + p.holdings * room.price - 100).toFixed(2)),
      pnlPct: parseFloat(((p.balance + p.holdings * room.price - 100)).toFixed(2)),
    }))
    .sort((a, b) => b.netWorth - a.netWorth);

  broadcastToRoom(room, {
    type: 'game_ended',
    leaderboard,
    finalPrice: room.price,
    finalMarketCap: room.marketCap,
    rugpulled: room.rugpulled,
    candles: room.candles,
  });
}

// ─── WebSocket Handlers ────────────────────────────────────────────────────────
wss.on('connection', (ws) => {
  let playerId = uuidv4();
  let currentRoom = null;

  ws.on('message', (data) => {
    let msg;
    try { msg = JSON.parse(data); } catch { return; }

    switch (msg.type) {
      case 'create_room': {
        const room = createRoom(playerId, msg.maxPlayers, msg.gameDuration, msg.botCount);
        const player = {
          id: playerId,
          ws,
          name: msg.playerName || 'Host',
          character: msg.character || 'satoshi',
          balance: 100,
          holdings: 0,
          trades: [],
        };
        room.players.set(playerId, player);
        currentRoom = room;
        ws.send(JSON.stringify({ type: 'room_created', roomCode: room.id, playerId, state: getRoomState(room) }));
        break;
      }

      case 'join_room': {
        const room = rooms.get(msg.roomCode?.toUpperCase());
        if (!room) { ws.send(JSON.stringify({ type: 'error', message: 'Room not found' })); return; }
        if (room.state !== 'lobby') { ws.send(JSON.stringify({ type: 'error', message: 'Game already in progress' })); return; }
        if (room.players.size >= room.maxPlayers) { ws.send(JSON.stringify({ type: 'error', message: 'Room is full' })); return; }

        const player = {
          id: playerId,
          ws,
          name: msg.playerName || `Player${room.players.size + 1}`,
          character: msg.character || 'satoshi',
          balance: 100,
          holdings: 0,
          trades: [],
        };
        room.players.set(playerId, player);
        currentRoom = room;
        ws.send(JSON.stringify({ type: 'room_joined', roomCode: room.id, playerId, state: getRoomState(room) }));
        broadcastToRoom(room, { type: 'player_joined', playerName: player.name, playerCount: room.players.size, state: getRoomState(room) });
        break;
      }

      case 'start_game': {
        if (!currentRoom || currentRoom.hostId !== playerId) return;
        if (currentRoom.state !== 'lobby') return;
        startCountdown(currentRoom);
        break;
      }

      case 'start_singleplayer': {
        const room = createRoom(playerId, 1, msg.gameDuration || 10, msg.botCount || 8);
        const player = {
          id: playerId,
          ws,
          name: msg.playerName || 'Player',
          character: msg.character || 'satoshi',
          balance: 100,
          holdings: 0,
          trades: [],
        };
        room.players.set(playerId, player);
        currentRoom = room;
        ws.send(JSON.stringify({ type: 'room_created', roomCode: room.id, playerId, isSingleplayer: true, state: getRoomState(room) }));
        startCountdown(room);
        break;
      }

      case 'buy': {
        if (!currentRoom || currentRoom.state !== 'playing' || currentRoom.rugpulled) return;
        const player = currentRoom.players.get(playerId);
        if (!player) return;
        const usdAmount = parseFloat(msg.amount) || 10;
        if (usdAmount > player.balance || usdAmount <= 0) {
          ws.send(JSON.stringify({ type: 'error', message: 'Insufficient balance' }));
          return;
        }
        const tokensReceived = usdAmount / currentRoom.price;
        player.balance -= usdAmount;
        player.holdings += tokensReceived;
        player.trades.push({ type: 'buy', amount: usdAmount, price: currentRoom.price, time: Date.now() });

        // Price impact
        const multiplier = 1 + (usdAmount / currentRoom.marketCap) * 2.5;
        applyPriceChange(currentRoom, multiplier, usdAmount);

        broadcastToRoom(currentRoom, {
          type: 'trade',
          tradeType: 'buy',
          playerName: player.name,
          character: player.character,
          amount: usdAmount,
          tokens: tokensReceived,
          price: currentRoom.price,
          marketCap: currentRoom.marketCap,
          currentCandle: currentRoom.currentCandle,
        });

        ws.send(JSON.stringify({
          type: 'trade_confirmed',
          tradeType: 'buy',
          balance: player.balance,
          holdings: player.holdings,
          price: currentRoom.price,
          marketCap: currentRoom.marketCap,
          currentCandle: currentRoom.currentCandle,
        }));
        break;
      }

      case 'sell': {
        if (!currentRoom || currentRoom.state !== 'playing') return;
        const player = currentRoom.players.get(playerId);
        if (!player || player.holdings <= 0) {
          ws.send(JSON.stringify({ type: 'error', message: 'No tokens to sell' }));
          return;
        }
        const sellPct = parseFloat(msg.pct) || 1.0;
        const tokensToSell = player.holdings * sellPct;
        const usdReceived = tokensToSell * currentRoom.price;

        player.holdings -= tokensToSell;
        player.balance += usdReceived;
        player.trades.push({ type: 'sell', amount: usdReceived, price: currentRoom.price, time: Date.now() });

        const multiplier = 1 - (usdReceived / currentRoom.marketCap) * 2;
        applyPriceChange(currentRoom, Math.max(0.5, multiplier), usdReceived);

        broadcastToRoom(currentRoom, {
          type: 'trade',
          tradeType: 'sell',
          playerName: player.name,
          character: player.character,
          amount: usdReceived,
          price: currentRoom.price,
          marketCap: currentRoom.marketCap,
          currentCandle: currentRoom.currentCandle,
        });

        ws.send(JSON.stringify({
          type: 'trade_confirmed',
          tradeType: 'sell',
          balance: player.balance,
          holdings: player.holdings,
          price: currentRoom.price,
          marketCap: currentRoom.marketCap,
          currentCandle: currentRoom.currentCandle,
        }));
        break;
      }

      case 'ping': {
        ws.send(JSON.stringify({ type: 'pong' }));
        break;
      }
    }
  });

  ws.on('close', () => {
    if (currentRoom) {
      currentRoom.players.delete(playerId);
      broadcastToRoom(currentRoom, {
        type: 'player_left',
        playerCount: currentRoom.players.size,
        state: getRoomState(currentRoom),
      });
      if (currentRoom.players.size === 0 && currentRoom.state !== 'playing') {
        rooms.delete(currentRoom.id);
      }
    }
  });

  ws.send(JSON.stringify({ type: 'connected', playerId }));
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🎮 RUG FUN server running on port ${PORT}`);
});
