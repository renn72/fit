'use client'

import { useState } from 'react'

import {
	Combobox,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
} from '@/components/ui/combobox'
import {
	TagsInputClear,
	TagsInputInput,
	TagsInputItem,
	TagsInputList,
	TagsInput as TagsInputRoot,
} from '@/components/ui/tags-input'

import { ArrowsClockwiseIcon } from '@phosphor-icons/react'

interface TagsInputProps {
	value: string[]
	onValueChange: (value: string[]) => void
	suggestions?: string[]
	placeholder?: string
	className?: string
}

export function TagsInput({
	value,
	onValueChange,
	suggestions = [],
	placeholder = 'Add item...',
	className,
}: TagsInputProps) {
	const [inputValue, setInputValue] = useState('')
	const [comboValue, setComboValue] = useState('')
	return (
		<TagsInputRoot
			value={value}
			onValueChange={onValueChange}
			className={className}
			editable
			onKeyDown={(e) => {
				if (e.key === 'Enter' && inputValue) {
					e.preventDefault()
					if (value.indexOf(inputValue) === -1) {
						setInputValue('')
						onValueChange([...value, inputValue])
					}
				}
			}}
		>
			<TagsInputList>
				{value.map((item) => (
					<TagsInputItem key={item} value={item}>
						{item}
					</TagsInputItem>
				))}
				<TagsInputInput placeholder={placeholder} asChild>
					<div className='flex gap-1 w-full'>
						<Combobox
							defaultValue={comboValue}
							inputValue={inputValue}
							onInputValueChange={setInputValue}
							items={suggestions}
							value={comboValue}
							onValueChange={(val) => {
								const strVal = val?.toString()
								if (strVal && value.indexOf(strVal) === -1) {
									setInputValue('')
									setComboValue('')
									onValueChange([...value, strVal])
								}
							}}
						>
							<ComboboxInput
								className='min-w-40 border-none! shadow-none! focus-visible:ring-0!'
								placeholder={placeholder}
							/>
							<ComboboxContent>
								<ComboboxEmpty>No items found.</ComboboxEmpty>
								<ComboboxList>
									{suggestions.map((suggestion) => (
										<ComboboxItem
											className='capitalize'
											key={suggestion}
											value={suggestion}
										>
											{suggestion}
										</ComboboxItem>
									))}
								</ComboboxList>
							</ComboboxContent>
						</Combobox>
						<TagsInputClear className='flex justify-center items-center w-8 h-8 bg-transparent rounded-md border transition-colors border-input text-muted-foreground shrink-0 hover:bg-muted hover:text-foreground'>
							<ArrowsClockwiseIcon size={14} />
						</TagsInputClear>
					</div>
				</TagsInputInput>
			</TagsInputList>
		</TagsInputRoot>
	)
}
