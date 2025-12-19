var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/http.ts
function jsonResponse(data, init = {}) {
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json; charset=utf-8");
  }
  return new Response(JSON.stringify(data), {
    ...init,
    headers
  });
}
__name(jsonResponse, "jsonResponse");
function errorResponse(status, message, details) {
  return jsonResponse(
    {
      error: message,
      details: details ?? null
    },
    { status }
  );
}
__name(errorResponse, "errorResponse");

// src/gemini/geminiClient.ts
var GeminiApiError = class extends Error {
  static {
    __name(this, "GeminiApiError");
  }
  status;
  payload;
  constructor(message, status, payload) {
    super(message);
    this.name = "GeminiApiError";
    this.status = status;
    this.payload = payload;
  }
};
function createGeminiClient(env) {
  const apiKey = env.AI_PUZZLE_MAKER__GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing AI_PUZZLE_MAKER__GEMINI_API_KEY");
  }
  const baseUrl = env.AI_PUZZLE_MAKER__GEMINI_BASE_URL || "https://generativelanguage.googleapis.com";
  const trimmedBase = baseUrl.replace(/\/+$/, "");
  return {
    async generateContent(model, body) {
      const url = `${trimmedBase}/v1beta/models/${model}:generateContent`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "content-type": "application/json; charset=utf-8",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify(body)
      });
      if (!response.ok) {
        const payload = await readErrorPayload(response);
        const message = payloadMessage(payload) || `Gemini API error (${response.status})`;
        throw new GeminiApiError(message, response.status, payload);
      }
      return await response.json();
    }
  };
}
__name(createGeminiClient, "createGeminiClient");
async function readErrorPayload(response) {
  try {
    return await response.json();
  } catch {
    try {
      return await response.text();
    } catch {
      return "";
    }
  }
}
__name(readErrorPayload, "readErrorPayload");
function payloadMessage(payload) {
  if (!payload) {
    return null;
  }
  if (typeof payload === "string") {
    return payload.trim() || null;
  }
  return payload.error?.message ?? null;
}
__name(payloadMessage, "payloadMessage");

