export type StyleTagGroup = 'medium' | 'surface' | 'lighting' | 'composition' | 'palette'

export type StyleTag = {
  id: string
  label: string
  group: StyleTagGroup
}

export type BaseTemplate = {
  id: string
  label: string
  prompt: string
}

export type MoodTag = {
  id: string
  label: string
}

export const baseTemplates: BaseTemplate[] = [
  {
    id: 'nature.alpine-lake.sunrise',
    label: 'Alpine lake at sunrise',
    prompt: 'An alpine lake at sunrise with calm water reflecting nearby mountains',
  },
  {
    id: 'nature.misty-pine-forest',
    label: 'Misty pine forest',
    prompt: 'A misty pine forest with layered evergreens and soft morning light',
  },
  {
    id: 'nature.desert-dunes',
    label: 'Desert dunes',
    prompt: 'Rolling desert dunes with rippled sand textures under a clear sky',
  },
  {
    id: 'nature.tropical-reef',
    label: 'Tropical reef',
    prompt: 'A tropical coral reef scene with colorful fish and bright underwater light',
  },
  {
    id: 'nature.waterfall-canyon',
    label: 'Waterfall canyon',
    prompt: 'A canyon waterfall with lush greenery, mist, and layered rock walls',
  },
  {
    id: 'travel.old-town-streets',
    label: 'Old town streets',
    prompt: 'Charming old town streets with warm lanterns and cobblestone paths',
  },
  {
    id: 'travel.mountain-village',
    label: 'Mountain village',
    prompt: 'A cozy mountain village nestled among peaks with rustic cabins',
  },
  {
    id: 'travel.coastal-lighthouse',
    label: 'Coastal lighthouse',
    prompt: 'A coastal lighthouse overlooking a rocky shoreline at sunset',
  },
  {
    id: 'travel.harbor-boats',
    label: 'Harbor boats',
    prompt: 'A harbor scene with small boats, reflections, and seaside buildings',
  },
  {
    id: 'travel.hot-air-balloons',
    label: 'Hot air balloons',
    prompt: 'Colorful hot air balloons floating over a scenic landscape',
  },
  {
    id: 'animals.fox-in-snow',
    label: 'Fox in snow',
    prompt: 'A red fox in a snowy meadow with soft falling snowflakes',
  },
  {
    id: 'animals.owl-on-branch',
    label: 'Owl on branch',
    prompt: 'A calm owl perched on a branch with a gentle forest backdrop',
  },
  {
    id: 'animals.koi-pond',
    label: 'Koi pond',
    prompt: 'A koi pond with lily pads, ripples, and bright koi fish',
  },
  {
    id: 'animals.horses-at-dawn',
    label: 'Horses at dawn',
    prompt: 'Horses at dawn in a misty field with warm early light',
  },
  {
    id: 'animals.butterflies-in-meadow',
    label: 'Butterflies in meadow',
    prompt: 'Butterflies fluttering over a flower-filled meadow in soft daylight',
  },
  {
    id: 'still-life.fruit-bowl-linen',
    label: 'Fruit bowl on linen',
    prompt: 'A still life of a fruit bowl on a linen cloth near a window',
  },
  {
    id: 'still-life.tea-set-window',
    label: 'Tea set by window',
    prompt: 'A tea set by a window with gentle light and warm tones',
  },
  {
    id: 'still-life.autumn-leaves',
    label: 'Autumn leaves',
    prompt: 'A still life of autumn leaves with rich textures and warm colors',
  },
  {
    id: 'still-life.flowers-in-vase',
    label: 'Flowers in vase',
    prompt: 'Fresh flowers in a vase on a tabletop with soft ambient light',
  },
  {
    id: 'abstract.geometric-gradients',
    label: 'Geometric gradients',
    prompt: 'Abstract geometric gradients with smooth color transitions',
  },
  {
    id: 'abstract.stained-glass-symmetry',
    label: 'Stained glass symmetry',
    prompt: 'A symmetrical stained glass inspired pattern with bold shapes',
  },
  {
    id: 'abstract.swirling-inks',
    label: 'Swirling inks',
    prompt: 'Swirling inks with fluid motion and layered colors',
  },
  {
    id: 'abstract.mosaic-tessellations',
    label: 'Mosaic tessellations',
    prompt: 'A mosaic tessellation pattern with repeating geometric forms',
  },
  {
    id: 'abstract.fractals',
    label: 'Fractals',
    prompt: 'Fractal-inspired patterns with intricate repeating structures',
  },
  {
    id: 'abstract.sacred-geometry',
    label: 'Sacred geometry',
    prompt: 'Sacred geometry motifs with clean lines and balanced symmetry',
  },
  {
    id: 'seasonal.cherry-blossoms',
    label: 'Cherry blossoms',
    prompt: 'Cherry blossoms in bloom along a peaceful walkway',
  },
  {
    id: 'seasonal.halloween-pumpkins',
    label: 'Halloween pumpkins',
    prompt: 'A cozy autumn scene with pumpkins and gentle candlelight',
  },
  {
    id: 'seasonal.winter-cabin-lights',
    label: 'Winter cabin lights',
    prompt: 'A winter cabin with warm lights glowing in a snowy landscape',
  },
  {
    id: 'seasonal.spring-rain-cityscape',
    label: 'Spring rain cityscape',
    prompt: 'A spring rain cityscape with reflections on wet streets',
  },
  {
    id: 'fantasy.cozy-wizard-study',
    label: 'Cozy wizard study',
    prompt: 'A cozy wizard study with books, warm light, and whimsical details',
  },
  {
    id: 'fantasy.floating-lantern-festival',
    label: 'Floating lantern festival',
    prompt: 'A floating lantern festival over a river with glowing lights',
  },
  {
    id: 'fantasy.enchanted-library',
    label: 'Enchanted library',
    prompt: 'An enchanted library with towering shelves and soft magical glow',
  },
  {
    id: 'fantasy.sky-islands',
    label: 'Sky islands',
    prompt: 'Floating sky islands with waterfalls and drifting clouds',
  },
  {
    id: 'fantasy.castles',
    label: 'Castles',
    prompt: 'A scenic castle on a hill with dramatic skies and rolling fields',
  },
]

