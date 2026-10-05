// Copy on this site is written in Aliya's voice: active, brief, a little whimsical, a little
// well-read. Her cover letters are style references only; don't paste sentences from them.

/** Shown at the top of every page. The title also feeds the page <title> in index.html. */
export const profile = {
  name: 'aliya renee khan',
  title: 'AI Strategist & Builder',
}

export const links = {
  email: 'aliyareneekhan@gmail.com',
  linkedin: 'https://www.linkedin.com/in/aliyareneekhan/',
  github: 'https://github.com/thesideqst',
  accountSignals: 'https://github.com/thesideqst/account-signals',
  instagram: 'https://www.instagram.com/lifeofaliya/',
  instagramHandle: 'lifeofaliya',
  // TODO: swap for Aliya's Fora advisor profile URL once she shares it.
  fora: 'mailto:aliya.khan@fora.travel?subject=Planning%20a%20trip',
}

/** Mirrors the bio on instagram.com/lifeofaliya. Update when she changes it there. */
export const instagramProfile = {
  bio: 'your guide to becoming more independent and getting your spark back',
  since: 'going on solo side quests since 2015',
  place: 'nyc',
  /** Latest posts, saved to /public/media/instagram/<id>.jpg. The cover in /media/covers/blog.jpg is built from these. */
  posts: [
    { id: 'DbdwsMPpDlN', kind: 'reel', alt: 'Unhinged things I did to stop crippling anxiety, week 1 of 6' },
    { id: 'DbXDs8Olfwh', kind: 'p', alt: 'How to go out alone without feeling weird' },
    { id: 'DawCozrFXYj', kind: 'p', alt: 'July reviews: an NYC guide' },
    { id: 'Dapzea-FZCn', kind: 'p', alt: 'Summermaxxing: Austin, TX recs' },
    { id: 'DKaW37QI3lP', kind: 'p', alt: 'A selfie on old stone steps' },
    { id: 'DBz5bM5AgQU', kind: 'p', alt: 'Halloween with friends' },
  ],
}

// The resume page mirrors Aliya's resume ("Aliya Renee Khan Product Strategy and Ops Resume"
// in Drive). Keep it in sync with that doc rather than rewriting it.
export type Role = {
  years: string
  title: string
  org: string
  place: string
  /** `lead` is the bolded opener on the resume; `rest` finishes the sentence. */
  points: { lead: string; rest?: string }[]
}

export const resumeSummary =
  'I partner with sales leadership on strategy and operations across a $200M+ enterprise technology territory of 20+ accounts. I find AI use cases, prove their ROI, and carry what customers need back to Product. So far that has put six CRM use cases on the roadmap, produced tokenomics models for consumption pricing, and helped land $80M+ in net new ACV since 2025. I also build Claude workflows that 250+ sellers use. Before ServiceNow, I advised CIOs at Kearney and Accenture on market assessments, build-or-buy calls, and multi-year technology roadmaps.'

export const roles: Role[] = [
  {
    years: '2024 – Present',
    title: 'Principal Strategist',
    org: 'ServiceNow',
    place: 'New York, NY',
    points: [
      { lead: 'Pioneered six customer use cases into ServiceNow’s AI product roadmap', rest: 'by prototyping them directly with Product, Enterprise Architecture, and Engineering across strategic technology accounts.' },
      { lead: 'Developed tokenomics models for the high-tech industry', rest: 'as ServiceNow shifted to consumption pricing for AI alongside seat licensing, giving deal teams a way to size and price AI usage.' },
      { lead: 'Catalyzed $80M+ in net new ACV from 2025–2026', rest: 'by synthesizing complex technical requirements into high-impact executive business cases for 20+ strategic technology accounts.' },
      { lead: 'Unlocked $20M in pipeline within six months', rest: 'by establishing an AI value-realization framework adopted as the standard across a major semiconductor client’s 300+ seller organization.' },
      { lead: 'Standardized performance reporting across 20 accounts', rest: 'by defining baselines, adoption metrics, and ROI / TCO models for QBRs and executive reviews, now the regional default.' },
      { lead: 'Landed quarterly plans that sales, customer success, product, and partnerships each committed to', rest: 'across a $200M+ territory, without having direct reporting authority.' },
      { lead: 'Saved 50 hours of manual effort per seller per quarter', rest: 'by building 10+ production AI workflows on the Claude API, including a renewal agent that replaced a multi-week cycle with a one-page executive briefing.' },
      { lead: 'Accelerated value realization 2x across 15+ concurrent workstreams', rest: 'on a $200M+ hyperscaler account by co-designing a three-tier operating model spanning ServiceNow, systems integrators, and customer engineering.' },
    ],
  },
  {
    years: '2022 – 2024',
    title: 'Management Consultant, Foresight & Innovation',
    org: 'Kearney',
    place: 'Chicago, IL',
    points: [
      { lead: 'Aligned $50M in technology investment with phased delivery milestones', rest: 'by developing a 10-year AI transformation roadmap for a global chemicals company and securing sign-off from the CIO.' },
      { lead: 'Unlocked $45M in profitability benefit for a major outdoor retailer', rest: 'by designing a five-year CIO operating plan spanning OKRs, operating model redesign, resource planning, and financial milestones.' },
      { lead: 'Advised a private equity firm on whether to invest in an EV charging network', rest: 'by modeling charging infrastructure economics, later published as a Kearney perspective.' },
    ],
  },
  {
    years: '2019 – 2022',
    title: 'Management Consultant, Digital Transformation',
    org: 'Accenture',
    place: 'Chicago, IL',
    points: [
      { lead: 'Optimized $200M+ in engineering services spend for a major hyperscaler', rest: 'and captured $75M+ in new business by leading cross-organizational implementations from strategy through delivery.' },
    ],
  },
  {
    years: '2018 – 2019',
    title: 'Research Consultant',
    org: 'TecEd',
    place: 'Ann Arbor, MI',
    points: [
      { lead: 'Shaped in-car platform adoption and interface priorities for a major tech company’s product team', rest: 'by synthesizing 50+ usability studies into prioritized user and market research findings.' },
    ],
  },
]

