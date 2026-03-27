import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export function useScreenshot() {
  const [uploading, setUploading] = useState(false)

  const upload = async (blob: Blob): Promise<string> => {
    setUploading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const fileName = `${user.id}/${Date.now()}.jpg`

      const { error: uploadError } = await supabase.storage
        .from('trade-screenshots')
        .upload(fileName, blob, {
          contentType: 'image/jpeg',
        })

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('trade-screenshots')
        .getPublicUrl(fileName)

      return data.publicUrl
    } finally {
      setUploading(false)
    }
  }

  const uploadMultiple = async (blobs: Blob[]): Promise<string[]> => {
    setUploading(true)
    try {
      const urls: string[] = []
      for (const blob of blobs) {
        const url = await upload(blob)
        urls.push(url)
      }
      return urls
    } finally {
      setUploading(false)
    }
  }

  return { upload, uploadMultiple, uploading }
}
