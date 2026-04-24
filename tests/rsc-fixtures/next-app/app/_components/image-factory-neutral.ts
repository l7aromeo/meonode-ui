import Image from 'next/image'
import { createNode } from '@meonode/ui'

export const NextImage = createNode(Image, {
  src: '',
  alt: '',
  props: { width: 0, height: 0 },
  sizes: '100vw',
})
