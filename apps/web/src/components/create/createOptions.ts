import type { AspectRatio } from '../../storage/types'

export type TemplateOption = {
  id: string
  label: string
  description: string
  category: string
}

export type TagOption = {
  id: string
  label: string
}

export type TagGroup = {
  id: string
  label: string
  tags: TagOption[]
}

export type AspectRatioOption = {
  value: AspectRatio
  label: string
  hint: string
}

export const templateOptions: TemplateOption[] = [
  {
    id: 'nature.alpine-lake.sunrise',
    label: 'Alpine lake sunrise',
    description: 'Calm water reflections with distant peaks.',
    category: 'Nature',
  },
  {
    id: 'nature.misty-pine-forest',
    label: 'Misty pine forest',
    description: 'Layered evergreens with soft morning haze.',
    category: 'Nature',
  },
  {
    id: 'nature.desert-dunes',
    label: 'Desert dunes',
    description: 'Rolling dunes with textured sand ripples.',
    category: 'Nature',
  },
  {
    id: 'travel.old-town-streets',
    label: 'Old town streets',
    description: 'Cobblestones, lanterns, and warm facades.',
    category: 'Travel',
  },
  {
    id: 'travel.coastal-lighthouse',
    label: 'Coastal lighthouse',
    description: 'Rocky shoreline with a glowing beacon.',
    category: 'Travel',
  },
  {
    id: 'travel.hot-air-balloons',
    label: 'Hot air balloons',
    description: 'Colorful balloons floating over a valley.',
    category: 'Travel',
  },
  {
    id: 'animals.fox-in-snow',
    label: 'Fox in snow',
    description: 'A red fox in a snowy meadow.',
    category: 'Animals',
  },
  {
    id: 'animals.koi-pond',
    label: 'Koi pond',
    description: 'Koi fish with lily pads and ripples.',
    category: 'Animals',
  },
  {
    id: 'still-life.fruit-bowl-linen',
    label: 'Fruit bowl on linen',
    description: 'A cozy still life by a sunlit window.',
    category: 'Still Life',
  },
  {
    id: 'still-life.flowers-in-vase',
    label: 'Flowers in vase',
    description: 'Fresh florals with soft ambient light.',
    category: 'Still Life',
  },
  {
    id: 'abstract.geometric-gradients',
    label: 'Geometric gradients',
    description: 'Smooth color transitions with bold shapes.',
    category: 'Abstract',
  },
  {
    id: 'abstract.stained-glass-symmetry',
    label: 'Stained glass symmetry',
    description: 'Symmetrical stained glass motifs.',
    category: 'Abstract',
  },
  {
    id: 'seasonal.cherry-blossoms',
    label: 'Cherry blossoms',
    description: 'Spring blooms along a peaceful walkway.',
    category: 'Seasonal',
  },
  {
    id: 'seasonal.winter-cabin-lights',
    label: 'Winter cabin lights',
    description: 'Warm lights in a snowy landscape.',
    category: 'Seasonal',
  },
  {
    id: 'fantasy.cozy-wizard-study',
    label: 'Cozy wizard study',
    description: 'Books, warm light, and whimsical details.',
    category: 'Fantasy',
  },
  {
    id: 'fantasy.sky-islands',
    label: 'Sky islands',
    description: 'Floating islands with waterfalls and clouds.',
    category: 'Fantasy',
  },
]

export const styleGroups: TagGroup[] = [
  {
    id: 'medium',
    label: 'Medium and Technique',
    tags: [
      { id: 'medium.watercolor', label: 'Watercolor wash' },
      { id: 'medium.gouache', label: 'Gouache poster paint' },
      { id: 'medium.oil-impasto', label: 'Oil painting impasto' },
      { id: 'medium.colored-pencil', label: 'Colored pencil illustration' },
      { id: 'medium.ink-linework', label: 'Ink linework' },
      { id: 'medium.charcoal', label: 'Charcoal sketch' },
      { id: 'medium.pastel-chalk', label: 'Pastel chalk' },
      { id: 'medium.paper-cut-collage', label: 'Paper cut collage' },
      { id: 'medium.stained-glass-mosaic', label: 'Stained glass mosaic' },
      { id: 'medium.low-poly-3d', label: 'Low poly 3D render' },
      { id: 'medium.claymation', label: 'Claymation look' },
      { id: 'medium.pixel-art', label: 'Pixel art' },
      { id: 'medium.vector-flat', label: 'Vector flat design' },
      { id: 'medium.linocut', label: 'Linocut print texture' },
      { id: 'medium.woodblock-print', label: 'Japanese woodblock print look' },
      { id: 'medium.art-nouveau', label: 'Art Nouveau ornamental poster look' },
    ],
  },
  {
    id: 'surface',
    label: 'Surface and Material',
    tags: [
      { id: 'surface.cold-press-paper', label: 'Cold press paper texture' },
      { id: 'surface.canvas-weave', label: 'Canvas weave' },
      { id: 'surface.parchment', label: 'Parchment' },
      { id: 'surface.glossy-enamel', label: 'Glossy enamel' },
      { id: 'surface.ceramic-tile', label: 'Ceramic tile' },
      { id: 'surface.weathered-wood', label: 'Weathered wood' },
      { id: 'surface.metallic-foil', label: 'Metallic foil accents' },
    ],
  },
  {
    id: 'lighting',
    label: 'Lighting and Mood',
    tags: [
      { id: 'lighting.golden-hour', label: 'Golden hour glow' },
      { id: 'lighting.soft-overcast', label: 'Soft overcast' },
      { id: 'lighting.neon-night-rain', label: 'Neon night rain' },
      { id: 'lighting.candlelit', label: 'Candlelit warmth' },
      { id: 'lighting.dreamy-haze', label: 'Dreamy haze' },
      { id: 'lighting.high-contrast', label: 'Crisp high contrast' },
    ],
  },
  {
    id: 'composition',
    label: 'Composition and Camera',
    tags: [
      { id: 'composition.wide-cinematic', label: 'Wide cinematic' },
      { id: 'composition.macro', label: 'Macro close up' },
      { id: 'composition.top-down', label: 'Top down flat lay' },
      { id: 'composition.centered-symmetry', label: 'Centered symmetry' },
      { id: 'composition.rule-of-thirds', label: 'Rule of thirds' },
    ],
  },
]

export const moodOptions: TagOption[] = [
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

export const paletteOptions: TagOption[] = [
  { id: 'palette.pastel-spring', label: 'Pastel spring' },
  { id: 'palette.autumn-earth', label: 'Autumn earth tones' },
  { id: 'palette.teal-orange', label: 'Teal and orange cinematic' },
  { id: 'palette.monochrome-ink', label: 'Monochrome ink' },
  { id: 'palette.jewel-tones', label: 'Jewel tones' },
]

export const aspectRatioOptions: AspectRatioOption[] = [
  { value: '1:1', label: '1:1', hint: 'Square classic' },
  { value: '4:3', label: '4:3', hint: 'Balanced landscape' },
  { value: '16:9', label: '16:9', hint: 'Cinematic wide' },
  { value: '9:16', label: '9:16', hint: 'Tall portrait' },
  { value: '3:2', label: '3:2', hint: 'Photo standard' },
  { value: '2:3', label: '2:3', hint: 'Portrait standard' },
]

export const pieceCountMarks = [
  { value: 120, label: '120' },
  { value: 200, label: '200' },
  { value: 300, label: '300' },
  { value: 500, label: '500' },
  { value: 750, label: '750' },
]