// src/gemini/styleTaxonomy.ts
var baseTemplates = [
  {
    id: "nature.alpine-lake.sunrise",
    label: "Alpine lake at sunrise",
    prompt: "An alpine lake at sunrise with calm water reflecting nearby mountains"
  },
  {
    id: "nature.misty-pine-forest",
    label: "Misty pine forest",
    prompt: "A misty pine forest with layered evergreens and soft morning light"
  },
  {
    id: "nature.desert-dunes",
    label: "Desert dunes",
    prompt: "Rolling desert dunes with rippled sand textures under a clear sky"
  },
  {
    id: "nature.tropical-reef",
    label: "Tropical reef",
    prompt: "A tropical coral reef scene with colorful fish and bright underwater light"
  },
  {
    id: "nature.waterfall-canyon",
    label: "Waterfall canyon",
    prompt: "A canyon waterfall with lush greenery, mist, and layered rock walls"
  },
  {
    id: "travel.old-town-streets",
    label: "Old town streets",
    prompt: "Charming old town streets with warm lanterns and cobblestone paths"
  },
  {
    id: "travel.mountain-village",
    label: "Mountain village",
    prompt: "A cozy mountain village nestled among peaks with rustic cabins"
  },
  {
    id: "travel.coastal-lighthouse",
    label: "Coastal lighthouse",
    prompt: "A coastal lighthouse overlooking a rocky shoreline at sunset"
  },
  {
    id: "travel.harbor-boats",
    label: "Harbor boats",
    prompt: "A harbor scene with small boats, reflections, and seaside buildings"
  },
  {
    id: "travel.hot-air-balloons",
    label: "Hot air balloons",
    prompt: "Colorful hot air balloons floating over a scenic landscape"
  },
  {
    id: "animals.fox-in-snow",
    label: "Fox in snow",
    prompt: "A red fox in a snowy meadow with soft falling snowflakes"
  },
  {
    id: "animals.owl-on-branch",
    label: "Owl on branch",
    prompt: "A calm owl perched on a branch with a gentle forest backdrop"
  },
  {
    id: "animals.koi-pond",
    label: "Koi pond",
    prompt: "A koi pond with lily pads, ripples, and bright koi fish"
  },
  {
    id: "animals.horses-at-dawn",
    label: "Horses at dawn",
    prompt: "Horses at dawn in a misty field with warm early light"
  },
  {
    id: "animals.butterflies-in-meadow",
    label: "Butterflies in meadow",
    prompt: "Butterflies fluttering over a flower-filled meadow in soft daylight"
  },
  {
    id: "still-life.fruit-bowl-linen",
    label: "Fruit bowl on linen",
    prompt: "A still life of a fruit bowl on a linen cloth near a window"
  },
  {
    id: "still-life.tea-set-window",
    label: "Tea set by window",
    prompt: "A tea set by a window with gentle light and warm tones"
  },
  {
    id: "still-life.autumn-leaves",
    label: "Autumn leaves",
    prompt: "A still life of autumn leaves with rich textures and warm colors"
  },
  {
    id: "still-life.flowers-in-vase",
    label: "Flowers in vase",
    prompt: "Fresh flowers in a vase on a tabletop with soft ambient light"
  },
  {
    id: "abstract.geometric-gradients",
    label: "Geometric gradients",
    prompt: "Abstract geometric gradients with smooth color transitions"
  },
  {
    id: "abstract.stained-glass-symmetry",
    label: "Stained glass symmetry",
    prompt: "A symmetrical stained glass inspired pattern with bold shapes"
  },
  {
    id: "abstract.swirling-inks",
    label: "Swirling inks",
    prompt: "Swirling inks with fluid motion and layered colors"
  },
  {
    id: "abstract.mosaic-tessellations",
    label: "Mosaic tessellations",
    prompt: "A mosaic tessellation pattern with repeating geometric forms"
  },
  {
    id: "abstract.fractals",
    label: "Fractals",
    prompt: "Fractal-inspired patterns with intricate repeating structures"
  },
  {
    id: "abstract.sacred-geometry",
    label: "Sacred geometry",
    prompt: "Sacred geometry motifs with clean lines and balanced symmetry"
  },
  {
    id: "seasonal.cherry-blossoms",
    label: "Cherry blossoms",
    prompt: "Cherry blossoms in bloom along a peaceful walkway"
  },
  {
    id: "seasonal.halloween-pumpkins",
    label: "Halloween pumpkins",
    prompt: "A cozy autumn scene with pumpkins and gentle candlelight"
  },
  {
    id: "seasonal.winter-cabin-lights",
    label: "Winter cabin lights",
    prompt: "A winter cabin with warm lights glowing in a snowy landscape"
  },
  {
    id: "seasonal.spring-rain-cityscape",
    label: "Spring rain cityscape",
    prompt: "A spring rain cityscape with reflections on wet streets"
  },
  {
    id: "fantasy.cozy-wizard-study",
    label: "Cozy wizard study",
    prompt: "A cozy wizard study with books, warm light, and whimsical details"
  },
  {
    id: "fantasy.floating-lantern-festival",
    label: "Floating lantern festival",
    prompt: "A floating lantern festival over a river with glowing lights"
  },
  {
    id: "fantasy.enchanted-library",
    label: "Enchanted library",
    prompt: "An enchanted library with towering shelves and soft magical glow"
  },
  {
    id: "fantasy.sky-islands",
    label: "Sky islands",
    prompt: "Floating sky islands with waterfalls and drifting clouds"
  },
  {
    id: "fantasy.castles",
    label: "Castles",
    prompt: "A scenic castle on a hill with dramatic skies and rolling fields"
  }
];
var styleTags = [
  { id: "medium.watercolor", label: "Watercolor wash", group: "medium" },
  { id: "medium.gouache", label: "Gouache poster paint", group: "medium" },
  { id: "medium.oil-impasto", label: "Oil painting impasto", group: "medium" },
  { id: "medium.colored-pencil", label: "Colored pencil illustration", group: "medium" },
  { id: "medium.ink-linework", label: "Ink linework", group: "medium" },
  { id: "medium.charcoal", label: "Charcoal sketch", group: "medium" },
  { id: "medium.pastel-chalk", label: "Pastel chalk", group: "medium" },
  { id: "medium.paper-cut-collage", label: "Paper cut collage", group: "medium" },
  { id: "medium.stained-glass-mosaic", label: "Stained glass mosaic", group: "medium" },
  { id: "medium.low-poly-3d", label: "Low poly 3D render", group: "medium" },
  { id: "medium.claymation", label: "Claymation look", group: "medium" },
  { id: "medium.pixel-art", label: "Pixel art", group: "medium" },
  { id: "medium.vector-flat", label: "Vector flat design", group: "medium" },
  { id: "medium.linocut", label: "Linocut print texture", group: "medium" },
  { id: "medium.woodblock-print", label: "Japanese woodblock print look", group: "medium" },
  { id: "medium.art-nouveau", label: "Art Nouveau ornamental poster look", group: "medium" },
  { id: "surface.cold-press-paper", label: "Cold press paper texture", group: "surface" },
  { id: "surface.canvas-weave", label: "Canvas weave", group: "surface" },
  { id: "surface.parchment", label: "Parchment", group: "surface" },
  { id: "surface.glossy-enamel", label: "Glossy enamel", group: "surface" },
  { id: "surface.ceramic-tile", label: "Ceramic tile", group: "surface" },
  { id: "surface.weathered-wood", label: "Weathered wood", group: "surface" },
  { id: "surface.metallic-foil", label: "Metallic foil accents", group: "surface" },
  { id: "lighting.golden-hour", label: "Golden hour glow", group: "lighting" },
  { id: "lighting.soft-overcast", label: "Soft overcast", group: "lighting" },
  { id: "lighting.neon-night-rain", label: "Neon night rain", group: "lighting" },
  { id: "lighting.candlelit", label: "Candlelit warmth", group: "lighting" },
  { id: "lighting.dreamy-haze", label: "Dreamy haze", group: "lighting" },
  { id: "lighting.high-contrast", label: "Crisp high contrast", group: "lighting" },
  { id: "composition.wide-cinematic", label: "Wide cinematic", group: "composition" },
  { id: "composition.macro", label: "Macro close up", group: "composition" },
  { id: "composition.top-down", label: "Top down flat lay", group: "composition" },
  { id: "composition.centered-symmetry", label: "Centered symmetry", group: "composition" },
  { id: "composition.rule-of-thirds", label: "Rule of thirds", group: "composition" },
  { id: "palette.pastel-spring", label: "Pastel spring", group: "palette" },
  { id: "palette.autumn-earth", label: "Autumn earth tones", group: "palette" },
  { id: "palette.teal-orange", label: "Teal and orange cinematic", group: "palette" },
  { id: "palette.monochrome-ink", label: "Monochrome ink", group: "palette" },
  { id: "palette.jewel-tones", label: "Jewel tones", group: "palette" }
];
var moodTags = [
  { id: "mood.cozy", label: "Cozy" },
  { id: "mood.serene", label: "Serene" },
  { id: "mood.vibrant", label: "Vibrant" },
  { id: "mood.whimsical", label: "Whimsical" },
  { id: "mood.dramatic", label: "Dramatic" },
  { id: "mood.melancholy", label: "Melancholy" },
  { id: "mood.mysterious", label: "Mysterious" },
  { id: "mood.playful", label: "Playful" },
  { id: "mood.warm", label: "Warm" },
  { id: "mood.cool", label: "Cool" }
];
var baseTemplateById = new Map(baseTemplates.map((template) => [template.id, template]));
var styleTagById = new Map(styleTags.map((tag) => [tag.id, tag]));
var moodTagById = new Map(moodTags.map((tag) => [tag.id, tag]));
var paletteTagById = new Map(styleTags.filter((tag) => tag.group === "palette").map((tag) => [tag.id, tag]));
function getBaseTemplate(id) {
  return baseTemplateById.get(id);
}
__name(getBaseTemplate, "getBaseTemplate");
function getStyleTag(id) {
  return styleTagById.get(id);
}
__name(getStyleTag, "getStyleTag");
function getMoodTag(id) {
  return moodTagById.get(id);
}
__name(getMoodTag, "getMoodTag");
function getPaletteTag(id) {
  return paletteTagById.get(id);
}
__name(getPaletteTag, "getPaletteTag");

