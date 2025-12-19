import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Divider,
  FormControlLabel,
  Paper,
  Tab,
  Stack,
  Switch,
  Tabs,
  Typography,
} from '@mui/material'
import { useEffect, useMemo, useRef, useState } from 'react'
import { composePrompt, generateImage } from '../../ai/apiClient'
import AspectRatioSelector from '../../components/create/AspectRatioSelector'
import GenerateButton from '../../components/create/GenerateButton'
import PieceCountSelector from '../../components/create/PieceCountSelector'
import PromptEditor from '../../components/create/PromptEditor'
import StyleMultiSelect from '../../components/create/StyleMultiSelect'
import TemplatePicker from '../../components/create/TemplatePicker'
import {
  aspectRatioOptions,
  moodOptions,
  paletteOptions,
  pieceCountMarks,
  styleGroups,
  templateOptions,
} from '../../components/create/createOptions'
import type { AspectRatio } from '../../storage/types'
import { saveImage } from '../../storage/imagesRepo'
import { getSettings } from '../../storage/settingsRepo'
import { savePuzzle } from '../../storage/puzzlesRepo'
import type { ImagePromptMeta, ImageRecord, PuzzleRecord } from '../../storage/types'
import { base64ToBlob, createPreviewBlob, decodeImage } from '../../utils/imageUtils'
import { buildPuzzleTopology } from '../../engine/generation/pieceTopology'
import { createSeededRng } from '../../engine/generation/seed'
import { CURRENT_GENERATOR_VERSION } from '../../engine/model/idSchemas'

type CreateMode = 'template' | 'prompt' | 'upload'

const DEFAULT_STYLE_TAGS = ['medium.watercolor', 'lighting.golden-hour']
const PROMPT_TO_IMAGE_DELAY_MS = 500

