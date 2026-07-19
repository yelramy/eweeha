// Serves next/image through Cloudinary transforms instead of Vercel's optimizer
export default function cloudinaryLoader({
  src,
  width,
  quality,
}: {
  src: string
  width: number
  quality?: number
}) {
  if (!src.startsWith('https://res.cloudinary.com/') || !src.includes('/upload/')) {
    return src
  }
  const params = `f_auto,q_${quality || 'auto'},c_limit,w_${width}`
  return src.replace('/upload/', `/upload/${params}/`)
}