export const resumeProjects: { name: string; href: string; text: string; stack: string }[] = [
  {
    name: 'Account Signals',
    href: '/account-signals',
    text: 'a prototype that reads filings, analyst ratings, and earnings calls overnight and hands enterprise sellers a ten-minute audio briefing each morning.',
    stack: 'Python, SQL, Databricks, Postgres',
  },
  {
    name: 'Mirorra',
    href: '/mirorra',
    text: 'an AI styling app from Sideqst Studio where three opinionated AI stylists critique your wardrobe.',
    stack: 'React Native, Node.js, Claude API',
  },
]

export const education = [
  { school: 'NYU Stern School of Business', degree: 'M.B.A. Candidate · AI, Finance, and Marketing', when: 'Expected May 2028' },
  { school: 'University of Michigan, Ann Arbor', degree: 'B.S. Computer Science · B.S. Anthropology (High Honors)', when: '' },
]

export const skills: { group: string; items: string }[] = [
  {
    group: 'Product Strategy & Operations',
    items: 'market assessment and sizing, build / buy / partner analysis, planning cycles and business reviews, ROI / TCO / scenario modeling, consumption and pricing models, metric definition and reporting, executive communication, ServiceNow product knowledge specifically focused on Now Assist / AI Control Tower / CRM',
  },
  {
    group: 'Analytics & Business Intelligence',
    items: 'SQL, Python, Power BI, Databricks, advanced Excel, CRM and product usage analytics, baseline and KPI definition, business value assessment, value realization, sales pipeline analysis',
  },
  {
    group: 'AI & Automation',
    items: 'Claude API, prompt engineering, multi-agent orchestration, workflow automation, rapid prototyping, React Native, Node.js, Databricks',
  },
]

/** First ~46s of the NVDA fiscal Q2 2027 briefing. */
export const briefingExcerpt = `NVIDIA just delivered a quarter that feels like a seismic shift in the AI compute landscape, and the numbers are shouting louder than the polished slides. Revenue surged to $96.2 billion, a 17.9 percent jump from the prior quarter and more than double the year-ago level at 105.9 percent growth. That kind of top-line lift isn’t just good news; it’s a clear signal that the AI-driven infrastructure build-out is no longer a future promise. It’s happening now, and it’s moving faster than anyone expected.`

export const media = {
  briefing: '/media/account-signals-excerpt.m4a',
  runway: [
    { src: '/media/runway-20260827-170013.mp4', title: 'Hand-drawn explainer', note: 'Line-art character animation' },
    { src: '/media/runway-20260828-015535.mp4', title: 'Clinical scene', note: 'Cinematic dialogue scene' },
  ],
}

export type Stylist = {
  id: string
  name: string
  base: string
  image: string
  lens: string
  read: string
  says: string[]
  never: string[]
  hue: string
}