// src/routes/imageGenerate.ts
var ALLOWED_ASPECT_RATIOS = /* @__PURE__ */ new Set(["1:1", "4:3", "16:9", "9:16", "3:2", "2:3"]);
var ALLOWED_IMAGE_MODELS = /* @__PURE__ */ new Set(["gemini-2.5-flash-image", "gemini-3-pro-image-preview"]);
async function handleImageGenerate(request, env) {
  if (request.method !== "POST") {
    return errorResponse(405, "Method not allowed");
  }
  let payload;
  try {
    payload = await request.json();
  } catch {
    return errorResponse(400, "Invalid JSON payload");
  }
  const validation = validatePayload(payload);
  if (!validation.ok) {
    return errorResponse(400, "Invalid request", { issues: validation.issues });
  }
  const promptUsed = buildPrompt(payload);
  const requestBody = {
    contents: [
      {
        role: "user",
        parts: [{ text: promptUsed }]
      }
    ],
    generationConfig: {
      imageConfig: {
        aspectRatio: payload.aspectRatio
      }
    }
  };
  const client = createGeminiClient(env);
  try {
    const response = await client.generateContent(payload.imageModel, requestBody);
    const imagePart = extractInlineImage(response);
    if (!imagePart) {
      return errorResponse(502, "Image model returned no image data");
    }
    const imageBase64 = imagePart.inlineData.data;
    const imageMimeType = imagePart.inlineData.mimeType || "image/png";
    const dimensions = getImageDimensions(imageMimeType, imageBase64);
    return jsonResponse({
      imageMimeType,
      imageBase64,
      width: dimensions.width,
      height: dimensions.height,
      promptUsed,
      model: payload.imageModel
    });
  } catch (error) {
    if (error instanceof GeminiApiError) {
      return errorResponse(502, error.message);
    }
    const message = error instanceof Error ? error.message : "Unexpected error";
    return errorResponse(500, message);
  }
}
__name(handleImageGenerate, "handleImageGenerate");
function validatePayload(payload) {
  const issues = [];
  if (!payload || typeof payload !== "object") {
    return { ok: false, issues: ["Payload must be an object"] };
  }
  if (payload.kind !== "default" && payload.kind !== "user") {
    issues.push('kind must be "default" or "user"');
  }
  if (!ALLOWED_ASPECT_RATIOS.has(payload.aspectRatio)) {
    issues.push("aspectRatio is invalid");
  }
  if (!ALLOWED_IMAGE_MODELS.has(payload.imageModel)) {
    issues.push("imageModel is not allowed");
  }
  if (payload.kind === "default") {
    if (typeof payload.finalPrompt !== "string" || !payload.finalPrompt.trim()) {
      issues.push("finalPrompt is required");
    }
    if (!Array.isArray(payload.negativeConstraints)) {
      issues.push("negativeConstraints must be an array of strings");
    } else {
      for (const item of payload.negativeConstraints) {
        if (typeof item !== "string") {
          issues.push("negativeConstraints must be an array of strings");
          break;
        }
      }
    }
  }
  if (payload.kind === "user") {
    if (typeof payload.userPrompt !== "string" || !payload.userPrompt.trim()) {
      issues.push("userPrompt is required");
    }
    if (payload.styleTags !== void 0) {
      if (!Array.isArray(payload.styleTags)) {
        issues.push("styleTags must be an array of strings");
      } else {
        for (const tagId of payload.styleTags) {
          if (typeof tagId !== "string" || !getStyleTag(tagId)) {
            issues.push(`styleTags contains invalid id: ${String(tagId)}`);
          }
        }
      }
    }
  }
  return issues.length > 0 ? { ok: false, issues } : { ok: true };
}
__name(validatePayload, "validatePayload");
function buildPrompt(payload) {
  const guardrails = [
    "Create an original, copyright-safe scene.",
    "Do not include copyrighted characters, logos, brand names, or trademarks.",
    "Do not mention living artists.",
    "Avoid recognizable IP.",
    "Avoid text overlays unless explicitly requested."
  ];
  if (payload.kind === "default") {
    const negatives = payload.negativeConstraints.length > 0 ? `Avoid: ${payload.negativeConstraints.join(", ")}.` : "";
    return [payload.finalPrompt.trim(), negatives, ...guardrails].filter(Boolean).join(" ");
  }
  const styleLine = payload.styleTags && payload.styleTags.length > 0 ? `Style tags: ${payload.styleTags.map((id) => getStyleTag(id).label).join(", ")}.` : "";
  return [payload.userPrompt.trim(), styleLine, ...guardrails].filter(Boolean).join(" ");
}
__name(buildPrompt, "buildPrompt");
function extractInlineImage(response) {
  const candidates = response.candidates ?? [];
  for (const candidate of candidates) {
    const parts = candidate.content?.parts ?? [];
    for (const part of parts) {
      if (part.inlineData?.data) {
        return { inlineData: part.inlineData };
      }
    }
  }
  return null;
}
__name(extractInlineImage, "extractInlineImage");
function getImageDimensions(mimeType, base64) {
  const bytes = base64ToBytes(base64);
  if (mimeType === "image/png") {
    const png = parsePngDimensions(bytes);
    if (png) {
      return png;
    }
  }
  if (mimeType === "image/webp") {
    const webp = parseWebpDimensions(bytes);
    if (webp) {
      return webp;
    }
  }
  return { width: 0, height: 0 };
}
__name(getImageDimensions, "getImageDimensions");
function base64ToBytes(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
__name(base64ToBytes, "base64ToBytes");
function parsePngDimensions(bytes) {
  if (bytes.length < 24) {
    return null;
  }
  const pngSignature = [137, 80, 78, 71, 13, 10, 26, 10];
  for (let i = 0; i < pngSignature.length; i += 1) {
    if (bytes[i] !== pngSignature[i]) {
      return null;
    }
  }
  const width = readUint32BE(bytes, 16);
  const height = readUint32BE(bytes, 20);
  if (width <= 0 || height <= 0) {
    return null;
  }
  return { width, height };
}
__name(parsePngDimensions, "parsePngDimensions");
function parseWebpDimensions(bytes) {
  if (bytes.length < 30) {
    return null;
  }
  if (bytes[0] !== 82 || bytes[1] !== 73 || bytes[2] !== 70 || bytes[3] !== 70 || bytes[8] !== 87 || bytes[9] !== 69 || bytes[10] !== 66 || bytes[11] !== 80) {
    return null;
  }
  const chunkType = String.fromCharCode(bytes[12], bytes[13], bytes[14], bytes[15]);
  if (chunkType === "VP8X") {
    const width = 1 + readUint24LE(bytes, 24);
    const height = 1 + readUint24LE(bytes, 27);
    return { width, height };
  }
  if (chunkType === "VP8 ") {
    if (bytes.length < 30) {
      return null;
    }
    const width = bytes[26] | bytes[27] << 8;
    const height = bytes[28] | bytes[29] << 8;
    return { width, height };
  }
  return null;
}
__name(parseWebpDimensions, "parseWebpDimensions");
function readUint32BE(bytes, offset) {
  return (bytes[offset] << 24 | bytes[offset + 1] << 16 | bytes[offset + 2] << 8 | bytes[offset + 3]) >>> 0;
}
__name(readUint32BE, "readUint32BE");
function readUint24LE(bytes, offset) {
  return bytes[offset] | bytes[offset + 1] << 8 | bytes[offset + 2] << 16;
}
__name(readUint24LE, "readUint24LE");

// src/routes/modelsList.ts
var TEXT_MODELS = ["gemini-2.5-flash"];
var IMAGE_MODELS = ["gemini-2.5-flash-image", "gemini-3-pro-image-preview"];
function handleModelsList() {
  return jsonResponse({
    textModels: TEXT_MODELS,
    imageModels: IMAGE_MODELS
  });
}
__name(handleModelsList, "handleModelsList");

// src/routes/promptCompose.ts
var MODEL_ID = "gemini-2.5-flash";
var ALLOWED_ASPECT_RATIOS2 = /* @__PURE__ */ new Set(["1:1", "4:3", "16:9", "9:16", "3:2", "2:3"]);
async function handlePromptCompose(request, env) {
  if (request.method !== "POST") {
    return errorResponse(405, "Method not allowed");
  }
  let payload;
  try {
    payload = await request.json();
  } catch {
    return errorResponse(400, "Invalid JSON payload");
  }
  const validation = validatePayload2(payload);
  if (!validation.ok) {
    return errorResponse(400, "Invalid request", { issues: validation.issues });
  }
  const baseTemplate = getBaseTemplate(payload.baseTemplateId);
  const styleLabels = payload.styleTags.map((id) => getStyleTag(id).label);
  const moodLabels = (payload.moodTags ?? []).map((id) => getMoodTag(id).label);
  const paletteLabels = (payload.paletteTags ?? []).map((id) => getPaletteTag(id).label);
  const promptLines = [
    `Base template: ${baseTemplate.prompt}.`,
    `Style tags: ${styleLabels.join(", ")}.`,
    `Target aspect ratio: ${payload.aspectRatio}.`
  ];
  if (moodLabels.length > 0) {
    promptLines.push(`Mood tags: ${moodLabels.join(", ")}.`);
  }
  if (paletteLabels.length > 0) {
    promptLines.push(`Palette tags: ${paletteLabels.join(", ")}.`);
  }
  if (payload.extraDetails?.trim()) {
    promptLines.push(`Extra details: ${payload.extraDetails.trim()}.`);
  }
  const client = createGeminiClient(env);
  const requestBody = {
    system_instruction: {
      parts: [
        {
          text: "You are a prompt composer for a jigsaw puzzle image generator. Create an original, copyright-safe scene. Do not include copyrighted characters, logos, brand names, or trademarks. Do not mention living artists. Avoid recognizable IP. Avoid text overlays unless explicitly requested. Return only valid JSON that matches the schema."
        }
      ]
    },
    contents: [
      {
        role: "user",
        parts: [
          {
            text: promptLines.join("\n")
          }
        ]
      }
    ],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "object",
        properties: {
          title: { type: "string" },
          finalPrompt: { type: "string" },
          negativeConstraints: { type: "array", items: { type: "string" } },
          altText: { type: "string" },
          seedHint: { type: "string" }
        },
        required: ["finalPrompt", "altText"]
      }
    }
  };
  try {
    const response = await client.generateContent(MODEL_ID, requestBody);
    const responseText = extractFirstText(response);
    if (!responseText) {
      return errorResponse(502, "Prompt composer returned no content");
    }
    const parsed = safeJsonParse(responseText);
    if (!parsed || typeof parsed !== "object") {
      return errorResponse(502, "Prompt composer returned invalid JSON");
    }
    const finalPrompt = typeof parsed.finalPrompt === "string" ? parsed.finalPrompt.trim() : "";
    const altText = typeof parsed.altText === "string" ? parsed.altText.trim() : "";
    if (!finalPrompt || !altText) {
      return errorResponse(502, "Prompt composer returned incomplete data");
    }
    const title = typeof parsed.title === "string" && parsed.title.trim() ? parsed.title.trim() : "Untitled";
    const negativeConstraints = Array.isArray(parsed.negativeConstraints) ? parsed.negativeConstraints.map((item) => typeof item === "string" ? item.trim() : "").filter((item) => item.length > 0) : [];
    return jsonResponse({
      title,
      finalPrompt,
      negativeConstraints,
      altText,
      model: MODEL_ID
    });
  } catch (error) {
    if (error instanceof GeminiApiError) {
      return errorResponse(502, error.message);
    }
    const message = error instanceof Error ? error.message : "Unexpected error";
    return errorResponse(500, message);
  }
}
__name(handlePromptCompose, "handlePromptCompose");
function validatePayload2(payload) {
  const issues = [];
  if (!payload || typeof payload !== "object") {
    return { ok: false, issues: ["Payload must be an object"] };
  }
  if (typeof payload.baseTemplateId !== "string" || !payload.baseTemplateId.trim()) {
    issues.push("baseTemplateId is required");
  } else if (!getBaseTemplate(payload.baseTemplateId)) {
    issues.push("baseTemplateId is not recognized");
  }
  if (!Array.isArray(payload.styleTags)) {
    issues.push("styleTags must be an array of strings");
  } else {
    if (payload.styleTags.length === 0) {
      issues.push("styleTags must not be empty");
    }
    for (const tagId of payload.styleTags) {
      if (typeof tagId !== "string" || !getStyleTag(tagId)) {
        issues.push(`styleTags contains invalid id: ${String(tagId)}`);
      }
    }
  }
  if (!ALLOWED_ASPECT_RATIOS2.has(payload.aspectRatio)) {
    issues.push("aspectRatio is invalid");
  }
  if (payload.moodTags !== void 0) {
    if (!Array.isArray(payload.moodTags)) {
      issues.push("moodTags must be an array of strings");
    } else {
      for (const tagId of payload.moodTags) {
        if (typeof tagId !== "string" || !getMoodTag(tagId)) {
          issues.push(`moodTags contains invalid id: ${String(tagId)}`);
        }
      }
    }
  }
  if (payload.paletteTags !== void 0) {
    if (!Array.isArray(payload.paletteTags)) {
      issues.push("paletteTags must be an array of strings");
    } else {
      for (const tagId of payload.paletteTags) {
        if (typeof tagId !== "string" || !getPaletteTag(tagId)) {
          issues.push(`paletteTags contains invalid id: ${String(tagId)}`);
        }
      }
    }
  }
  if (payload.extraDetails !== void 0 && typeof payload.extraDetails !== "string") {
    issues.push("extraDetails must be a string");
  }
  return issues.length > 0 ? { ok: false, issues } : { ok: true };
}
__name(validatePayload2, "validatePayload");
function extractFirstText(response) {
  const candidates = response.candidates ?? [];
  for (const candidate of candidates) {
    const parts = candidate.content?.parts ?? [];
    for (const part of parts) {
      if (typeof part.text === "string" && part.text.trim()) {
        return part.text;
      }
    }
  }
  return null;
}
__name(extractFirstText, "extractFirstText");
function safeJsonParse(input) {
  try {
    return JSON.parse(input);
  } catch {
    return null;
  }
}
__name(safeJsonParse, "safeJsonParse");

