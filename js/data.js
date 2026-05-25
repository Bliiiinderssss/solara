/* ── SOLARA — Persistent Data Layer (localStorage) ── */

const DEFAULT_PROPERTIES = [
  {
    id: 1, name: "Villa Andalucía", location: "Marbella, Andalousie", region: "marbella",
    price: 420, rating: 4.97, reviews: 64, beds: 5, baths: 4, guests: 10,
    badge: "Coup de cœur", type: "Villa",
    img: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80",
    imgs: ["https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80","https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&q=80","https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200&q=80","https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=80"],
    description: "Majestueuse villa avec piscine à débordement et vue imprenable sur la mer Méditerranée. Entièrement rénovée en 2023, elle allie tradition andalouse et modernité.",
    amenities: ["Piscine privée","WiFi fibre","Climatisation","Parking","Barbecue","Jacuzzi","Vue mer","Lave-linge","TV 4K"],
  },
  {
    id: 2, name: "Penthouse Barceloneta", location: "Barcelone, Catalogne", region: "barcelone",
    price: 280, rating: 4.92, reviews: 118, beds: 3, baths: 2, guests: 6,
    badge: "Nouveauté", type: "Penthouse",
    img: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80",
    imgs: ["https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=1200&q=80","https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80","https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&q=80"],
    description: "Penthouse d'exception au cœur du quartier de la Barceloneta. Grande terrasse panoramique avec vue à 360° sur la ville et la mer.",
    amenities: ["Terrasse panoramique","WiFi fibre","Climatisation","Vue mer","Lave-linge","TV 4K","Parking souterrain"],
  },
  {
    id: 3, name: "Mas Provençal Ibiza", location: "Santa Eulalia, Ibiza", region: "ibiza",
    price: 595, rating: 5.0, reviews: 29, beds: 6, baths: 5, guests: 12,
    badge: "Exclusif", type: "Mas",
    img: "https://images.unsplash.com/photo-1601628828688-632f38a5a7d0?w=800&q=80",
    imgs: ["https://images.unsplash.com/photo-1601628828688-632f38a5a7d0?w=1200&q=80","https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1200&q=80","https://images.unsplash.com/photo-1464146072230-91cabc968266?w=1200&q=80"],
    description: "Mas traditionnel baigné de lumière méditerranéenne, niché dans les collines d'Ibiza. Domaine privé de 2 hectares, piscine naturelle, potager bio.",
    amenities: ["Piscine naturelle","Potager bio","WiFi satellite","Salle de sport","Spa","Parking","Barbecue","Vélos inclus","Vue panoramique"],
  },
  {
    id: 4, name: "Casa Azul Valencia", location: "Valence, Communauté valencienne", region: "valence",
    price: 185, rating: 4.88, reviews: 94, beds: 2, baths: 1, guests: 4,
    badge: "Populaire", type: "Maison",
    img: "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800&q=80",
    imgs: ["https://images.unsplash.com/photo-1554995207-c18c203602cb?w=1200&q=80","https://images.unsplash.com/photo-1505691723518-36a5ac3be353?w=1200&q=80"],
    description: "Maison de charme au cœur de l'Eixample de Valence. Décoration soignée mêlant azulejos traditionnels et mobilier contemporain.",
    amenities: ["Patio fleuri","WiFi","Climatisation","Terrasse","Lave-linge","TV"],
  },
  {
    id: 5, name: "Finca Ronda", location: "Ronda, Andalousie", region: "marbella",
    price: 340, rating: 4.95, reviews: 41, beds: 4, baths: 3, guests: 8,
    badge: "Vue exceptionnelle", type: "Finca",
    img: "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=800&q=80",
    imgs: ["https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=1200&q=80"],
    description: "Finca historique surplombant les gorges spectaculaires de Ronda. Rénovée avec goût, elle conserve l'âme andalouse tout en offrant tout le confort moderne.",
    amenities: ["Vue gorges","Piscine","WiFi","Climatisation","Cuisine équipée","Barbecue"],
  },
  {
    id: 6, name: "Apartamento Mar Menor", location: "Murcie, Côte méridionale", region: "valence",
    price: 145, rating: 4.81, reviews: 203, beds: 1, baths: 1, guests: 2,
    badge: "Meilleur rapport", type: "Appartement",
    img: "https://images.unsplash.com/photo-1501183638710-841dd1904471?w=800&q=80",
    imgs: ["https://images.unsplash.com/photo-1501183638710-841dd1904471?w=1200&q=80"],
    description: "Appartement cosy en première ligne de plage sur la lagune du Mar Menor. Idéal pour un séjour en duo, avec accès direct à la plage.",
    amenities: ["Bord de mer","WiFi","Climatisation","Terrasse","TV"],
  },
];

const DEFAULT_RESERVATIONS = [];

