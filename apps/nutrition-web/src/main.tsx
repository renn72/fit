import '@fit/components/styles.css'
import './styles.css'

import { StrictMode } from 'react'

import { RouterProvider } from '@tanstack/react-router'

import { getRouter } from './router'

import { createRoot } from 'react-dom/client'

const router = getRouter()
const rootElement = document.getElementById('root')

if (!rootElement) {
	throw new Error('Missing root element')
}

createRoot(rootElement).render(
	<StrictMode>
		<RouterProvider router={router} />
	</StrictMode>,
)
