'use client'

import { useRouter } from 'next/navigation'
import { BusinessModelSelector } from '@/components/BusinessModelSelector'
import { BusinessModel } from '@/types'

export default function HomePage() {
  const router = useRouter()

  const handleSelect = (model: BusinessModel) => {
    if (model === 'hotel') {
      router.push('/hotel')
    } else if (model === 'guesthouse') {
      router.push('/guesthouse')
    } else if (model === 'boarding-house') {
      router.push('/boarding-house')
    }
  }

  return (
    <BusinessModelSelector onSelect={handleSelect} />
  )
}

