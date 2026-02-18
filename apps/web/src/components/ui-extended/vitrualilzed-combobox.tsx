'use client'

import * as React from 'react'

import { Button } from '@/components/ui/button'
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from '@/components/ui/command'
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

import { useVirtualizer } from '@tanstack/react-virtual'

import { Check, ChevronsUpDown } from 'lucide-react'

type Option = {
	value: string
	label: string
}

interface VirtualizedCommandProps {
	height: string
	options: Option[]
	placeholder: string
	selectedOption: string
	onSelectOption?: (option: string) => void
}

const VirtualizedCommand = ({
	height,
	options,
	placeholder,
	selectedOption,
	onSelectOption,
}: VirtualizedCommandProps) => {
	const [filteredOptions, setFilteredOptions] =
		React.useState<Option[]>(options)
	const [focusedIndex, setFocusedIndex] = React.useState(0)
	const [isKeyboardNavActive, setIsKeyboardNavActive] = React.useState(false)

	const parentRef = React.useRef(null)

	const virtualizer = useVirtualizer({
		count: filteredOptions.length,
		getScrollElement: () => parentRef.current,
		estimateSize: () => 45,
	})

	const virtualOptions = virtualizer.getVirtualItems()

	const scrollToIndex = (index: number) => {
		virtualizer.scrollToIndex(index, {
			align: 'center',
		})
	}

	const handleSearch = (search: string) => {
		setIsKeyboardNavActive(false)
		setFilteredOptions(
			options.filter((option) =>
				option.label
					.toLowerCase()
					.replace(',', '')
					.includes(search.toLowerCase() ?? []),
			),
		)
	}

	const handleKeyDown = (event: React.KeyboardEvent) => {
		switch (event.key) {
			case 'ArrowDown': {
				event.preventDefault()
				setIsKeyboardNavActive(true)
				setFocusedIndex((prev) => {
					const newIndex =
						prev === -1 ? 0 : Math.min(prev + 1, filteredOptions.length - 1)
					scrollToIndex(newIndex)
					return newIndex
				})
				break
			}
			case 'ArrowUp': {
				event.preventDefault()
				setIsKeyboardNavActive(true)
				setFocusedIndex((prev) => {
					const newIndex =
						prev === -1 ? filteredOptions.length - 1 : Math.max(prev - 1, 0)
					scrollToIndex(newIndex)
					return newIndex
				})
				break
			}
			case 'Enter': {
				event.preventDefault()
				if (filteredOptions[focusedIndex]) {
					onSelectOption?.(filteredOptions[focusedIndex].value)
				}
				break
			}
			default:
				break
		}
	}

	React.useEffect(() => {
		if (selectedOption) {
			const option = filteredOptions.find(
				(option) => option.value === selectedOption,
			)
			if (option) {
				const index = filteredOptions.indexOf(option)
				setFocusedIndex(index)
				virtualizer.scrollToIndex(index, {
					align: 'center',
				})
			}
		}
	}, [selectedOption, filteredOptions, virtualizer])

	return (
		<Command shouldFilter={false} onKeyDown={handleKeyDown}>
			<CommandInput onValueChange={handleSearch} placeholder={placeholder} />
			<CommandList
				ref={parentRef}
				style={{
					height: height,
					width: '100%',
					overflow: 'auto',
					zIndex: 1010,
				}}
				onMouseDown={() => setIsKeyboardNavActive(false)}
				onMouseMove={() => setIsKeyboardNavActive(false)}
			>
				<CommandEmpty>No item found.</CommandEmpty>
				<CommandGroup>
					<div
						style={{
							height: `${virtualizer.getTotalSize()}px`,
							width: '100%',
							position: 'relative',
						}}
					>
						{virtualOptions.map((virtualOption) => (
							<CommandItem
								key={filteredOptions[virtualOption.index].value}
								disabled={isKeyboardNavActive}
								className={cn(
									'absolute left-0 top-0 w-full bg-transparent ',
									focusedIndex === virtualOption.index &&
										'bg-accent text-accent-foreground',
									isKeyboardNavActive &&
										focusedIndex !== virtualOption.index &&
										'aria-selected:bg-transparent aria-selected:text-primary',
								)}
								style={{
									height:
										(filteredOptions[virtualOption.index]?.value?.length ?? 0) >
										90
											? `${virtualOption.size}px`
											: `${virtualOption.size}px`,
									transform: `translateY(${virtualOption.start}px)`,
								}}
								value={filteredOptions[virtualOption.index].value}
								onMouseEnter={() =>
									!isKeyboardNavActive && setFocusedIndex(virtualOption.index)
								}
								onMouseLeave={() => !isKeyboardNavActive && setFocusedIndex(-1)}
								onSelect={onSelectOption}
							>
								<Check
									className={cn(
										'mr-2 h-4 w-4',
										selectedOption ===
											filteredOptions[virtualOption.index].value
											? 'opacity-100'
											: 'opacity-0',
									)}
								/>
								{filteredOptions[virtualOption.index].label.slice(0, 80)}
							</CommandItem>
						))}
					</div>
				</CommandGroup>
			</CommandList>
		</Command>
	)
}

interface VirtualizedComboboxProps {
	options: Option[]
	searchPlaceholder?: string
	width?: string
	height?: string
	selectedOption: string
	onSelectOption: (option: string) => void
}

function VirtualizedCombobox({
	options,
	searchPlaceholder = 'Search items...',
	width = '350px',
	height = '400px',
	selectedOption,
	onSelectOption,
}: VirtualizedComboboxProps) {
	const [open, setOpen] = React.useState(false)

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger
				render={
					<Button
						variant='outline'
						aria-expanded={open}
						className='flex justify-between truncate'
						style={{
							width: width,
						}}
					/>
				}
			>
				<span className='truncate'>
					{selectedOption
						? options.find((option) => option.value === selectedOption)?.label
						: searchPlaceholder}
				</span>
				<ChevronsUpDown className='ml-2 w-4 h-4 opacity-50 shrink-0' />
			</PopoverTrigger>
			<PopoverContent
				side='bottom'
				sideOffset={-100}
				className='p-0 w-screen h-75 z-2010 border-primary/60'
			>
				<VirtualizedCommand
					height={height}
					options={options}
					placeholder={searchPlaceholder}
					selectedOption={selectedOption}
					onSelectOption={(currentValue) => {
						onSelectOption(currentValue === selectedOption ? '' : currentValue)
						setOpen(false)
					}}
				/>
			</PopoverContent>
		</Popover>
	)
}

export { VirtualizedCombobox }
