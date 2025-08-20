import React from 'react'
import { builder, BuilderComponent, useIsPreviewing } from '@builder.io/sdk-react'

builder.init(import.meta.env.VITE_BUILDER_PUBLIC_API_KEY || '')

export default function BuilderPage() {
  const isPreview = useIsPreviewing()
  const urlPath = typeof window !== 'undefined' ? window.location.pathname : '/'

  return (
    <BuilderComponent
      model="page"
      url={urlPath}
      options={{ includeUnpublished: isPreview }}
    />
  )
}