export const stylists: Stylist[] = [
  {
    id: 'seo-yeon',
    name: 'Seo Yeon',
    base: 'Seoul',
    image: '/media/seo-yeon.png',
    lens: 'Colour, proportion, and Seoul pulse. In that order.',
    read: 'Talks about colour the way a painter would: undertone, chroma, value. She is not impressed by price tags or logos.',
    says: ['undertone', 'chroma', 'silhouette logic', 'earns'],
    never: ['cute', 'versatile', 'chic'],
    hue: '#8fb3c9',
  },
  {
    id: 'claire',
    name: 'Claire',
    base: 'New York',
    image: '/media/claire.jpg',
    lens: 'What a piece communicates, and whether it works on an actual Tuesday.',
    read: 'Came up through music journalism. She’s not thinking about a photoshoot. She’s thinking about the subway, a dinner, a show.',
    says: ['tension', 'reads', 'this is having a conversation with'],
    never: ['timeless', 'elevated', 'effortless'],
    hue: '#d9707e',
  },
  {
    id: 'margaux',
    name: 'Margaux',
    base: 'Paris',
    image: '/media/margaux.png',
    lens: 'Construction, longevity, and whether a piece is living or already dead.',
    read: 'The daughter of a dressmaker and a literature professor. She is not cruel. She is honest. She would say these are the same thing.',
    says: ['the cut is fighting', 'already peaked', 'correct', 'no'],
    never: ['fun', 'playful', 'I can see why you like it'],
    hue: '#e8a33d',
  },
]

/** Mirorra calls to action. The beta form on /mirorra emails signups to `betaEmail`. */
export const mirorraLinks = {
  beta: '/mirorra#beta',
  betaEmail: 'aliyareneekhan@gmail.com',
}

export type Playlist = {
  /** Short label for the chip, e.g. "Sunday mornings". */
  name: string
  /** Any open.spotify.com playlist/album/track link; ?si=… tracking params are fine. */
  spotifyUrl: string
  /** Optional one line on when or why. Aliya's words only; leave it out rather than invent one. */
  note?: string
}

/**
 * "What I'm listening to right now." Each entry becomes a choice in the player;
 * the first is the default for new visitors. Empty means the player shows a coming-soon note.
 */
export const playlists: Playlist[] = [
  { name: 'nostalgic retro haunted brat prom', spotifyUrl: 'https://open.spotify.com/playlist/6LylTQm3DLfJ3HxueWzm4N' },
  { name: 'hubris dark pop afternoon', spotifyUrl: 'https://open.spotify.com/playlist/2GrMaM3HlT7cJQ4RWYm0wK' },
  { name: 'journaling neoclassical evening', spotifyUrl: 'https://open.spotify.com/playlist/1GbaNNvtyr390IkHPp9UxY' },
  { name: 'sleepy weepy relatable tuesday evening', spotifyUrl: 'https://open.spotify.com/playlist/49BImWSzTVdxdIAwKZnWQN' },
]

export type Album = MediaItem & {
  /** open.spotify.com/album/… link; opens in a new tab. */
  href: string
}

/** Albums on repeat lately, listed under the player. Up to three; empty hides the section. */
export const recentAlbums: Album[] = []

export type Project = {
  slug: string
  title: string
  image: string
  /** Short summary shown when the card is clicked. Aliya's words where possible. */
  summary: string[]
  /** In-depth page. External URLs open in a new tab. */
  more: { label: string; href: string }
}

// One entry per card on the wheel, in wheel order.
export const projects: Project[] = [
  {
    slug: 'resume',
    title: 'Resume',
    image: '/media/covers/resume.svg',
    summary: [
      'I run strategy and operations for a $200M+ ServiceNow territory of 20+ enterprise tech accounts, where my business cases have helped land $80M+ in new ACV since 2025.',
      'Before ServiceNow, I advised CIOs at Kearney and Accenture, and I’m now pursuing an MBA at NYU Stern.',
    ],
    more: { label: 'Full resume', href: '/resume' },
  },
  {
    slug: 'account-signals',
    title: 'Account Signals',
    image: '/media/covers/account-signals.svg',
    summary: [
      'Most sellers don’t have time to read a 10-Q, so I built a pipeline that sifts through 700K+ account signals overnight and turns them into a 10-minute podcast they can listen to each morning.',
    ],
    more: { label: 'Listen to an episode', href: '/account-signals' },
  },
  {
    slug: 'mirorra',
    title: 'Mirorra',
    image: '/media/covers/mirorra.jpg',
    summary: [
      'Mirorra gives your closet a panel of AI stylists: upload a photo of any piece, and three critics, each with her own eye and vocabulary, debate whether it actually works on you (with better manners than most fashion-show judges).',
    ],
    more: { label: 'Meet the stylists', href: '/mirorra' },
  },
  {
    slug: 'photography',
    title: 'Photography',
    image: '/media/covers/photography.jpg',
    summary: ['Selected works on display, full gallery still developing in the darkroom.'],
    more: { label: 'Peek inside', href: '/photography' },
  },
  {
    slug: 'blog',
    title: '@lifeofaliya',
    image: '/media/covers/blog.jpg',
    summary: [instagramProfile.bio],
    more: { label: 'Open @lifeofaliya', href: links.instagram },
  },
  {
    slug: 'fora',
    title: 'Fora Travel',
    image: '/media/covers/fora.svg',
    summary: [
      'I’m a registered Fora travel advisor who has wandered through 20+ countries, and I plan every client’s trip with the same care I’d put into my own.',
    ],
    more: { label: 'Plan a trip', href: '/fora' },
  },
]

