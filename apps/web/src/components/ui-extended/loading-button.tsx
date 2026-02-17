import { Button, type ButtonProps } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'

export interface LoadingButtonProps extends ButtonProps {
	loading?: boolean
}

export function LoadingButton({
	loading,
	disabled,
	children,
	...props
}: LoadingButtonProps) {
	return (
		<Button disabled={disabled || loading} {...props}>
			{loading && <Spinner className='mr-2' />}
			{children}
		</Button>
	)
}
