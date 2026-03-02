'use client'

import {
	WarmupGroupForm,
	type WarmupGroupFormGroup,
} from '@/components/admin/warmup/warmup-group-form'

export interface WarmupGroupEditFormProps {
	group: WarmupGroupFormGroup
	onSuccess?: () => void
}

export function WarmupGroupEditForm({
	group,
	onSuccess,
}: WarmupGroupEditFormProps) {
	return <WarmupGroupForm mode='edit' group={group} onSuccess={onSuccess} />
}
