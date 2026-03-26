import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export function useScreenshot() {
  const [uploading, setUploading] = useState(false)

  const upload = async (file: File): Promise<string> => {
    setUploading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('trade-screenshots')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('trade-screenshots')
        .getPublicUrl(fileName)

      return data.publicUrl
    } finally {
      setUploading(false)
    }
  }

  return { upload, uploading }
}
