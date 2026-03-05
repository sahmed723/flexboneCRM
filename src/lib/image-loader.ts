'use client'

interface ImageLoaderParams {
  src: string
  width: number
  quality?: number
}

export default function cloudflareLoader({ src, width, quality }: ImageLoaderParams): string {
  const params = [`width=${width}`, `quality=${quality || 75}`, 'format=auto']
  return `https://crm.flexbone.ai/cdn-cgi/image/${params.join(',')}/${src}`
}
