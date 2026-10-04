import PostHog from 'posthog-react-native'

const projectToken = process.env.EXPO_PUBLIC_POSTHOG_PROJECT_TOKEN
const host = process.env.EXPO_PUBLIC_POSTHOG_HOST

if (!projectToken && __DEV__) {
  throw new Error(
    'EXPO_PUBLIC_POSTHOG_PROJECT_TOKEN variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once EXPO_PUBLIC_POSTHOG_PROJECT_TOKEN is configured',
  )
}

if (!host && __DEV__) {
  throw new Error(
    'EXPO_PUBLIC_POSTHOG_HOST variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once EXPO_PUBLIC_POSTHOG_HOST is configured',
  )
}

export const isPostHogConfigured = Boolean(projectToken && host)

export const posthog = isPostHogConfigured
  ? new PostHog(projectToken!, {
      host: host!,
      logs: {
        serviceName: 'react_native_pebble',
        environment: __DEV__ ? 'development' : 'production',
      },
    })
  : undefined

export const posthogLog = {
  info: (
    message: string,
    attributes: Record<string, string | number | boolean>,
  ) => posthog?.logger.info(message, attributes),
}