/* ── Storage keys ── */
const _KEY_PROPS = 'solara_properties';
const _KEY_RES   = 'solara_reservations';
const _KEY_ID    = 'solara_next_id';

function _load(key, defaults) {
  try { const r = localStorage.getItem(key); if (r) return JSON.parse(r); } catch(e) {}
  return JSON.parse(JSON.stringify(defaults));
}
function _persist(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch(e) {}
}
function _nextId() {
  const max = PROPERTIES.reduce((m,p) => Math.max(m, p.id), 0);
  const stored = parseInt(localStorage.getItem(_KEY_ID) || '0');
  const next = Math.max(max, stored) + 1;
  localStorage.setItem(_KEY_ID, String(next));
  return next;
}

/* ── Live arrays ── */
var PROPERTIES   = _load(_KEY_PROPS, DEFAULT_PROPERTIES);
var RESERVATIONS = _load(_KEY_RES,   DEFAULT_RESERVATIONS);

/* ── Cross-tab & same-page sync ── */
const _KEY_VERSION = 'solara_version';
var _solaraChannel = null;
try { _solaraChannel = new BroadcastChannel('solara_sync'); } catch(e) {}

function _notifyChange(action) {
  var v = parseInt(localStorage.getItem(_KEY_VERSION) || '0') + 1;
  localStorage.setItem(_KEY_VERSION, String(v));
  var msg = { action: action, version: v };
  if (_solaraChannel) try { _solaraChannel.postMessage(msg); } catch(e) {}
  window.dispatchEvent(new CustomEvent('solara-change', { detail: msg }));
}

/* Current version for polling comparison */
var _lastKnownVersion = parseInt(localStorage.getItem(_KEY_VERSION) || '0');

/**
 * Listen for property/reservation changes (cross-tab + same-page).
 * callback(action) is called when data changes.
 */
function onDataChange(callback) {
  /* Same-page custom event */
  window.addEventListener('solara-change', function(e) { callback(e.detail.action); });

  /* Cross-tab: BroadcastChannel (works on http/https) */
  if (_solaraChannel) {
    _solaraChannel.addEventListener('message', function(e) {
      PROPERTIES   = _load(_KEY_PROPS, DEFAULT_PROPERTIES);
      RESERVATIONS = _load(_KEY_RES,   DEFAULT_RESERVATIONS);
      window.PROPERTIES   = PROPERTIES;
      window.RESERVATIONS = RESERVATIONS;
      _lastKnownVersion = e.data.version;
      callback(e.data.action);
    });
  }

  /* Cross-tab: storage event fallback */
  window.addEventListener('storage', function(e) {
    if (e.key === _KEY_PROPS || e.key === _KEY_RES || e.key === _KEY_VERSION) {
      PROPERTIES   = _load(_KEY_PROPS, DEFAULT_PROPERTIES);
      RESERVATIONS = _load(_KEY_RES,   DEFAULT_RESERVATIONS);
      window.PROPERTIES   = PROPERTIES;
      window.RESERVATIONS = RESERVATIONS;
      _lastKnownVersion = parseInt(localStorage.getItem(_KEY_VERSION) || '0');
      callback('sync');
    }
  });

  /* Fallback polling for file:// protocol (every 2s) */
  setInterval(function() {
    var current = parseInt(localStorage.getItem(_KEY_VERSION) || '0');
    if (current !== _lastKnownVersion) {
      _lastKnownVersion = current;
      PROPERTIES   = _load(_KEY_PROPS, DEFAULT_PROPERTIES);
      RESERVATIONS = _load(_KEY_RES,   DEFAULT_RESERVATIONS);
      window.PROPERTIES   = PROPERTIES;
      window.RESERVATIONS = RESERVATIONS;
      callback('poll-sync');
    }
  }, 2000);

  /* Visibility change — refresh when tab becomes visible */
  document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'visible') {
      var current = parseInt(localStorage.getItem(_KEY_VERSION) || '0');
      if (current !== _lastKnownVersion) {
        _lastKnownVersion = current;
        PROPERTIES   = _load(_KEY_PROPS, DEFAULT_PROPERTIES);
        RESERVATIONS = _load(_KEY_RES,   DEFAULT_RESERVATIONS);
        window.PROPERTIES   = PROPERTIES;
        window.RESERVATIONS = RESERVATIONS;
        callback('visibility-sync');
      }
    }
  });
}

