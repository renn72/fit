'use client'

import { MovementForm } from '@/components/admin/movement/movement-form'

export interface MovementCreateFormProps {
	onSuccess?: () => void
}

export function MovementCreateForm({ onSuccess }: MovementCreateFormProps) {
	return <MovementForm mode='create' onSuccess={onSuccess} />
}
