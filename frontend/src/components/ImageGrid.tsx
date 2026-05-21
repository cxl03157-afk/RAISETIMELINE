import { Box } from '@mui/material'

interface ImageGridProps {
  imageUrls: string[]
}

export default function ImageGrid({ imageUrls }: ImageGridProps) {
  if (imageUrls.length === 0) return null

  const count = Math.min(imageUrls.length, 4) as 1 | 2 | 3 | 4
  const urls = imageUrls.slice(0, 4)

  const gridTemplates: Record<1 | 2 | 3 | 4, { columns: string; rows: string }> = {
    1: { columns: '1fr', rows: '1fr' },
    2: { columns: '1fr 1fr', rows: '1fr' },
    3: { columns: '1fr 1fr', rows: '1fr 1fr' },
    4: { columns: '1fr 1fr', rows: '1fr 1fr' },
  }

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: gridTemplates[count].columns,
        gridTemplateRows: gridTemplates[count].rows,
        gap: '2px',
        borderRadius: '16px',
        overflow: 'hidden',
        mt: 1,
        maxHeight: 300,
      }}
    >
      {urls.map((url, i) => (
        <Box
          key={url}
          component="img"
          src={url}
          alt=""
          sx={{
            width: '100%',
            height: count === 1 ? 280 : 148,
            objectFit: 'cover',
            // 3枚のとき最初の画像を縦2列分
            ...(count === 3 && i === 0 ? { gridRow: '1 / 3' } : {}),
          }}
        />
      ))}
    </Box>
  )
}
