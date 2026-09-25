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
  // Cloudinary applies chained transforms left to right: the resize must come after any
  // transform already in the URL (e.g. the c_fit,w_900 card frame), or that one scales
  // every srcset variant back up to 900px.
  const versioned = src.match(/^(.*\/upload\/(?:[^/]+\/)*?)(v\d+\/.*)$/)
  if (versioned) return `${versioned[1]}${params}/${versioned[2]}`
  return src.replace('/upload/', `/upload/${params}/`)
}
