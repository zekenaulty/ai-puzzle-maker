import { TextField } from '@mui/material'

export type PromptEditorProps = {
  value: string
  onChange: (next: string) => void
  label?: string
  helperText?: string
  placeholder?: string
  minRows?: number
}

export default function PromptEditor({
  value,
  onChange,
  label = 'Describe your idea',
  helperText,
  placeholder,
  minRows = 5,
}: PromptEditorProps) {
  return (
    <TextField
      value={value}
      onChange={(event) => onChange(event.target.value)}
      label={label}
      helperText={helperText}
      placeholder={placeholder}
      minRows={minRows}
      multiline
      fullWidth
      variant="outlined"
    />
  )
}
