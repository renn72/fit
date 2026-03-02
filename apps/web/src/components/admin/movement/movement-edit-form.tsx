'use client'

import {
	MovementForm,
	type MovementFormMovement,
} from '@/components/admin/movement/movement-form'

export interface MovementEditFormProps {
	movement: MovementFormMovement
	onSuccess?: () => void
}

export function MovementEditForm({
	movement,
	onSuccess,
}: MovementEditFormProps) {
	return <MovementForm mode='edit' movement={movement} onSuccess={onSuccess} />
}
