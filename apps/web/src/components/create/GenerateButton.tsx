import { Button, Stack, Typography } from '@mui/material'

export type GenerateButtonProps = {
  label: string
  disabled?: boolean
  onClick?: () => void
  helperText?: string
}

export default function GenerateButton({ label, disabled, onClick, helperText }: GenerateButtonProps) {
  return (
    <Stack spacing={1.5}>
      <Button
        variant="contained"
        size="large"
        fullWidth
        disabled={disabled}
        onClick={onClick}
        sx={{
          py: 1.6,
          fontSize: '1rem',
          boxShadow: '0 16px 32px rgba(12, 106, 100, 0.25)',
        }}
      >
        {label}
      </Button>
      {helperText ? (
        <Typography variant="caption" color="text.secondary">
          {helperText}
        </Typography>
      ) : null}
    </Stack>
  )
}