/* ══ PROPERTIES CRUD ══ */
function addProperty(data) {
  const fallback = 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80';
  const imgUrl = (data.img && data.img.trim()) ? data.img.trim() : fallback;
  const prop = {
    id:          _nextId(),
    name:        data.name        || 'Nouvelle propriété',
    location:    data.location    || '',
    region:      data.region      || 'autre',
    price:       Number(data.price)  || 0,
    rating:      Number(data.rating) || 5.0,
    reviews:     0,
    beds:        Number(data.beds)   || 1,
    baths:       Number(data.baths)  || 1,
    guests:      Number(data.guests) || 2,
    badge:       data.badge       || 'Nouveau',
    type:        data.type        || 'Villa',
    description: data.description || '',
    amenities:   typeof data.amenities === 'string'
                   ? data.amenities.split(',').map(s=>s.trim()).filter(Boolean)
                   : (data.amenities || []),
    img:  imgUrl,
    imgs: (data.imgs && data.imgs.length) ? data.imgs : [imgUrl],
  };
  PROPERTIES.push(prop);
  _persist(_KEY_PROPS, PROPERTIES);
  window.PROPERTIES = PROPERTIES;
  _notifyChange('property-added');
  return prop;
}

function updateProperty(id, data) {
  const idx = PROPERTIES.findIndex(p => p.id === id);
  if (idx === -1) return null;
  if (typeof data.amenities === 'string') {
    data.amenities = data.amenities.split(',').map(s=>s.trim()).filter(Boolean);
  }
  if (data.price)  data.price  = Number(data.price);
  if (data.beds)   data.beds   = Number(data.beds);
  if (data.baths)  data.baths  = Number(data.baths);
  if (data.guests) data.guests = Number(data.guests);
  PROPERTIES[idx] = { ...PROPERTIES[idx], ...data, id };
  if (data.imgs && data.imgs.length) {
    PROPERTIES[idx].imgs = data.imgs;
    PROPERTIES[idx].img = data.imgs[0];
  } else if (data.img) {
    PROPERTIES[idx].imgs = [data.img, ...(PROPERTIES[idx].imgs.slice(1))];
  }
  _persist(_KEY_PROPS, PROPERTIES);
  window.PROPERTIES = PROPERTIES;
  _notifyChange('property-updated');
  return PROPERTIES[idx];
}

function deleteProperty(id) {
  const before = PROPERTIES.length;
  PROPERTIES = PROPERTIES.filter(p => p.id !== id);
  if (PROPERTIES.length < before) {
    _persist(_KEY_PROPS, PROPERTIES);
    window.PROPERTIES = PROPERTIES;
    _notifyChange('property-deleted');
    return true;
  }
  return false;
}

function getProperty(id) { return PROPERTIES.find(p => p.id === id) || null; }

/* ══ RESERVATIONS CRUD ══ */
function addReservation(data) {
  const res = { id:'R'+String(Date.now()).slice(-6), paid:false, status:'pending', ...data };
  RESERVATIONS.push(res);
  _persist(_KEY_RES, RESERVATIONS);
  window.RESERVATIONS = RESERVATIONS;
  _notifyChange('reservation-added');
  return res;
}
function updateReservation(id, data) {
  const idx = RESERVATIONS.findIndex(r => r.id === id);
  if (idx === -1) return null;
  RESERVATIONS[idx] = { ...RESERVATIONS[idx], ...data, id };
  _persist(_KEY_RES, RESERVATIONS);
  window.RESERVATIONS = RESERVATIONS;
  _notifyChange('reservation-updated');
  return RESERVATIONS[idx];
}
function deleteReservation(id) {
  const before = RESERVATIONS.length;
  RESERVATIONS = RESERVATIONS.filter(r => r.id !== id);
  if (RESERVATIONS.length < before) { _persist(_KEY_RES, RESERVATIONS); window.RESERVATIONS = RESERVATIONS; _notifyChange('reservation-deleted'); return true; }
  return false;
}

/* Reset to factory defaults */
function resetToDefaults() {
  if (!confirm('Remettre toutes les propriétés et réservations par défaut ?')) return;
  localStorage.removeItem(_KEY_PROPS);
  localStorage.removeItem(_KEY_RES);
  localStorage.removeItem(_KEY_ID);
  PROPERTIES   = JSON.parse(JSON.stringify(DEFAULT_PROPERTIES));
  RESERVATIONS = JSON.parse(JSON.stringify(DEFAULT_RESERVATIONS));
  location.reload();
}

/* Expose globals */
window.PROPERTIES        = PROPERTIES;
window.RESERVATIONS      = RESERVATIONS;
/* ══ SEASONAL PRICING ══ */

const _KEY_SEASONS = 'solara_seasons';

/**
 * Default season definitions (shared across all properties).
 * Each property stores a multiplier per season. Dates are MM-DD format.
 * Seasons are evaluated in order — first match wins.
 */
const DEFAULT_SEASONS = [
  { id: 'high',   name: 'Haute saison',    from: '06-15', to: '09-15', color: '#C4714A' },
  { id: 'mid',    name: 'Moyenne saison',   from: '04-01', to: '06-14', color: '#C49A4A' },
  { id: 'mid2',   name: 'Moyenne saison 2', from: '09-16', to: '10-31', color: '#C49A4A' },
  { id: 'low',    name: 'Basse saison',     from: '11-01', to: '03-31', color: '#4A7B5C' },
];

