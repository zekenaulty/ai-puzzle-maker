import { Box, Typography } from '@mui/material'

type PageProps = {
  title: string
}

export default function PageStub({ title }: PageProps) {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4">{title}</Typography>
      <Typography variant="body1" sx={{ mt: 1 }}>
        This page is a placeholder and will be implemented in later stories.
      </Typography>
    </Box>
  )
}
