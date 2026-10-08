import { getSupabaseBrowser, isSupabaseConfigured } from "@/lib/supabase/client";

/**
 * Post — the gallery "dossier" unit shown in the Intel feed.
 * `gradientSeed` drives the local placeholder render until real
 * Supabase Storage images are wired (storage_path on the images table).
 */
export interface Post {
  id: string;
  title: string;
  prompt: string;
  aiModel: string;
  stylePreset: string;
  aspectRatio: "16:9" | "4:5" | "9:16" | "1:1";
  tags: string[];
  price?: string;
  address?: string;
  listingNo?: string;
  agentName: string;
  brokerage: string;
  isProOnly: boolean;
  likesCount: number;
  remixCount: number;
  gradientSeed: number; // deterministic placeholder hue
  /** Real render URL (Supabase Storage) — when set, replaces the gradient placeholder. */
  imageUrl?: string;
  createdAt: string;
}

export const GALLERY_TAGS = [
  "All Listings",
  "Luxury Villas",
  "Modern Condos",
  "Twilight Shots",
  "Drone Angles",
  "Open House Flyers",
] as const;

export const STYLE_PRESETS = [
  "Cinematic Luxury",
  "Drone Elevation",
  "Sunset Glow",
  "Typography Poster",
  "Clean Editorial",
  "Nocturne Minimal",
  "Sun-drenched Biophilic",
] as const;

/**
 * Seed gallery — stands in until the Milestone 3 pipeline deposits real
 * renders into Supabase. Each entry mirrors a Stitch screen ("Prompt Post
 * Engine v4.2", Bel Air dossier).
 */