export default function CreatePuzzlePage() {
  const [mode, setMode] = useState<CreateMode>('template')
  const [templateId, setTemplateId] = useState(templateOptions[0]?.id ?? '')
  const [styleTags, setStyleTags] = useState<string[]>(DEFAULT_STYLE_TAGS)
  const [moodTags, setMoodTags] = useState<string[]>([])
  const [paletteTags, setPaletteTags] = useState<string[]>([])
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1')
  const [pieceCount, setPieceCount] = useState(300)
  const [defaultsLoaded, setDefaultsLoaded] = useState(false)
  const [useUserPrompt, setUseUserPrompt] = useState(false)
  const [userPrompt, setUserPrompt] = useState('')
  const [includeStyleTags, setIncludeStyleTags] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewAlt, setPreviewAlt] = useState('')
  const [lastSavedId, setLastSavedId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const selectedTemplate = useMemo(
    () => templateOptions.find((option) => option.id === templateId),
    [templateId],
  )

  const canGenerate = useUserPrompt
    ? userPrompt.trim().length > 0
    : Boolean(templateId) && styleTags.length > 0

  const styleTagsForPrompt = useUserPrompt ? (includeStyleTags ? styleTags : []) : styleTags
  const styleSummaryLabel = useUserPrompt
    ? includeStyleTags
      ? `${styleTags.length} tags`
      : 'Ignored for user prompt'
    : `${styleTags.length} tags`

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  useEffect(() => {
    let isActive = true
    const loadDefaults = async () => {
      if (defaultsLoaded) {
        return
      }
      try {
        const settings = await getSettings()
        if (!isActive) {
          return
        }
        setAspectRatio((current) =>
          current === '1:1' ? settings.preferredAspectRatio : current,
        )
        setPieceCount((current) =>
          current === 300 ? settings.defaultPieceCount : current,
        )
        setDefaultsLoaded(true)
      } catch {
        if (isActive) {
          setDefaultsLoaded(true)
        }
      }
    }
    loadDefaults()
    return () => {
      isActive = false
    }
  }, [defaultsLoaded])

  const handleGenerate = async () => {
    if (!canGenerate || isGenerating) {
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      const imageModel = 'gemini-2.5-flash-image'
      const promptMeta: ImagePromptMeta = {
        styleTags: styleTagsForPrompt.length ? styleTagsForPrompt : undefined,
        baseTemplateId: useUserPrompt ? undefined : templateId,
        moodTags: useUserPrompt ? undefined : moodTags,
        paletteTags: useUserPrompt ? undefined : paletteTags,
      }

      let altText: string | undefined
      let title: string | undefined
      let negativeConstraints: string[] = []

      if (useUserPrompt) {
        const userAltText = buildAltTextFromPrompt(userPrompt)
        const response = await generateImage({
          kind: 'user',
          userPrompt: userPrompt.trim(),
          styleTags: styleTagsForPrompt.length ? styleTagsForPrompt : undefined,
          aspectRatio,
          imageModel,
        })
        await saveGeneratedImage(response, { ...promptMeta, altText: userAltText })
        return
      }

      const composed = await composePrompt({
        baseTemplateId: templateId,
        styleTags,
        moodTags,
        paletteTags,
        aspectRatio,
      })

      title = composed.title
      altText = composed.altText
      negativeConstraints = composed.negativeConstraints
      await delay(PROMPT_TO_IMAGE_DELAY_MS)
      const response = await generateImage({
        kind: 'default',
        finalPrompt: composed.finalPrompt,
        negativeConstraints: composed.negativeConstraints,
        aspectRatio,
        imageModel,
      })

      await saveGeneratedImage(
        response,
        {
          ...promptMeta,
          promptUsed: composed.finalPrompt,
          model: composed.model,
          negativeConstraints,
          altText,
          title,
        },
        response.promptUsed,
      )
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Generation failed'
      setError(message)
    } finally {
      setIsGenerating(false)
    }
  }

  async function saveGeneratedImage(
    response: {
      imageMimeType: string
      imageBase64: string
      width: number
      height: number
      promptUsed: string
      model: string
    },
    promptMeta: ImagePromptMeta,
    promptUsedOverride?: string,
  ) {
    const imageId =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `img_${Date.now()}_${Math.random().toString(16).slice(2)}`
    const puzzleId =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `puz_${Date.now()}_${Math.random().toString(16).slice(2)}`
    const blob = base64ToBlob(response.imageBase64, response.imageMimeType)
    const previewBlob = await createPreviewBlob(blob)
    const resolvedAltText =
      promptMeta.altText ?? buildAltTextFromPrompt(promptUsedOverride ?? response.promptUsed)
    const record: ImageRecord = {
      imageId,
      createdAt: Date.now(),
      source: 'generated',
      mime: response.imageMimeType,
      blob,
      width: response.width,
      height: response.height,
      previewBlob: previewBlob ?? undefined,
      promptMeta: {
        ...promptMeta,
        promptUsed: promptUsedOverride ?? response.promptUsed,
        model: response.model,
        altText: resolvedAltText,
      },
    }
    await saveImage(record)

    const seed = Math.floor(Math.random() * 0xffffffff)
    const rng = createSeededRng(seed)
    const topology = buildPuzzleTopology(pieceCount, aspectRatio, rng)
    const padding = Math.round(Math.max(response.width, response.height) * 0.08)
    const puzzleRecord: PuzzleRecord = {
      puzzleId,
      imageId,
      seed,
      pieceCount,
      generatorVersion: CURRENT_GENERATOR_VERSION,
      board: {
        width: response.width,
        height: response.height,
        padding,
      },
      edges: {
        rows: topology.rows,
        cols: topology.cols,
        seams: topology.seams,
      },
      createdAt: Date.now(),
      aspectRatio,
    }
    await savePuzzle(puzzleRecord)

    const previewObjectUrl = URL.createObjectURL(previewBlob ?? blob)
    setPreviewUrl((prev) => {
      if (prev) {
        URL.revokeObjectURL(prev)
      }
      return previewObjectUrl
    })
    setPreviewAlt(resolvedAltText)
    setLastSavedId(imageId)
  }

  const handleToggle = (list: string[], setList: (next: string[]) => void, value: string) => {
    if (list.includes(value)) {
      setList(list.filter((item) => item !== value))
    } else {
      setList([...list, value])
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }
    setIsGenerating(true)
    setError(null)
    try {
      const { width, height, release } = await decodeImage(file)
      const previewBlob = await createPreviewBlob(file)
      const imageId =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `img_${Date.now()}_${Math.random().toString(16).slice(2)}`
      const puzzleId =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `puz_${Date.now()}_${Math.random().toString(16).slice(2)}`

      const aspect = chooseNearestAspectRatio(width, height)
      setAspectRatio(aspect)

      const record: ImageRecord = {
        imageId,
        createdAt: Date.now(),
        source: 'uploaded',
        mime: file.type || 'image/png',
        blob: file,
        width,
        height,
        previewBlob: previewBlob ?? undefined,
        promptMeta: {
          title: file.name,
          altText: file.name || 'Uploaded puzzle image',
        },
      }
      await saveImage(record)

      const seed = Math.floor(Math.random() * 0xffffffff)
      const rng = createSeededRng(seed)
      const topology = buildPuzzleTopology(pieceCount, aspect, rng)
      const padding = Math.round(Math.max(width, height) * 0.08)
      const puzzleRecord: PuzzleRecord = {
        puzzleId,
        imageId,
        seed,
        pieceCount,
        generatorVersion: CURRENT_GENERATOR_VERSION,
        board: {
          width,
          height,
          padding,
        },
        edges: {
          rows: topology.rows,
          cols: topology.cols,
          seams: topology.seams,
        },
        createdAt: Date.now(),
        aspectRatio: aspect,
      }
      await savePuzzle(puzzleRecord)

      const previewObjectUrl =
        previewBlob && typeof URL !== 'undefined' ? URL.createObjectURL(previewBlob) : null
      setPreviewUrl((prev) => {
        if (prev) {
          URL.revokeObjectURL(prev)
        }
        return previewObjectUrl
      })
      setPreviewAlt(file.name || 'Uploaded puzzle image')
      setLastSavedId(imageId)
      release?.()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed'
      setError(message)
    } finally {
      setIsGenerating(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h3">Create a new puzzle</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
          Pick a scene, define the artistic style, and generate a puzzle-ready image.
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' },
          gap: 3,
        }}
      >
        <Stack spacing={3}>
          <Paper sx={{ p: { xs: 2, sm: 3 } }}>
            <Stack spacing={2}>
              <Tabs value={mode} onChange={(_e, value: CreateMode) => setMode(value)} textColor="primary" indicatorColor="primary" variant="scrollable">
                <Tab label="Template & styles" value="template" />
                <Tab label="User prompt" value="prompt" />
                <Tab label="Upload" value="upload" />
              </Tabs>
              <Divider />

              {mode === 'template' ? (
                <Stack spacing={3}>
                  <Paper sx={{ p: { xs: 2, sm: 3 } }}>
                    <Stack spacing={2.5}>
                      <Box>
                        <Typography variant="h6">Scene template</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Start with a curated concept designed for great puzzles.
                        </Typography>
                      </Box>
                      <TemplatePicker options={templateOptions} value={templateId} onChange={setTemplateId} />
                    </Stack>
                  </Paper>

                  <Paper sx={{ p: { xs: 2, sm: 3 } }}>
                    <Stack spacing={2.5}>
                      <Box>
                        <Typography variant="h6">Style direction</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Blend 1 to 2 primary styles, then layer supportive details.
                        </Typography>
                      </Box>
                      <StyleMultiSelect groups={styleGroups} value={styleTags} onChange={setStyleTags} />
                      <Stack spacing={2}>
                        <Stack spacing={1}>
                          <Typography variant="subtitle2" sx={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                            Mood tags
                          </Typography>
                          <Stack direction="row" spacing={1} flexWrap="wrap">
                            {moodOptions.map((option) => (
                              <Chip
                                key={option.id}
                                label={option.label}
                                onClick={() => handleToggle(moodTags, setMoodTags, option.id)}
                                color={moodTags.includes(option.id) ? 'secondary' : 'default'}
                                variant={moodTags.includes(option.id) ? 'filled' : 'outlined'}
                                sx={{ mb: 1 }}
                              />
                            ))}
                          </Stack>
                        </Stack>
                        <Stack spacing={1}>
                          <Typography variant="subtitle2" sx={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                            Palette tags
                          </Typography>
                          <Stack direction="row" spacing={1} flexWrap="wrap">
                            {paletteOptions.map((option) => (
                              <Chip
                                key={option.id}
                                label={option.label}
                                onClick={() => handleToggle(paletteTags, setPaletteTags, option.id)}
                                color={paletteTags.includes(option.id) ? 'secondary' : 'default'}
                                variant={paletteTags.includes(option.id) ? 'filled' : 'outlined'}
                                sx={{ mb: 1 }}
                              />
                            ))}
                          </Stack>
                        </Stack>
                      </Stack>
                    </Stack>
                  </Paper>
                </Stack>
              ) : null}

              {mode === 'prompt' ? (
                <Paper sx={{ p: { xs: 2, sm: 3 } }}>
                  <Stack spacing={2}>
                    <Typography variant="h6">User prompt</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Provide your own prompt. Optional style tags can still be applied.
                    </Typography>
                    <PromptEditor
                      value={userPrompt}
                      onChange={setUserPrompt}
                      placeholder="Describe the scene, subject, lighting, and mood."
                      helperText="We will still apply safety guardrails and optional style tags."
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={includeStyleTags}
                          onChange={(event) => setIncludeStyleTags(event.target.checked)}
                        />
                      }
                      label="Include selected style tags"
                    />
                  </Stack>
                </Paper>
              ) : null}

              {mode === 'upload' ? (
                <Paper sx={{ p: { xs: 2, sm: 3 } }}>
                  <Stack spacing={2.5}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6">Upload your own image</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Cut any image into a puzzle. Choose your aspect ratio and piece count, then upload.
                        </Typography>
                      </Box>
                      <Button variant="outlined" onClick={handleUploadClick} disabled={isGenerating}>
                        Upload image
                      </Button>
                      <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        onChange={handleUpload}
                      />
                    </Stack>
                    <Divider />
                    <AspectRatioSelector options={aspectRatioOptions} value={aspectRatio} onChange={setAspectRatio} />
                    <PieceCountSelector value={pieceCount} onChange={setPieceCount} marks={pieceCountMarks} />
                  </Stack>
                </Paper>
              ) : null}

              {mode !== 'upload' ? (
                <Paper sx={{ p: { xs: 2, sm: 3 } }}>
                  <Stack spacing={3}>
                    <AspectRatioSelector options={aspectRatioOptions} value={aspectRatio} onChange={setAspectRatio} />
                    <Divider />
                    <PieceCountSelector value={pieceCount} onChange={setPieceCount} marks={pieceCountMarks} />
                  </Stack>
                </Paper>
              ) : null}
            </Stack>
          </Paper>
        </Stack>

        <Stack spacing={3}>
          <Paper sx={{ p: 3 }}>
            <Stack spacing={2.5}>
              <Box>
                <Typography variant="h6">Puzzle summary</Typography>
                <Typography variant="body2" color="text.secondary">
                  {mode === 'upload'
                    ? 'Upload an image to cut it into a puzzle instantly.'
                    : 'Preview what will be sent to the AI pipeline.'}
                </Typography>
              </Box>
              <Stack spacing={2}>
                <SummaryRow label="Mode" value={mode === 'upload' ? 'Upload image' : mode === 'prompt' ? 'User prompt' : 'Template + styles'} />
                {mode === 'template' ? (
                  <>
                    <SummaryRow label="Template" value={selectedTemplate?.label ?? 'None selected'} />
                    <SummaryRow label="Styles" value={styleSummaryLabel} />
                    <SummaryRow label="Mood" value={moodTags.length ? `${moodTags.length} tags` : 'None'} />
                    <SummaryRow label="Palette" value={paletteTags.length ? `${paletteTags.length} tags` : 'None'} />
                  </>
                ) : null}
                {mode === 'prompt' ? (
                  <>
                    <SummaryRow label="Prompt length" value={`${userPrompt.trim().length || 0} chars`} />
                    <SummaryRow label="Styles" value={includeStyleTags ? styleSummaryLabel : 'No style tags'} />
                  </>
                ) : null}
                <SummaryRow label="Aspect ratio" value={aspectRatio} />
                <SummaryRow label="Pieces" value={`${pieceCount}`} />
              </Stack>
              <Divider />
              {mode === 'upload' ? (
                <Typography variant="body2" color="text.secondary">
                  Upload an image on the Upload tab to create a puzzle instantly. It will appear in your library when saved.
                </Typography>
              ) : (
                <>
                  <GenerateButton
                    label={
                      mode === 'prompt'
                        ? isGenerating
                          ? 'Generating...'
                          : 'Generate image'
                        : isGenerating
                          ? 'Generating...'
                          : 'Compose and generate'
                    }
                    disabled={!canGenerate || isGenerating}
                    onClick={handleGenerate}
                    helperText="Generation runs in the background and stores results automatically."
                  />
                  {isGenerating ? (
                    <Stack direction="row" spacing={1} alignItems="center">
                      <CircularProgress size={18} />
                      <Typography variant="caption" color="text.secondary">
                        Creating your puzzle image...
                      </Typography>
                    </Stack>
                  ) : null}
                </>
              )}
              {error ? (
                <Alert severity="error" variant="outlined">
                  {error}
                </Alert>
              ) : null}
            </Stack>
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Stack spacing={1.5}>
              <Typography variant="h6">Prompt safeguards</Typography>
              <Typography variant="body2" color="text.secondary">
                We automatically filter copyrighted characters, brands, and text overlays. This keeps images safe for
                sharing and publishing.
              </Typography>
            </Stack>
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Stack spacing={2}>
              <Typography variant="h6">Latest render</Typography>
              {previewUrl ? (
                <Box
                  component="img"
                  src={previewUrl}
                  alt={previewAlt || 'Generated preview'}
                  sx={{
                    width: '100%',
                    borderRadius: 2,
                    border: '1px solid var(--app-outline)',
                    backgroundColor: 'rgba(255, 255, 255, 0.6)',
                  }}
                />
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Generate an image to see a preview here.
                </Typography>
              )}
              {lastSavedId ? (
                <Typography variant="caption" color="text.secondary">
                  Saved to your library as {lastSavedId}.
                </Typography>
              ) : null}
            </Stack>
          </Paper>
        </Stack>
      </Box>
    </Stack>
  )
}

type SummaryRowProps = {
  label: string
  value: string
}

function SummaryRow({ label, value }: SummaryRowProps) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="baseline">
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
        {value}
      </Typography>
    </Stack>
  )
}

const MAX_ALT_TEXT_LENGTH = 140

function buildAltTextFromPrompt(prompt: string): string {
  const trimmed = prompt.trim().replace(/\s+/g, ' ')
  if (!trimmed) {
    return 'Generated puzzle image'
  }
  if (trimmed.length <= MAX_ALT_TEXT_LENGTH) {
    return trimmed
  }
  return `${trimmed.slice(0, MAX_ALT_TEXT_LENGTH - 3).trimEnd()}...`
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function chooseNearestAspectRatio(width: number, height: number): AspectRatio {
  const ratio = width / height
  const scored = aspectRatioOptions.map((opt) => {
    const [w, h] = opt.value.split(':').map(Number)
    const value = w && h ? w / h : 1
    return { value: opt.value, delta: Math.abs(value - ratio) }
  })
  scored.sort((a, b) => a.delta - b.delta)
  return scored[0]?.value ?? '1:1'
}
