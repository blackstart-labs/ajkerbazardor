type Palette = {
  bg: string;
  paint: string;
  ink: string;
  accent: string;
  shape: string;
};

const palettes: Record<string, Palette> = {
  onion: { bg: '#fff1f2', paint: '#fb7185', ink: '#7f1d1d', accent: '#be123c', shape: '🧅' },
  chilli: { bg: '#f0fdf4', paint: '#22c55e', ink: '#14532d', accent: '#dc2626', shape: '🌶️' },
  tomato: { bg: '#fff7ed', paint: '#fb923c', ink: '#7c2d12', accent: '#dc2626', shape: '🍅' },
  potato: { bg: '#fffbeb', paint: '#f59e0b', ink: '#78350f', accent: '#92400e', shape: '🥔' },
  rice: { bg: '#fffbeb', paint: '#fbbf24', ink: '#713f12', accent: '#fef3c7', shape: '🍚' },
  oil: { bg: '#fefce8', paint: '#facc15', ink: '#713f12', accent: '#ca8a04', shape: '🛢️' },
  egg: { bg: '#fff7ed', paint: '#fed7aa', ink: '#7c2d12', accent: '#ffffff', shape: '🥚' },
  fish: { bg: '#eff6ff', paint: '#38bdf8', ink: '#0c4a6e', accent: '#0284c7', shape: '🐟' },
  meat: { bg: '#fff1f2', paint: '#fb7185', ink: '#7f1d1d', accent: '#be123c', shape: '🥩' },
  greens: { bg: '#ecfdf5', paint: '#34d399', ink: '#064e3b', accent: '#16a34a', shape: '🥬' },
  spice: { bg: '#fff7ed', paint: '#f97316', ink: '#7c2d12', accent: '#b45309', shape: '✦' },
  dal: { bg: '#fef3c7', paint: '#f59e0b', ink: '#78350f', accent: '#fde68a', shape: '●' },
  milk: { bg: '#f8fafc', paint: '#cbd5e1', ink: '#334155', accent: '#0f766e', shape: '🥛' },
  sugar: { bg: '#f8fafc', paint: '#e2e8f0', ink: '#334155', accent: '#f59e0b', shape: '▦' },
  paper: { bg: '#f8fafc', paint: '#bae6fd', ink: '#0f172a', accent: '#0f766e', shape: '▤' },
  rod: { bg: '#f1f5f9', paint: '#94a3b8', ink: '#0f172a', accent: '#b91c1c', shape: '▥' },
  basket: { bg: '#faf7f2', paint: '#f59e0b', ink: '#064e3b', accent: '#dc2626', shape: '🧺' },
};

function keyForProduct(nameBn: string) {
  if (/পিঁয়াজ|পেঁয়াজ|পেঁয়াজ/.test(nameBn)) return 'onion';
  if (/মরিচ/.test(nameBn)) return 'chilli';
  if (/টমেটো/.test(nameBn)) return 'tomato';
  if (/আলু/.test(nameBn)) return 'potato';
  if (/চাল|চিনি/.test(nameBn)) return nameBn.includes('চিনি') ? 'sugar' : 'rice';
  if (/তেল|অয়েল|অয়েল/.test(nameBn)) return 'oil';
  if (/ডিম/.test(nameBn)) return 'egg';
  if (/রুই|ইলিশ|মাছ/.test(nameBn)) return 'fish';
  if (/গরু|খাসী|মুরগী|মাংস|গোশত/.test(nameBn)) return 'meat';
  if (/শসা|বেগুন|লেবু|ধনে|তেজপাতা/.test(nameBn)) return 'greens';
  if (/ডাল|ছোলা/.test(nameBn)) return 'dal';
  if (/দুধ|ডানো|ডিপ্লোমা|ফ্রেশ|মার্কস/.test(nameBn)) return 'milk';
  if (/কাগজ/.test(nameBn)) return 'paper';
  if (/রড/.test(nameBn)) return 'rod';
  if (/রসুন|আদা|জিরা|দারুচিনি|লবঙ্গ|এলাচ|হলুদ|মসলা|খেজুর|লবণ/.test(nameBn)) return 'spice';
  return 'basket';
}

export function productArtDataUri(nameBn: string) {
  const palette = palettes[keyForProduct(nameBn)] ?? palettes['basket'];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="420" viewBox="0 0 640 420" role="img" aria-label="${nameBn}">
  <rect width="640" height="420" rx="34" fill="${palette.bg}"/>
  <path d="M44 273C116 167 205 105 313 93c112-13 204 23 283 106-55 19-104 47-148 83-69 56-152 80-250 72-64-5-115-32-154-81Z" fill="${palette.paint}" opacity=".28"/>
  <path d="M78 311c88-69 181-108 279-117 73-7 140 4 202 31" fill="none" stroke="${palette.accent}" stroke-width="20" stroke-linecap="round" opacity=".55"/>
  <text x="320" y="236" text-anchor="middle" font-size="132" font-family="Noto Color Emoji, Apple Color Emoji, Segoe UI Emoji">${palette.shape}</text>
  <path d="M158 318c66 29 172 34 318 14" fill="none" stroke="${palette.ink}" stroke-width="9" stroke-linecap="round" opacity=".85"/>
  <path d="M96 86c54-20 112-23 174-9M420 83c46 8 82 24 108 47" fill="none" stroke="${palette.ink}" stroke-width="11" stroke-linecap="round" opacity=".16"/>
  <circle cx="548" cy="103" r="22" fill="#facc15" stroke="${palette.ink}" stroke-width="5"/>
  <text x="548" y="113" text-anchor="middle" font-size="32" font-weight="800" font-family="Inter, sans-serif" fill="${palette.ink}">৳</text>
</svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}