function getSeasons() {
  try {
    const raw = localStorage.getItem(_KEY_SEASONS);
    if (raw) return JSON.parse(raw);
  } catch(e) {}
  return JSON.parse(JSON.stringify(DEFAULT_SEASONS));
}

function saveSeasons(seasons) {
  localStorage.setItem(_KEY_SEASONS, JSON.stringify(seasons));
  _notifyChange('seasons-updated');
}

/**
 * Get the price per night for a property on a given date.
 * Uses property.seasons (map of season_id → price) if set, else property.price.
 */
function getSeasonalPrice(prop, dateStr) {
  if (!prop) return 0;
  const seasons = getSeasons();
  const propSeasons = prop.seasons || {};
  const mmdd = dateStr ? dateStr.slice(5) : null; /* MM-DD */

  if (mmdd && seasons.length) {
    for (let i = 0; i < seasons.length; i++) {
      const s = seasons[i];
      if (isDateInSeason(mmdd, s.from, s.to)) {
        if (propSeasons[s.id] !== undefined && propSeasons[s.id] !== null && propSeasons[s.id] !== '') {
          return Number(propSeasons[s.id]);
        }
        break;
      }
    }
  }
  return prop.price;
}

/**
 * Calculate total for a stay with per-night seasonal pricing.
 */
function calcSeasonalTotal(prop, checkin, checkout) {
  if (!prop || !checkin || !checkout) return { nights: 0, base: 0, fees: 0, total: 0, perNight: [] };
  const start = new Date(checkin);
  const end = new Date(checkout);
  const perNight = [];
  let base = 0;
  const d = new Date(start);
  while (d < end) {
    const ds = d.toISOString().split('T')[0];
    const price = getSeasonalPrice(prop, ds);
    perNight.push({ date: ds, price });
    base += price;
    d.setDate(d.getDate() + 1);
  }
  const nights = perNight.length;
  const fees = Math.round(base * 0.12);
  return { nights, base, fees, total: base + fees, perNight };
}

function isDateInSeason(mmdd, from, to) {
  /* Handle wrap-around (e.g., Nov 01 → Mar 31) */
  if (from <= to) {
    return mmdd >= from && mmdd <= to;
  } else {
    return mmdd >= from || mmdd <= to;
  }
}

function getSeasonForDate(dateStr) {
  const seasons = getSeasons();
  const mmdd = dateStr ? dateStr.slice(5) : null;
  if (!mmdd) return null;
  for (let i = 0; i < seasons.length; i++) {
    if (isDateInSeason(mmdd, seasons[i].from, seasons[i].to)) return seasons[i];
  }
  return null;
}

window.addProperty       = addProperty;
window.updateProperty    = updateProperty;
window.deleteProperty    = deleteProperty;
window.getProperty       = getProperty;
window.addReservation    = addReservation;
window.updateReservation = updateReservation;
window.deleteReservation = deleteReservation;
window.resetToDefaults   = resetToDefaults;
window.onDataChange      = onDataChange;
/* ══ DEPOSIT / ACOMPTE SYSTEM ══ */

const _KEY_DEPOSIT = 'solara_deposit';

/**
 * Deposit config: { enabled: bool, percentage: number (0-100) }
 * When enabled, clients pay only the deposit percentage at booking.
 */
function getDepositConfig() {
  try {
    const raw = localStorage.getItem(_KEY_DEPOSIT);
    if (raw) return JSON.parse(raw);
  } catch(e) {}
  return { enabled: false, percentage: 30 };
}

function saveDepositConfig(config) {
  localStorage.setItem(_KEY_DEPOSIT, JSON.stringify(config));
  _notifyChange('deposit-updated');
}

/**
 * Calculate the amount to charge at booking.
 * Returns { chargeAmount, isDeposit, depositPercent, remainingAmount }
 */
function calcDepositAmount(totalAmount) {
  const cfg = getDepositConfig();
  if (!cfg.enabled || cfg.percentage >= 100) {
    return { chargeAmount: totalAmount, isDeposit: false, depositPercent: 100, remainingAmount: 0 };
  }
  const charge = Math.round(totalAmount * cfg.percentage / 100);
  return { chargeAmount: charge, isDeposit: true, depositPercent: cfg.percentage, remainingAmount: totalAmount - charge };
}

window.getDepositConfig  = getDepositConfig;
window.saveDepositConfig = saveDepositConfig;
window.calcDepositAmount = calcDepositAmount;
window.getSeasons        = getSeasons;
window.saveSeasons       = saveSeasons;
window.getSeasonalPrice  = getSeasonalPrice;
window.calcSeasonalTotal = calcSeasonalTotal;
window.getSeasonForDate  = getSeasonForDate;
