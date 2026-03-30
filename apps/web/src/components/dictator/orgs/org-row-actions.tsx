'use client'

import * as React from 'react'

import { Button } from '@fit/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@fit/components/ui/dialog'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@fit/components/ui/dropdown-menu'
import { Field, FieldGroup, FieldLabel } from '@fit/components/ui/field'
import { Input } from '@fit/components/ui/input'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@fit/components/ui/select'
import { LoadingButton } from '@/components/ui-extended/loading-button'
import { orpc } from '@/utils/orpc'

import { useMutation, useQueryClient } from '@tanstack/react-query'

import { MoreHorizontal, TagIcon, UsersIcon } from 'lucide-react'
import { toast } from 'sonner'

interface OrgRowActionsProps {
	row: any
}

export function OrgRowActions({ row }: OrgRowActionsProps) {
	const queryClient = useQueryClient()
	const [discountOpen, setDiscountOpen] = React.useState(false)
	const [bonusOpen, setBonusOpen] = React.useState(false)

	const org = row.original
	const subscriptionId = org.subscriptionId

	const updateSubscription = useMutation(
		orpc.subscription.update.mutationOptions({
			onSuccess: () => {
				toast.success('Subscription updated successfully')
				// Invalidate the orgs query to refresh data
				queryClient.invalidateQueries({
					queryKey: orpc.organisation.getAll.queryKey(),
				})
				setDiscountOpen(false)
				setBonusOpen(false)
			},
			onError: (error) => {
				toast.error(error.message || 'Failed to update subscription')
			},
		}),
	)

	// Discount form state
	const [discountType, setDiscountType] = React.useState<
		'percentage' | 'fixed'
	>('percentage')
	const [discountValue, setDiscountValue] = React.useState(
		org.discountValue?.toString() ?? '',
	)
	const [discountReason, setDiscountReason] = React.useState(
		org.discountReason ?? '',
	)
	const [discountExpiresAt, setDiscountExpiresAt] = React.useState('')

	// Bonus form state
	const [bonusMembers, setBonusMembers] = React.useState(
		org.bonusMembers?.toString() ?? '0',
	)
	const [bonusTrainers, setBonusTrainers] = React.useState(
		org.bonusTrainers?.toString() ?? '0',
	)
	const [bonusReason, setBonusReason] = React.useState(org.bonusReason ?? '')
	const [bonusExpiresAt, setBonusExpiresAt] = React.useState('')

	const handleDiscountSubmit = () => {
		if (!subscriptionId) {
			toast.error('No subscription found for this organisation')
			return
		}

		const value = discountValue ? Number.parseInt(discountValue, 10) : null

		updateSubscription.mutate({
			id: subscriptionId,
			discountType: value ? discountType : null,
			discountValue: value,
			discountReason: discountReason || null,
			discountExpiresAt: discountExpiresAt
				? new Date(discountExpiresAt).getTime()
				: null,
		})
	}

	const handleBonusSubmit = () => {
		if (!subscriptionId) {
			toast.error('No subscription found for this organisation')
			return
		}

		updateSubscription.mutate({
			id: subscriptionId,
			bonusMembers: Number.parseInt(bonusMembers, 10) || 0,
			bonusTrainers: Number.parseInt(bonusTrainers, 10) || 0,
			bonusReason: bonusReason || null,
			bonusExpiresAt: bonusExpiresAt
				? new Date(bonusExpiresAt).getTime()
				: null,
		})
	}

	const clearDiscount = () => {
		if (!subscriptionId) return

		updateSubscription.mutate({
			id: subscriptionId,
			discountType: null,
			discountValue: null,
			discountReason: null,
			discountExpiresAt: null,
		})
	}

	const clearBonus = () => {
		if (!subscriptionId) return

		updateSubscription.mutate({
			id: subscriptionId,
			bonusMembers: 0,
			bonusTrainers: 0,
			bonusReason: null,
			bonusExpiresAt: null,
		})
	}

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger
					render={
						<Button variant='ghost' className='h-8 w-8 p-0'>
							<span className='sr-only'>Open menu</span>
							<MoreHorizontal className='h-4 w-4' />
						</Button>
					}
				/>
				<DropdownMenuContent align='end'>
					<Dialog open={discountOpen} onOpenChange={setDiscountOpen}>
						<DialogTrigger
							render={
								<DropdownMenuItem onSelect={(e) => e.preventDefault()}>
									<TagIcon className='mr-2 h-4 w-4' />
									{org.hasActiveDiscount ? 'Edit Discount' : 'Apply Discount'}
								</DropdownMenuItem>
							}
						/>
					</Dialog>
					<Dialog open={bonusOpen} onOpenChange={setBonusOpen}>
						<DialogTrigger
							render={
								<DropdownMenuItem onSelect={(e) => e.preventDefault()}>
									<UsersIcon className='mr-2 h-4 w-4' />
									{org.hasActiveBonus ? 'Edit Bonus' : 'Add Bonus'}
								</DropdownMenuItem>
							}
						/>
					</Dialog>
				</DropdownMenuContent>
			</DropdownMenu>

			{/* Discount Dialog */}
			<Dialog open={discountOpen} onOpenChange={setDiscountOpen}>
				<DialogContent className='sm:max-w-[425px]'>
					<DialogHeader>
						<DialogTitle>
							{org.hasActiveDiscount ? 'Edit Discount' : 'Apply Discount'}
						</DialogTitle>
						<DialogDescription>
							Apply a discount to {org.name}&apos;s subscription.
						</DialogDescription>
					</DialogHeader>
					<div className='grid gap-4 py-4'>
						<FieldGroup>
							<div className='grid grid-cols-2 gap-4'>
								<Field>
									<FieldLabel>Discount Type</FieldLabel>
									<Select
										value={discountType}
										onValueChange={(value) =>
											setDiscountType(value as 'percentage' | 'fixed')
										}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value='percentage'>Percentage (%)</SelectItem>
											<SelectItem value='fixed'>Fixed Amount ($)</SelectItem>
										</SelectContent>
									</Select>
								</Field>
								<Field>
									<FieldLabel>
										{discountType === 'percentage'
											? 'Percentage'
											: 'Amount (cents)'}
									</FieldLabel>
									<Input
										type='number'
										value={discountValue}
										onChange={(e) => setDiscountValue(e.target.value)}
										placeholder={discountType === 'percentage' ? '20' : '5000'}
									/>
								</Field>
							</div>
							<Field>
								<FieldLabel>Reason (optional)</FieldLabel>
								<Input
									value={discountReason}
									onChange={(e) => setDiscountReason(e.target.value)}
									placeholder='e.g., Early adopter, Non-profit'
								/>
							</Field>
							<Field>
								<FieldLabel>Expires At (optional)</FieldLabel>
								<Input
									type='datetime-local'
									value={discountExpiresAt}
									onChange={(e) => setDiscountExpiresAt(e.target.value)}
								/>
							</Field>
							{org.hasActiveDiscount && (
								<div className='text-sm text-muted-foreground'>
									Current:{' '}
									{org.discountType === 'percentage'
										? `${org.discountValue}%`
										: `$${(org.discountValue ?? 0) / 100}`}{' '}
									off
								</div>
							)}
						</FieldGroup>
					</div>
					<DialogFooter className='gap-2'>
						{org.hasActiveDiscount && (
							<Button
								variant='destructive'
								onClick={clearDiscount}
								disabled={updateSubscription.isPending}
							>
								Remove Discount
							</Button>
						)}
						<LoadingButton
							onClick={handleDiscountSubmit}
							loading={updateSubscription.isPending}
						>
							Save Discount
						</LoadingButton>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Bonus Dialog */}
			<Dialog open={bonusOpen} onOpenChange={setBonusOpen}>
				<DialogContent className='sm:max-w-[425px]'>
					<DialogHeader>
						<DialogTitle>
							{org.hasActiveBonus ? 'Edit Bonus' : 'Add Bonus'}
						</DialogTitle>
						<DialogDescription>
							Add bonus members and trainers to {org.name}&apos;s plan.
						</DialogDescription>
					</DialogHeader>
					<div className='grid gap-4 py-4'>
						<FieldGroup>
							<div className='grid grid-cols-2 gap-4'>
								<Field>
									<FieldLabel>Bonus Members</FieldLabel>
									<Input
										type='number'
										value={bonusMembers}
										onChange={(e) => setBonusMembers(e.target.value)}
										placeholder='0'
										min={0}
									/>
								</Field>
								<Field>
									<FieldLabel>Bonus Trainers</FieldLabel>
									<Input
										type='number'
										value={bonusTrainers}
										onChange={(e) => setBonusTrainers(e.target.value)}
										placeholder='0'
										min={0}
									/>
								</Field>
							</div>
							<div className='text-sm text-muted-foreground'>
								Current plan: {org.baseMaxMembers} members,{' '}
								{org.baseMaxTrainers} trainers
							</div>
							<div className='text-sm font-medium'>
								New total:{' '}
								{org.baseMaxMembers + (Number.parseInt(bonusMembers, 10) || 0)}{' '}
								members,{' '}
								{org.baseMaxTrainers +
									(Number.parseInt(bonusTrainers, 10) || 0)}{' '}
								trainers
							</div>
							<Field>
								<FieldLabel>Reason (optional)</FieldLabel>
								<Input
									value={bonusReason}
									onChange={(e) => setBonusReason(e.target.value)}
									placeholder='e.g., Beta tester, Enterprise deal'
								/>
							</Field>
							<Field>
								<FieldLabel>Expires At (optional)</FieldLabel>
								<Input
									type='datetime-local'
									value={bonusExpiresAt}
									onChange={(e) => setBonusExpiresAt(e.target.value)}
								/>
							</Field>
							{org.hasActiveBonus && (
								<div className='text-sm text-muted-foreground'>
									Current bonus: +{org.bonusMembers} members, +
									{org.bonusTrainers} trainers
								</div>
							)}
						</FieldGroup>
					</div>
					<DialogFooter className='gap-2'>
						{org.hasActiveBonus && (
							<Button
								variant='destructive'
								onClick={clearBonus}
								disabled={updateSubscription.isPending}
							>
								Remove Bonus
							</Button>
						)}
						<LoadingButton
							onClick={handleBonusSubmit}
							loading={updateSubscription.isPending}
						>
							Save Bonus
						</LoadingButton>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	)
}
