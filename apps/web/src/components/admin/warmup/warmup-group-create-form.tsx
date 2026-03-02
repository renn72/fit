'use client'

import { WarmupGroupForm } from '@/components/admin/warmup/warmup-group-form'

export interface WarmupGroupCreateFormProps {
	onSuccess?: () => void
}

export function WarmupGroupCreateForm({
	onSuccess,
}: WarmupGroupCreateFormProps) {
	return <WarmupGroupForm mode='create' onSuccess={onSuccess} />
}
