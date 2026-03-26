import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { JournalForm } from '../components/JournalForm'
import { useJournal, useCreateJournal, useUpdateJournal } from '../hooks/useJournal'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import type { JournalFormData } from '../schemas/journal.schema'

export function JournalEntryPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: journal, isLoading } = useJournal(id ?? '')
  const createJournal = useCreateJournal()
  const updateJournal = useUpdateJournal()

  const isEditing = !!id

  if (isEditing && isLoading) return <LoadingSpinner className="mt-20" />

  const handleSubmit = async (data: JournalFormData) => {
    if (isEditing && id) {
      await updateJournal.mutateAsync({ id, data })
    } else {
      await createJournal.mutateAsync(data)
    }
    navigate('/journal')
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/journal')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">
          {isEditing ? 'Sua nhat ky' : 'Them nhat ky moi'}
        </h1>
      </div>

      <JournalForm
        journal={journal}
        onSubmit={handleSubmit}
        isLoading={createJournal.isPending || updateJournal.isPending}
      />
    </div>
  )
}
