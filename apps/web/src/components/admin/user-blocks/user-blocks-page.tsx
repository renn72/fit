'use client'

import * as React from 'react'

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@fit/components/ui/alert-dialog'
import { Button } from '@fit/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@fit/components/ui/card'
import { orpc } from '@/utils/orpc'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useSearch } from '@tanstack/react-router'

import {
	PauseCircleIcon,
	PencilSimpleIcon,
	PlayCircleIcon,
	TrashIcon,
} from '@phosphor-icons/react'
import { format } from 'date-fns'
import { toast } from 'sonner'

interface UserBlocksPageProps {
	orgSlug: string
}

interface UserBlockItem {
	id: string
	name: string
	description: string | null
	category: string | null
	tags: string[]
	restDayIndexes: number[]
	startDate: Date | null
	endDate: Date | null
	isActive: boolean
	userId: string
	createdAt: Date
	workouts: Array<{
		id: string
		dayIndex: number
		warmups: Array<{ id: string }>
		exercises: Array<{ id: string }>
	}>
}

function countExercises(block: UserBlockItem): number {
	return block.workouts.reduce(
		(total, workoutItem) => total + workoutItem.exercises.length,
		0,
	)
}

export function UserBlocksPage({ orgSlug }: UserBlocksPageProps) {
	const navigate = useNavigate()
	const queryClient = useQueryClient()
	const { user } = useSearch({ from: '/$orgSlug' })
	const selectedUser = user || null
	const [blockToDelete, setBlockToDelete] = React.useState<string | null>(null)

	const { data: usersData } = useQuery(orpc.user.getAllByOrg.queryOptions())
	const users = usersData ?? []

	const { data: userBlocks, isLoading } = useQuery(
		orpc.userBlock.getByUser.queryOptions({
			input: { userId: selectedUser || '' },
			enabled: !!selectedUser,
		}),
	)

	const updateBlock = useMutation(
		orpc.userBlock.update.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: orpc.userBlock.getByUser.key(),
				})
				toast.success('Block updated successfully')
			},
			onError: (error) => {
				toast.error(error.message || 'Failed to update block')
			},
		}),
	)

	const deleteBlock = useMutation(
		orpc.userBlock.delete.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: orpc.userBlock.getByUser.key(),
				})
				toast.success('Block deleted successfully')
				setBlockToDelete(null)
			},
			onError: (error) => {
				toast.error(error.message || 'Failed to delete block')
				setBlockToDelete(null)
			},
		}),
	)

	if (!selectedUser) {
		return (
			<div className='flex flex-col gap-6 p-8'>
				<div>
					<h1 className='text-2xl font-semibold tracking-tight'>User Blocks</h1>
					<p className='text-sm text-muted-foreground'>
						Select a user from the sidebar to view and assign blocks.
					</p>
				</div>
				<Card>
					<CardContent className='py-12 text-center text-muted-foreground'>
						No user selected.
					</CardContent>
				</Card>
			</div>
		)
	}

	const typedBlocks = (userBlocks as UserBlockItem[] | undefined) ?? []
	const selectedUserData = users.find((entry) => entry.id === selectedUser)

	return (
		<div className='flex flex-col gap-6 p-8'>
			<div className='flex flex-wrap gap-3 justify-between items-center'>
				<div>
					<h1 className='text-2xl font-semibold tracking-tight'>
						{selectedUserData?.name || 'User'}&apos;s Blocks
					</h1>
					<p className='text-sm text-muted-foreground'>
						{typedBlocks.length} block{typedBlocks.length === 1 ? '' : 's'}{' '}
						assigned
					</p>
				</div>
				<Button
					onClick={() =>
						navigate({
							to: '/$orgSlug/user-block-create',
							params: { orgSlug },
							search: { user: selectedUser },
						})
					}
				>
					Create Block
				</Button>
			</div>

			{isLoading ? (
				<Card>
					<CardContent className='py-12 text-center text-muted-foreground'>
						Loading blocks...
					</CardContent>
				</Card>
			) : typedBlocks.length === 0 ? (
				<Card>
					<CardContent className='py-12 text-center'>
						<p className='text-muted-foreground'>
							No blocks assigned to this user yet.
						</p>
						<Button
							className='mt-4'
							onClick={() =>
								navigate({
									to: '/$orgSlug/user-block-create',
									params: { orgSlug },
									search: { user: selectedUser },
								})
							}
						>
							Create First Block
						</Button>
					</CardContent>
				</Card>
			) : (
				<div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
					{typedBlocks.map((block) => {
						const totalDays =
							Math.max(
								...block.workouts.map((workoutItem) => workoutItem.dayIndex),
								...block.restDayIndexes,
								-1,
							) + 1

						return (
							<Card
								key={block.id}
								className='overflow-hidden border-border/70 shadow-sm'
							>
								<CardHeader className='space-y-3 border-b bg-muted/20'>
									<div className='flex gap-3 justify-between items-start'>
										<div>
											<CardTitle className='text-lg'>{block.name}</CardTitle>
											<p className='text-xs text-muted-foreground'>
												Created{' '}
												{format(new Date(block.createdAt), 'MMM d, yyyy')}
											</p>
										</div>
										<div className='flex gap-2'>
											<Button
												size='sm'
												variant='outline'
												onClick={() =>
													navigate({
														to: '/$orgSlug/user-block/$blockId',
														params: { orgSlug, blockId: block.id },
														search: selectedUser ? { user: selectedUser } : {},
													})
												}
											>
												View
											</Button>
											<Button
												size='sm'
												variant='outline'
												onClick={() =>
													navigate({
														to: '/$orgSlug/user-block-edit/$blockId',
														params: { orgSlug, blockId: block.id },
														search: selectedUser ? { user: selectedUser } : {},
													})
												}
											>
												<PencilSimpleIcon className='mr-2 size-4' />
												Edit
											</Button>
											<Button
												size='sm'
												variant='outline'
												onClick={() =>
													updateBlock.mutate({
														id: block.id,
														isActive: !block.isActive,
													})
												}
											>
												{block.isActive ? (
													<>
														<PauseCircleIcon className='mr-2 size-4' />
														Pause
													</>
												) : (
													<>
														<PlayCircleIcon className='mr-2 size-4' />
														Activate
													</>
												)}
											</Button>
											<Button
												size='sm'
												variant='outline'
												onClick={() => setBlockToDelete(block.id)}
											>
												<TrashIcon className='mr-2 size-4' />
												Delete
											</Button>
										</div>
									</div>
									<CardDescription className='line-clamp-2'>
										{block.description || 'No description'}
									</CardDescription>
								</CardHeader>
								<CardContent className='space-y-4'>
									{(block.startDate || block.endDate) && (
										<p className='text-xs text-muted-foreground'>
											{block.startDate &&
												format(new Date(block.startDate), 'MMM d, yyyy')}
											{block.startDate && block.endDate ? ' - ' : ''}
											{block.endDate &&
												format(new Date(block.endDate), 'MMM d, yyyy')}
										</p>
									)}
									<div className='grid grid-cols-2 gap-3 text-sm md:grid-cols-4'>
										<BlockStat label='Days' value={Math.max(totalDays, 0)} />
										<BlockStat label='Workouts' value={block.workouts.length} />
										<BlockStat
											label='Exercises'
											value={countExercises(block)}
										/>
										<BlockStat
											label='Rest Days'
											value={block.restDayIndexes.length}
										/>
									</div>
									<div className='flex flex-wrap gap-2'>
										{block.tags.length > 0 ? (
											block.tags.map((tag) => (
												<span
													key={tag}
													className='px-2 py-1 text-xs rounded-full border bg-muted'
												>
													{tag}
												</span>
											))
										) : (
											<span className='text-xs text-muted-foreground'>
												No tags
											</span>
										)}
									</div>
									<div className='flex justify-between items-center pt-2 border-t text-xs text-muted-foreground'>
										<span>{block.category || 'Uncategorized'}</span>
										<span>{block.isActive ? 'Active' : 'Inactive'}</span>
									</div>
								</CardContent>
							</Card>
						)
					})}
				</div>
			)}

			<AlertDialog
				open={blockToDelete !== null}
				onOpenChange={(open) => {
					if (!open) {
						setBlockToDelete(null)
					}
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete block?</AlertDialogTitle>
						<AlertDialogDescription>
							This will permanently remove the block and all copied workouts,
							warmups, and exercises.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => {
								if (blockToDelete) {
									deleteBlock.mutate({ id: blockToDelete })
								}
							}}
							className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
						>
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	)
}

function BlockStat({ label, value }: { label: string; value: number }) {
	return (
		<div className='p-3 rounded-lg border bg-muted/30'>
			<p className='text-[11px] uppercase tracking-wide text-muted-foreground'>
				{label}
			</p>
			<p className='text-base font-semibold'>{value}</p>
		</div>
	)
}