// ---- Travel (/fora) -------------------------------------------------------------
// Country ids are ISO 3166 numeric codes, as used by the world-atlas map data.

export const travel = {
  // Trip requests post to FormSubmit, which emails them on to `email` below. No account needed;
  // the very first request triggers a one-time "activate this form" email that has to be clicked.
  email: 'aliya.khan@fora.travel',
  /** Countries where Aliya has planned trips for clients. */
  client: { '380': 'Italy', '300': 'Greece', '392': 'Japan' } as Record<string, string>,
  /** Countries Aliya has traveled to herself. */
  been: {
    '826': 'United Kingdom', '372': 'Ireland', '724': 'Spain', '250': 'France', '380': 'Italy',
    '276': 'Germany', '620': 'Portugal', '300': 'Greece', '392': 'Japan', '705': 'Slovenia',
    '756': 'Switzerland', '484': 'Mexico', '040': 'Austria', '191': 'Croatia', '356': 'India',
    '764': 'Thailand', '410': 'South Korea', '188': 'Costa Rica', '032': 'Argentina', '152': 'Chile',
    '124': 'Canada', '840': 'United States',
  } as Record<string, string>,
  /** Places too small for the map's country shapes, or cities worth calling out. */
  pins: [
    { id: 'monaco', name: 'Monaco', country: 'Monaco', lng: 7.4246, lat: 43.7384 },
    { id: 'singapore', name: 'Singapore', country: 'Singapore', lng: 103.8198, lat: 1.3521 },
    { id: 'la', name: 'Los Angeles', country: 'United States', lng: -118.2437, lat: 34.0522 },
    { id: 'sf-napa', name: 'San Francisco & Napa', country: 'United States', lng: -122.35, lat: 38.0 },
    { id: 'san-diego', name: 'San Diego', country: 'United States', lng: -117.1611, lat: 32.7157 },
    { id: 'phoenix', name: 'Phoenix', country: 'United States', lng: -112.074, lat: 33.4484 },
    { id: 'bozeman', name: 'Bozeman', country: 'United States', lng: -111.0429, lat: 45.677 },
    { id: 'yellowstone', name: 'Yellowstone', country: 'United States', lng: -110.5885, lat: 44.428 },
    { id: 'denver', name: 'Denver', country: 'United States', lng: -104.9903, lat: 39.7392 },
    { id: 'seattle', name: 'Seattle', country: 'United States', lng: -122.3321, lat: 47.6062 },
    { id: 'hawaii', name: 'Hawaii', country: 'United States', lng: -156.9, lat: 20.75 },
    { id: 'austin', name: 'Austin', country: 'United States', lng: -97.7431, lat: 30.2672 },
    { id: 'detroit', name: 'Detroit', country: 'United States', lng: -83.0458, lat: 42.3314 },
    { id: 'ann-arbor', name: 'Ann Arbor', country: 'United States', lng: -83.743, lat: 42.2808 },
    { id: 'grand-rapids', name: 'Grand Rapids', country: 'United States', lng: -85.6681, lat: 42.9634 },
    { id: 'chicago', name: 'Chicago', country: 'United States', lng: -87.6298, lat: 41.8781 },
    { id: 'indianapolis', name: 'Indianapolis', country: 'United States', lng: -86.1581, lat: 39.7684 },
    { id: 'cleveland', name: 'Cleveland', country: 'United States', lng: -81.6944, lat: 41.4993 },
    { id: 'nyc', name: 'New York City', country: 'United States', lng: -74.006, lat: 40.7128 },
    { id: 'boston', name: 'Boston', country: 'United States', lng: -71.0589, lat: 42.3601 },
    { id: 'white-mountains', name: 'White Mountains, NH', country: 'United States', lng: -71.3, lat: 44.27 },
    { id: 'orlando', name: 'Orlando', country: 'United States', lng: -81.3792, lat: 28.5383 },
    { id: 'miami', name: 'Miami', country: 'United States', lng: -80.1918, lat: 25.7617 },
    { id: 'las-vegas', name: 'Las Vegas', country: 'United States', lng: -115.1398, lat: 36.1699 },
  ],
  tripStyles: [
    'Food & wine', 'Culture & history', 'Beaches', 'Outdoors & adventure',
    'Honeymoon', 'Family', 'Luxury', 'Wellness', 'City break',
  ],
  budgets: ['Under $3k', '$3k – $6k', '$6k – $10k', '$10k – $20k', '$20k+', 'Not sure yet'],
}

