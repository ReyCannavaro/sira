export interface BadgeDef {
  slug:        string
  name:        string
  description: string
  category:    'technical' | 'behavioral' | 'community'
  rarity:      'common' | 'rare' | 'epic' | 'legendary'
  svg:         string
  check:       (stats: BadgeCheckStats) => boolean
}

export interface BadgeCheckStats {
  quests_completed:    number
  current_streak:      number
  longest_streak:      number
  clean_code_streak:   number
  current_level:       number
  coastal_completed:   number
  highlands_completed: number
  citadel_completed:   number
}

const C = {
  common:    { stroke: '#64748B', fill: '#1A2535', text: '#94A3B8', glow: '#64748B' },
  rare:      { stroke: '#22D3EE', fill: '#0D1E2E', text: '#22D3EE', glow: '#22D3EE' },
  epic:      { stroke: '#A78BFA', fill: '#130E24', text: '#A78BFA', glow: '#A78BFA' },
  legendary: { stroke: '#F59E0B', fill: '#1A1206', text: '#F59E0B', glow: '#F59E0B' },
}

export const BADGES: BadgeDef[] = [

  {
    slug: 'first_stone', name: 'The First Stone',
    description: 'Selesaikan quest pertamamu.',
    category: 'technical', rarity: 'common',
    check: s => s.quests_completed >= 1,
    svg: `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <polygon points="40,6 68,22 68,58 40,74 12,58 12,22" fill="${C.common.fill}" stroke="${C.common.stroke}" stroke-width="1.5"/>
      <polygon points="40,14 60,26 60,54 40,66 20,54 20,26" fill="none" stroke="${C.common.stroke}" stroke-width="0.5" opacity="0.3"/>
      <ellipse cx="40" cy="38" rx="13" ry="11" fill="#263348" stroke="${C.common.stroke}" stroke-width="1.2"/>
      <ellipse cx="40" cy="38" rx="7" ry="5.5" fill="#1A2535"/>
      <line x1="34" y1="34" x2="38" y2="30" stroke="${C.common.text}" stroke-width="0.8" opacity="0.6"/>
      <line x1="38" y1="30" x2="46" y2="42" stroke="${C.common.text}" stroke-width="0.8" opacity="0.6"/>
    </svg>`,
  },

  {
    slug: 'pathfinder', name: 'Pathfinder',
    description: 'Selesaikan 5 quest.',
    category: 'technical', rarity: 'common',
    check: s => s.quests_completed >= 5,
    svg: `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="40" r="32" fill="${C.common.fill}" stroke="${C.common.stroke}" stroke-width="1.5"/>
      <circle cx="40" cy="40" r="26" fill="none" stroke="${C.common.stroke}" stroke-width="0.5" opacity="0.25"/>
      <path d="M28,52 L28,32 L36,38 L40,28 L44,38 L52,32 L52,52" fill="none" stroke="${C.common.text}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="40" cy="28" r="3" fill="${C.common.text}"/>
    </svg>`,
  },

  {
    slug: 'adventurer', name: 'Adventurer',
    description: 'Selesaikan 10 quest.',
    category: 'technical', rarity: 'rare',
    check: s => s.quests_completed >= 10,
    svg: `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="10" width="60" height="60" rx="12" fill="${C.rare.fill}" stroke="${C.rare.stroke}" stroke-width="1.5"/>
      <rect x="16" y="16" width="48" height="48" rx="9" fill="none" stroke="${C.rare.stroke}" stroke-width="0.5" opacity="0.25"/>
      <text x="40" y="46" text-anchor="middle" font-size="28" font-weight="700" fill="${C.rare.text}" font-family="monospace">10</text>
      <line x1="24" y1="54" x2="56" y2="54" stroke="${C.rare.stroke}" stroke-width="1" opacity="0.5"/>
    </svg>`,
  },

  {
    slug: 'veteran', name: 'Veteran',
    description: 'Selesaikan 25 quest.',
    category: 'technical', rarity: 'rare',
    check: s => s.quests_completed >= 25,
    svg: `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <path d="M40,6 L54,20 L72,20 L72,36 L60,48 L64,70 L40,58 L16,70 L20,48 L8,36 L8,20 L26,20 Z" fill="${C.rare.fill}" stroke="${C.rare.stroke}" stroke-width="1.5"/>
      <path d="M40,18 L50,26 L62,26 L62,36 L54,44 L57,58 L40,50 L23,58 L26,44 L18,36 L18,26 L30,26 Z" fill="none" stroke="${C.rare.stroke}" stroke-width="0.5" opacity="0.25"/>
      <text x="40" y="46" text-anchor="middle" font-size="18" font-weight="700" fill="${C.rare.text}" font-family="monospace">25</text>
    </svg>`,
  },

  {
    slug: 'quest_master', name: 'Quest Master',
    description: 'Selesaikan 50 quest.',
    category: 'technical', rarity: 'epic',
    check: s => s.quests_completed >= 50,
    svg: `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <polygon points="40,4 50,28 76,28 56,44 64,70 40,54 16,70 24,44 4,28 30,28" fill="${C.epic.fill}" stroke="${C.epic.stroke}" stroke-width="1.5"/>
      <polygon points="40,16 46,32 64,32 50,42 56,58 40,48 24,58 30,42 16,32 34,32" fill="none" stroke="${C.epic.stroke}" stroke-width="0.6" opacity="0.3"/>
      <text x="40" y="46" text-anchor="middle" font-size="16" font-weight="700" fill="${C.epic.text}" font-family="monospace">50</text>
    </svg>`,
  },

  {
    slug: 'spark', name: 'Spark',
    description: 'Pertahankan streak 3 hari.',
    category: 'behavioral', rarity: 'common',
    check: s => s.longest_streak >= 3,
    svg: `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <path d="M40,8 L52,24 L70,24 L58,40 L40,72 L22,40 L10,24 L28,24 Z" fill="${C.common.fill}" stroke="${C.common.stroke}" stroke-width="1.5"/>
      <path d="M40,22 L47,32 L40,60 L33,32 Z" fill="${C.common.text}" opacity="0.6"/>
      <path d="M36,28 L40,22 L44,28 L40,24 Z" fill="${C.common.text}"/>
    </svg>`,
  },

  {
    slug: 'ignition', name: 'Ignition',
    description: 'Pertahankan streak 7 hari.',
    category: 'behavioral', rarity: 'rare',
    check: s => s.longest_streak >= 7,
    svg: `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <path d="M40,6 L52,22 L72,18 L62,36 L74,52 L54,48 L46,68 L34,50 L14,58 L22,38 L8,24 L28,26 Z" fill="${C.rare.fill}" stroke="${C.rare.stroke}" stroke-width="1.5"/>
      <path d="M33,50 Q36,36 40,40 Q43,30 47,50 Q44,56 40,58 Q36,56 33,50Z" fill="${C.rare.text}" opacity="0.8"/>
      <path d="M36,50 Q38,40 40,43 Q42,37 44,50 Q42,54 40,56 Q38,54 36,50Z" fill="white" opacity="0.25"/>
      <text x="40" y="26" text-anchor="middle" font-size="9" font-weight="700" fill="${C.rare.text}" font-family="monospace">7</text>
    </svg>`,
  },

  {
    slug: 'inferno', name: 'Inferno',
    description: 'Pertahankan streak 30 hari.',
    category: 'behavioral', rarity: 'legendary',
    check: s => s.longest_streak >= 30,
    svg: `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="40" r="34" fill="${C.legendary.fill}" stroke="${C.legendary.stroke}" stroke-width="2"/>
      <circle cx="40" cy="40" r="28" fill="none" stroke="${C.legendary.stroke}" stroke-width="0.5" opacity="0.3"/>
      <!-- laurel left -->
      <path d="M16,54 Q12,44 14,34 Q18,26 23,30 Q20,38 18,46 Z" fill="${C.legendary.stroke}" opacity="0.7"/>
      <path d="M18,46 Q14,36 17,26 Q21,18 26,22 Q23,30 21,38 Z" fill="${C.legendary.stroke}" opacity="0.4"/>
      <!-- laurel right -->
      <path d="M64,54 Q68,44 66,34 Q62,26 57,30 Q60,38 62,46 Z" fill="${C.legendary.stroke}" opacity="0.7"/>
      <path d="M62,46 Q66,36 63,26 Q59,18 54,22 Q57,30 59,38 Z" fill="${C.legendary.stroke}" opacity="0.4"/>
      <!-- flame center -->
      <path d="M32,52 Q36,36 40,42 Q43,28 48,52 Q44,60 40,62 Q36,60 32,52Z" fill="${C.legendary.stroke}" opacity="0.9"/>
      <path d="M35,52 Q38,40 40,44 Q42,34 45,52 Q43,58 40,60 Q37,58 35,52Z" fill="white" opacity="0.2"/>
      <text x="40" y="24" text-anchor="middle" font-size="9" font-weight="700" fill="${C.legendary.text}" font-family="monospace">30</text>
    </svg>`,
  },

  {
    slug: 'clean_hands', name: 'Clean Hands',
    description: 'Dapatkan passed_clean 3 kali berturut-turut.',
    category: 'technical', rarity: 'rare',
    check: s => s.clean_code_streak >= 3,
    svg: `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <polygon points="40,4 76,22 76,58 40,76 4,58 4,22" fill="${C.rare.fill}" stroke="${C.rare.stroke}" stroke-width="1.5"/>
      <polygon points="40,14 66,28 66,52 40,66 14,52 14,28" fill="none" stroke="${C.rare.stroke}" stroke-width="0.5" opacity="0.2"/>
      <path d="M24,40 L34,52 L56,28" fill="none" stroke="${C.rare.text}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
  },

  {
    slug: 'perfectionist', name: 'Perfectionist',
    description: 'Dapatkan passed_clean 10 kali berturut-turut.',
    category: 'technical', rarity: 'epic',
    check: s => s.clean_code_streak >= 10,
    svg: `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <polygon points="40,4 52,16 68,12 68,28 80,40 68,52 68,68 52,64 40,76 28,64 12,68 12,52 0,40 12,28 12,12 28,16" fill="${C.epic.fill}" stroke="${C.epic.stroke}" stroke-width="1.5"/>
      <polygon points="40,14 49,22 61,19 61,30 70,40 61,50 61,61 49,58 40,66 31,58 19,61 19,50 10,40 19,30 19,19 31,22" fill="none" stroke="${C.epic.stroke}" stroke-width="0.5" opacity="0.25"/>
      <path d="M26,40 L36,52 L54,28" fill="none" stroke="${C.epic.text}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="40" cy="40" r="4" fill="${C.epic.text}" opacity="0.2"/>
    </svg>`,
  },

  {
    slug: 'apprentice', name: 'Apprentice',
    description: 'Capai Level 5.',
    category: 'behavioral', rarity: 'common',
    check: s => s.current_level >= 5,
    svg: `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="8" width="64" height="64" rx="8" fill="${C.common.fill}" stroke="${C.common.stroke}" stroke-width="1.5"/>
      <rect x="14" y="14" width="52" height="52" rx="6" fill="none" stroke="${C.common.stroke}" stroke-width="0.5" opacity="0.25"/>
      <text x="40" y="50" text-anchor="middle" font-size="32" font-weight="800" fill="${C.common.text}" font-family="monospace">V</text>
    </svg>`,
  },

  {
    slug: 'journeyman', name: 'Journeyman',
    description: 'Capai Level 10.',
    category: 'behavioral', rarity: 'rare',
    check: s => s.current_level >= 10,
    svg: `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <polygon points="8,20 20,8 60,8 72,20 72,60 60,72 20,72 8,60" fill="${C.rare.fill}" stroke="${C.rare.stroke}" stroke-width="1.5"/>
      <polygon points="14,22 22,14 58,14 66,22 66,58 58,66 22,66 14,58" fill="none" stroke="${C.rare.stroke}" stroke-width="0.5" opacity="0.25"/>
      <text x="40" y="50" text-anchor="middle" font-size="24" font-weight="800" fill="${C.rare.text}" font-family="monospace">X</text>
    </svg>`,
  },

  {
    slug: 'expert', name: 'Expert',
    description: 'Capai Level 25.',
    category: 'behavioral', rarity: 'epic',
    check: s => s.current_level >= 25,
    svg: `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <polygon points="40,4 50,14 64,10 70,24 80,30 74,44 78,58 64,60 56,72 40,68 24,72 16,60 2,58 6,44 0,30 10,24 16,10 30,14" fill="${C.epic.fill}" stroke="${C.epic.stroke}" stroke-width="1.5"/>
      <text x="40" y="48" text-anchor="middle" font-size="20" font-weight="800" fill="${C.epic.text}" font-family="monospace">XXV</text>
    </svg>`,
  },

  {
    slug: 'grandmaster', name: 'Grandmaster',
    description: 'Capai Level 50.',
    category: 'behavioral', rarity: 'legendary',
    check: s => s.current_level >= 50,
    svg: `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <path d="M10,60 L10,30 L22,44 L40,6 L58,44 L70,30 L70,60 L54,60 L54,48 L40,56 L26,48 L26,60 Z" fill="${C.legendary.fill}" stroke="${C.legendary.stroke}" stroke-width="2"/>
      <path d="M14,58 L14,38 L24,48 L40,16 L56,48 L66,38 L66,58" fill="none" stroke="${C.legendary.stroke}" stroke-width="0.5" opacity="0.3"/>
      <circle cx="40" cy="22" r="5" fill="${C.legendary.stroke}" opacity="0.9"/>
      <circle cx="22" cy="42" r="4" fill="#22D3EE" opacity="0.8"/>
      <circle cx="58" cy="42" r="4" fill="#A78BFA" opacity="0.8"/>
      <rect x="14" y="52" width="52" height="6" rx="2" fill="${C.legendary.stroke}" opacity="0.35"/>
    </svg>`,
  },

  {
    slug: 'coastal_hero', name: 'Coastal Hero',
    description: 'Selesaikan semua quest Coastal Republic.',
    category: 'community', rarity: 'epic',
    check: s => s.coastal_completed >= 40,
    svg: `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="40" r="34" fill="${C.epic.fill}" stroke="${C.epic.stroke}" stroke-width="2"/>
      <circle cx="40" cy="40" r="28" fill="none" stroke="${C.epic.stroke}" stroke-width="0.5" opacity="0.2"/>
      <!-- wave 1 -->
      <path d="M14,38 Q20,30 26,38 Q32,46 38,38 Q44,30 50,38 Q56,46 62,38 Q66,34 68,36" fill="none" stroke="${C.epic.text}" stroke-width="2" stroke-linecap="round"/>
      <!-- wave 2 -->
      <path d="M16,46 Q22,38 28,46 Q34,54 40,46 Q46,38 52,46 Q58,54 64,46 Q66,44 68,44" fill="none" stroke="${C.epic.text}" stroke-width="1.2" opacity="0.45" stroke-linecap="round"/>
      <!-- anchor -->
      <circle cx="40" cy="24" r="4" fill="none" stroke="${C.epic.text}" stroke-width="1.5"/>
      <line x1="40" y1="28" x2="40" y2="34" stroke="${C.epic.text}" stroke-width="1.5"/>
      <path d="M34,34 Q40,32 46,34" fill="none" stroke="${C.epic.text}" stroke-width="1.5" stroke-linecap="round"/>
    </svg>`,
  },

  {
    slug: 'data_ranger', name: 'Data Ranger',
    description: 'Selesaikan semua quest Data Highlands.',
    category: 'community', rarity: 'epic',
    check: s => s.highlands_completed >= 40,
    svg: `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <polygon points="40,4 76,62 4,62" fill="${C.epic.fill}" stroke="#A78BFA" stroke-width="2"/>
      <polygon points="40,16 66,56 14,56" fill="none" stroke="#A78BFA" stroke-width="0.5" opacity="0.2"/>
      <!-- data bars inside -->
      <rect x="26" y="42" width="6" height="10" fill="#A78BFA" opacity="0.7" rx="1"/>
      <rect x="34" y="34" width="6" height="18" fill="#A78BFA" opacity="0.85" rx="1"/>
      <rect x="42" y="38" width="6" height="14" fill="#A78BFA" rx="1"/>
      <rect x="50" y="30" width="6" height="22" fill="#A78BFA" opacity="0.9" rx="1"/>
    </svg>`,
  },

  {
    slug: 'logic_lord', name: 'Logic Lord',
    description: 'Selesaikan semua quest Logic Citadel.',
    category: 'community', rarity: 'epic',
    check: s => s.citadel_completed >= 40,
    svg: `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="18" width="68" height="52" rx="4" fill="${C.epic.fill}" stroke="#F59E0B" stroke-width="2"/>
      <!-- battlements -->
      <rect x="6" y="8" width="12" height="14" rx="2" fill="${C.epic.fill}" stroke="#F59E0B" stroke-width="1.5"/>
      <rect x="22" y="8" width="12" height="14" rx="2" fill="${C.epic.fill}" stroke="#F59E0B" stroke-width="1.5"/>
      <rect x="46" y="8" width="12" height="14" rx="2" fill="${C.epic.fill}" stroke="#F59E0B" stroke-width="1.5"/>
      <rect x="62" y="8" width="12" height="14" rx="2" fill="${C.epic.fill}" stroke="#F59E0B" stroke-width="1.5"/>
      <!-- gate -->
      <path d="M30,70 L30,46 Q40,38 50,46 L50,70 Z" fill="#F59E0B" opacity="0.2"/>
      <path d="M30,70 L30,46 Q40,38 50,46 L50,70" fill="none" stroke="#F59E0B" stroke-width="1.5"/>
    </svg>`,
  },

  {
    slug: 'realm_conqueror', name: 'Realm Conqueror',
    description: 'Selesaikan semua quest di ketiga region.',
    category: 'community', rarity: 'legendary',
    check: s => s.coastal_completed >= 40 && s.highlands_completed >= 40 && s.citadel_completed >= 40,
    svg: `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="40" r="34" fill="${C.legendary.fill}" stroke="${C.legendary.stroke}" stroke-width="2"/>
      <circle cx="40" cy="40" r="28" fill="none" stroke="${C.legendary.stroke}" stroke-width="0.5" opacity="0.25"/>
      <!-- crown -->
      <path d="M18,56 L18,32 L28,44 L40,14 L52,44 L62,32 L62,56 Z" fill="${C.legendary.fill}" stroke="${C.legendary.stroke}" stroke-width="2"/>
      <rect x="18" y="50" width="44" height="6" rx="2" fill="${C.legendary.stroke}" opacity="0.4"/>
      <!-- 3 gems -->
      <circle cx="40" cy="20" r="5" fill="#22D3EE"/>
      <circle cx="24" cy="40" r="4" fill="#A78BFA"/>
      <circle cx="56" cy="40" r="4" fill="#34D399"/>
      <!-- inner glow ring -->
      <circle cx="40" cy="40" r="20" fill="none" stroke="${C.legendary.stroke}" stroke-width="0.5" opacity="0.2"/>
    </svg>`,
  },
]

export const BADGE_MAP = Object.fromEntries(BADGES.map(b => [b.slug, b]))