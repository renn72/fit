import { useState } from 'react'

import { LoadingButton } from '@/components/ui/button'
import { orpc } from '@/utils/orpc'

import { useMutation } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
export const Route = createFileRoute('/root/')({
	component: RouteComponent,
})

function RouteComponent() {
	const [isMutating, setIsMutating] = useState(false)

	const importExercises = useMutation(
		orpc.adminSetup.importExercises.mutationOptions({
			onMutate: () => setIsMutating(true),
			onSettled: () => setIsMutating(false),
		}),
	)
	return (
		<div className='flex flex-col gap-4 justify-center items-center p-4'>
			<LoadingButton
				loading={isMutating}
				className='w-80 cursor-pointer'
				onMouseDown={() => importExercises.mutate({})}
			>
				Import Exercises
			</LoadingButton>
		</div>
	)
}
