import { expoClient } from '@better-auth/expo/client'
import { env } from '@fit/env/native'
import { createAuthClient } from 'better-auth/react'
import Constants from 'expo-constants'
import storageUtil from './storage'

export const authClient = createAuthClient({
	baseURL: env.EXPO_PUBLIC_SERVER_URL,
	plugins: [
		expoClient({
			scheme: Constants.expoConfig?.scheme as string,
			storagePrefix: Constants.expoConfig?.scheme as string,
			// @ts-ignore
			storage: storageUtil,
		}),
	],
})