export type MediaItem = {
  title: string
  by?: string
  /** Short status shown under the title, e.g. "chapter 12" or "season 2". */
  status?: string
  /** Letter grade for finished things. */
  rating?: string
  /** One line in Aliya's voice. */
  note?: string
  /** Cover colour for the typographic card, and the backdrop while the image loads. */
  hue: string
  /** Cover art or poster thumbnail, in /media/currently. Falls back to the typographic card. */
  image?: string
}

/** "What I'm into right now." Edit these lists to update the floating panel; empty lists are hidden. */
export const currently: {
  reading: MediaItem[]
  watching: MediaItem[]
  watched: MediaItem[]
  playing: MediaItem[]
} = {
  reading: [{ title: 'Thinking in Systems', by: 'Donella Meadows', hue: '#2f6f73', image: '/media/currently/thinking-in-systems.jpg' }],
  watching: [
    { title: 'Last Seen', hue: '#5b3f8c', image: '/media/currently/last-seen.jpg' },
    { title: 'Slow Horses', hue: '#7a5a2e', image: '/media/currently/slow-horses.jpg' },
    { title: 'The Traitors UK', hue: '#7d2436', image: '/media/currently/the-traitors-uk.jpg' },
  ],
  watched: [{ title: 'Primetime', rating: 'B', hue: '#2c4a86', image: '/media/currently/primetime.jpg' }],
  playing: [],
}

// ---- Bookshelf (on the credenza under the /photography gallery wall) --------------

export type Book = {
  title: string
  author: string
  /** CSS font-family for the spine lettering (loaded in index.html). */
  font: string
  /** Cloth colour of the spine. */
  cloth: string
  /** Foil colour for the spine lettering. */
  foil: string
}

export const bookshelf: Book[] = [
  { title: 'The Alchemist', author: 'Paulo Coelho', font: "'Cinzel', serif", cloth: '#8a5a1c', foil: '#f1d9a0' },
  { title: 'Crime and Punishment', author: 'Fyodor Dostoevsky', font: "'IM Fell English', serif", cloth: '#5c1a1f', foil: '#d9b86a' },
  { title: 'Man’s Search for Meaning', author: 'Viktor E. Frankl', font: "'Libre Baskerville', serif", cloth: '#d6cbb0', foil: '#3a2a1e' },
  { title: 'Tomorrow, and Tomorrow, and Tomorrow', author: 'Gabrielle Zevin', font: "'Josefin Sans', sans-serif", cloth: '#1f3550', foil: '#e6c977' },
  { title: 'One Hundred Years of Solitude', author: 'Gabriel García Márquez', font: "'Cormorant Garamond', serif", cloth: '#2c4a32', foil: '#d9b86a' },
  { title: 'Kafka on the Shore', author: 'Haruki Murakami', font: "'Bodoni Moda', serif", cloth: '#16141a', foil: '#c7c2cf' },
  { title: 'Wuthering Heights', author: 'Emily Brontë', font: "'IM Fell DW Pica', serif", cloth: '#3d2340', foil: '#d9b86a' },
  { title: 'Thinking in Systems', author: 'Donella H. Meadows', font: "'Archivo Narrow', sans-serif", cloth: '#5f6b4a', foil: '#f0e6c8' },
  { title: 'The Psychology of Money', author: 'Morgan Housel', font: "'Playfair Display', serif", cloth: '#b59b5e', foil: '#231a12' },
  { title: 'Talking to Strangers', author: 'Malcolm Gladwell', font: "'Oswald', sans-serif", cloth: '#7a2e1f', foil: '#f0e0b8' },
  { title: 'Thinking, Fast and Slow', author: 'Daniel Kahneman', font: "'Barlow Condensed', sans-serif", cloth: '#22262c', foil: '#e6c977' },
]