export const styleTags: StyleTag[] = [
  { id: 'medium.watercolor', label: 'Watercolor wash', group: 'medium' },
  { id: 'medium.gouache', label: 'Gouache poster paint', group: 'medium' },
  { id: 'medium.oil-impasto', label: 'Oil painting impasto', group: 'medium' },
  { id: 'medium.colored-pencil', label: 'Colored pencil illustration', group: 'medium' },
  { id: 'medium.ink-linework', label: 'Ink linework', group: 'medium' },
  { id: 'medium.charcoal', label: 'Charcoal sketch', group: 'medium' },
  { id: 'medium.pastel-chalk', label: 'Pastel chalk', group: 'medium' },
  { id: 'medium.paper-cut-collage', label: 'Paper cut collage', group: 'medium' },
  { id: 'medium.stained-glass-mosaic', label: 'Stained glass mosaic', group: 'medium' },
  { id: 'medium.low-poly-3d', label: 'Low poly 3D render', group: 'medium' },
  { id: 'medium.claymation', label: 'Claymation look', group: 'medium' },
  { id: 'medium.pixel-art', label: 'Pixel art', group: 'medium' },
  { id: 'medium.vector-flat', label: 'Vector flat design', group: 'medium' },
  { id: 'medium.linocut', label: 'Linocut print texture', group: 'medium' },
  { id: 'medium.woodblock-print', label: 'Japanese woodblock print look', group: 'medium' },
  { id: 'medium.art-nouveau', label: 'Art Nouveau ornamental poster look', group: 'medium' },
  { id: 'surface.cold-press-paper', label: 'Cold press paper texture', group: 'surface' },
  { id: 'surface.canvas-weave', label: 'Canvas weave', group: 'surface' },
  { id: 'surface.parchment', label: 'Parchment', group: 'surface' },
  { id: 'surface.glossy-enamel', label: 'Glossy enamel', group: 'surface' },
  { id: 'surface.ceramic-tile', label: 'Ceramic tile', group: 'surface' },
  { id: 'surface.weathered-wood', label: 'Weathered wood', group: 'surface' },
  { id: 'surface.metallic-foil', label: 'Metallic foil accents', group: 'surface' },
  { id: 'lighting.golden-hour', label: 'Golden hour glow', group: 'lighting' },
  { id: 'lighting.soft-overcast', label: 'Soft overcast', group: 'lighting' },
  { id: 'lighting.neon-night-rain', label: 'Neon night rain', group: 'lighting' },
  { id: 'lighting.candlelit', label: 'Candlelit warmth', group: 'lighting' },
  { id: 'lighting.dreamy-haze', label: 'Dreamy haze', group: 'lighting' },
  { id: 'lighting.high-contrast', label: 'Crisp high contrast', group: 'lighting' },
  { id: 'composition.wide-cinematic', label: 'Wide cinematic', group: 'composition' },
  { id: 'composition.macro', label: 'Macro close up', group: 'composition' },
  { id: 'composition.top-down', label: 'Top down flat lay', group: 'composition' },
  { id: 'composition.centered-symmetry', label: 'Centered symmetry', group: 'composition' },
  { id: 'composition.rule-of-thirds', label: 'Rule of thirds', group: 'composition' },
  { id: 'palette.pastel-spring', label: 'Pastel spring', group: 'palette' },
  { id: 'palette.autumn-earth', label: 'Autumn earth tones', group: 'palette' },
  { id: 'palette.teal-orange', label: 'Teal and orange cinematic', group: 'palette' },
  { id: 'palette.monochrome-ink', label: 'Monochrome ink', group: 'palette' },
  { id: 'palette.jewel-tones', label: 'Jewel tones', group: 'palette' },
]

export const moodTags: MoodTag[] = [
  { id: 'mood.cozy', label: 'Cozy' },
  { id: 'mood.serene', label: 'Serene' },
  { id: 'mood.vibrant', label: 'Vibrant' },
  { id: 'mood.whimsical', label: 'Whimsical' },
  { id: 'mood.dramatic', label: 'Dramatic' },
  { id: 'mood.melancholy', label: 'Melancholy' },
  { id: 'mood.mysterious', label: 'Mysterious' },
  { id: 'mood.playful', label: 'Playful' },
  { id: 'mood.warm', label: 'Warm' },
  { id: 'mood.cool', label: 'Cool' },
]

const baseTemplateById = new Map(baseTemplates.map((template) => [template.id, template]))
const styleTagById = new Map(styleTags.map((tag) => [tag.id, tag]))
const moodTagById = new Map(moodTags.map((tag) => [tag.id, tag]))
const paletteTagById = new Map(styleTags.filter((tag) => tag.group === 'palette').map((tag) => [tag.id, tag]))

export function getBaseTemplate(id: string): BaseTemplate | undefined {
  return baseTemplateById.get(id)
}

export function getStyleTag(id: string): StyleTag | undefined {
  return styleTagById.get(id)
}

export function getMoodTag(id: string): MoodTag | undefined {
  return moodTagById.get(id)
}

export function getPaletteTag(id: string): StyleTag | undefined {
  return paletteTagById.get(id)
}