export const SEED_POSTS: Post[] = [
  {
    id: "spy-91823",
    title: "OFF-MARKET BEL AIR TROPHY RESIDENCE",
    prompt:
      'Ultra-luxurious modern architectural mansion at twilight, glass walls, warm interior lighting, infinity pool reflecting purple dusk sky, lush Beverly Hills palm backdrop, 8k cinematic hyperrealism, hasselblad 50mm --ar 4:5 --stylize 250',
    aiModel: "Midjourney v6.1",
    stylePreset: "Nocturne Minimal",
    aspectRatio: "4:5",
    tags: ["Luxury Villas", "Twilight Shots"],
    price: "$12,950,000",
    address: "Bel Air Ridge, Los Angeles",
    listingNo: "24-91823",
    agentName: "Elena Vance",
    brokerage: "The Agency • Beverly Hills Estates",
    isProOnly: false,
    likesCount: 1420,
    remixCount: 38,
    gradientSeed: 268,
    createdAt: "2026-09-28T02:14:00Z",
  },
  {
    id: "spy-10452",
    title: "JUST LISTED | GLASS PAVILION ESTATE",
    prompt:
      'Architectural twilight shot of a 5-bedroom modern hillside villa in Bel Air, glass balustrades, glowing warm interior, hyperrealistic 8K, cinematic wide angle typography overlay "JUST LISTED | $8,450,000"',
    aiModel: "Prompt Post Engine v4.2",
    stylePreset: "Typography Poster",
    aspectRatio: "16:9",
    tags: ["Luxury Villas", "Twilight Shots"],
    price: "$8,450,000",
    address: "Trousdale Estates, Beverly Hills",
    listingNo: "24-10452",
    agentName: "Marcus Sterling",
    brokerage: "Sterling Luxury Group",
    isProOnly: false,
    likesCount: 986,
    remixCount: 21,
    gradientSeed: 292,
    createdAt: "2026-09-27T18:40:00Z",
  },
  {
    id: "spy-22031",
    title: "SKY SUITE PENTHOUSE — BLUE HOUR",
    prompt:
      "Interior blue-hour photograph of a downtown penthouse sky suite, floor-to-ceiling windows over Coal Harbour, marble island kitchen, soft volumetric haze, editorial real estate photography, sony 24mm f/1.4",
    aiModel: "Gemini 2.5 Flash Image",
    stylePreset: "Clean Editorial",
    aspectRatio: "4:5",
    tags: ["Modern Condos", "Twilight Shots"],
    price: "$3,295,000",
    address: "1151 W Georgia St, Vancouver",
    listingNo: "R3022031",
    agentName: "David Chang",
    brokerage: "rennie • Downtown",
    isProOnly: false,
    likesCount: 731,
    remixCount: 17,
    gradientSeed: 210,
    createdAt: "2026-09-27T09:05:00Z",
  },
  {
    id: "spy-88710",
    title: "DRONE ASCENT — OCEANFRONT COMPOUND",
    prompt:
      "Aerial drone elevation at golden hour of an oceanfront compound, infinity edge pool merging with the pacific horizon, coastal pines, cinematic color grade, DJI Hasselblad 4K",
    aiModel: "Midjourney v6.1",
    stylePreset: "Drone Elevation",
    aspectRatio: "16:9",
    tags: ["Luxury Villas", "Drone Angles"],
    price: "$18,750,000",
    address: "Kerrisdale Waterfront, West Vancouver",
    listingNo: "R2988710",
    agentName: "Priya Nair",
    brokerage: "Royal LePage Sussex",
    isProOnly: true,
    likesCount: 2114,
    remixCount: 64,
    gradientSeed: 32,
    createdAt: "2026-09-26T22:30:00Z",
  },
  {
    id: "spy-33587",
    title: "OPEN HOUSE — HERITAGE CRAFTSMAN",
    prompt:
      'Warm late-afternoon photograph of a restored heritage craftsman home, wraparound porch, autumn maple frame, "OPEN HOUSE SAT 2–4" typographic overlay, inviting editorial style',
    aiModel: "Prompt Post Engine v4.2",
    stylePreset: "Sunset Glow",
    aspectRatio: "1:1",
    tags: ["Open House Flyers"],
    price: "$2,150,000",
    address: "2632 W 8th Ave, Kitsilano",
    listingNo: "R2933587",
    agentName: "Sofia Marchetti",
    brokerage: "Macdonald Realty",
    isProOnly: false,
    likesCount: 412,
    remixCount: 9,
    gradientSeed: 18,
    createdAt: "2026-09-25T15:12:00Z",
  },
  {
    id: "spy-44120",
    title: "MODERN CONDO — SUN-DRENCHED BIOPHILIC",
    prompt:
      "Sun-drenched biophilic interior of a modern condo, living green wall, oak millwork, morning light shafts through floor-to-ceiling glass, architectural digest style, medium format film look",
    aiModel: "Claude Vision Render",
    stylePreset: "Sun-drenched Biophilic",
    aspectRatio: "4:5",
    tags: ["Modern Condos"],
    price: "$1,089,000",
    address: "680 Seylynn Cres, North Vancouver",
    listingNo: "R3044120",
    agentName: "James Okafor",
    brokerage: "Sutton Group",
    isProOnly: false,
    likesCount: 298,
    remixCount: 5,
    gradientSeed: 95,
    createdAt: "2026-09-24T11:48:00Z",
  },
  {
    id: "spy-99054",
    title: "TWILIGHT DRONE — SKYLINE TERRACE",
    prompt:
      "Twilight drone angle of a rooftop skyline terrace, fire pit glow, city lights bokeh behind glass railings, cinematic luxury grade, anamorphic flare",
    aiModel: "VEO 3 Frame",
    stylePreset: "Cinematic Luxury",
    aspectRatio: "9:16",
    tags: ["Modern Condos", "Twilight Shots", "Drone Angles"],
    price: "$5,600,000",
    address: "889 Pacific St, Yaletown",
    listingNo: "R2999054",
    agentName: "Lena Kowalski",
    brokerage: "eXp Realty",
    isProOnly: true,
    likesCount: 1750,
    remixCount: 47,
    gradientSeed: 320,
    createdAt: "2026-09-23T20:22:00Z",
  },
  {
    id: "spy-11876",
    title: "GOLDEN HOUR — WINE COUNTRY VILLA",
    prompt:
      "Golden hour vineyard estate with stone courtyard, cypress allee leading to the entry, warm tuscan light, luxury lifestyle photography, leica 50mm",
    aiModel: "Gemini 2.5 Flash Image",
    stylePreset: "Sunset Glow",
    aspectRatio: "16:9",
    tags: ["Luxury Villas"],
    price: "$7,900,000",
    address: "Langley Wine Country, BC",
    listingNo: "R3011876",
    agentName: "Elena Vance",
    brokerage: "The Agency • Beverly Hills Estates",
    isProOnly: false,
    likesCount: 890,
    remixCount: 14,
    gradientSeed: 42,
    createdAt: "2026-09-22T17:55:00Z",
  },
  {
    id: "spy-55213",
    title: "CLEAN EDITORIAL — MINIMAL TOWNHOME",
    prompt:
      "Clean editorial front elevation of a minimal townhome, charcoal brick and white oak garage door, overcast softbox light, geometric composition, architectural magazine cover",
    aiModel: "Prompt Post Engine v4.2",
    stylePreset: "Clean Editorial",
    aspectRatio: "4:5",
    tags: ["Modern Condos", "Open House Flyers"],
    price: "$1,540,000",
    address: "428 E 11th Ave, Mount Pleasant",
    listingNo: "R3055213",
    agentName: "Marcus Sterling",
    brokerage: "Sterling Luxury Group",
    isProOnly: false,
    likesCount: 265,
    remixCount: 4,
    gradientSeed: 150,
    createdAt: "2026-09-21T13:20:00Z",
  },
];

/** Fetch published gallery posts; falls back to the seed set when Supabase
 *  is not configured (so the site renders out of the box). */
export async function getPosts(): Promise<Post[]> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return SEED_POSTS;

  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("published", true)
    .order("created_at", { ascending: false });

  if (error || !data || data.length === 0) return SEED_POSTS;

  return data.map((row) => ({
    id: row.id,
    title: row.title,
    prompt: row.prompt,
    aiModel: row.ai_model,
    stylePreset: row.style_preset,
    aspectRatio: row.aspect_ratio,
    tags: row.tags ?? [],
    price: row.price ? String(row.price) : undefined,
    address: row.address ?? undefined,
    listingNo: row.listing_no ?? undefined,
    agentName: row.agent_name ?? "The Spy Agency",
    brokerage: row.brokerage ?? "",
    isProOnly: row.is_pro_only ?? false,
    likesCount: row.likes_count ?? 0,
    remixCount: row.remix_count ?? 0,
    gradientSeed: 0,
    imageUrl: row.image_url ?? undefined,
    createdAt: row.created_at,
  }));
}

export async function getPost(id: string): Promise<Post | null> {
  const all = await getPosts();
  return all.find((p) => p.id === id) ?? null;
}

export { isSupabaseConfigured };