// src/routes/health.ts
function handleHealth() {
  return jsonResponse({
    ok: true,
    service: "ai-puzzle-maker-api"
  });
}
__name(handleHealth, "handleHealth");

// src/router.ts
var Router = class {
  static {
    __name(this, "Router");
  }
  routes = [];
  add(method, path, handler) {
    this.routes.push({
      method: method.toUpperCase(),
      path,
      handler
    });
    return this;
  }
  async handle(request, env, ctx) {
    const url = new URL(request.url);
    const path = normalizePath(url.pathname);
    const method = request.method.toUpperCase();
    const route = this.routes.find((candidate) => candidate.method === method && candidate.path === path);
    if (!route) {
      return null;
    }
    return await route.handler(request, env, ctx);
  }
};
function normalizePath(pathname) {
  if (pathname === "/api") {
    return "/";
  }
  if (pathname.startsWith("/api/")) {
    const trimmed = pathname.slice(4);
    return trimmed.length > 0 ? trimmed : "/";
  }
  return pathname;
}
__name(normalizePath, "normalizePath");

// src/index.ts
var router = new Router();
router.add("GET", "/health", handleHealth);
router.add("POST", "/prompt/compose", handlePromptCompose);
router.add("POST", "/image/generate", handleImageGenerate);
router.add("GET", "/models", handleModelsList);
var src_default = {
  async fetch(request, env, ctx) {
    try {
      if (request.method === "OPTIONS") {
        return new Response(null, { status: 204 });
      }
      const response = await router.handle(request, env, ctx);
      if (response) {
        return response;
      }
      return errorResponse(404, "Not found");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected error";
      return errorResponse(500, message);
    }
  }
};

// ../../../../../AppData/Roaming/npm/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../../../../AppData/Roaming/npm/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-xc0OZe/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// ../../../../../AppData/Roaming/npm/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-xc0OZe/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
