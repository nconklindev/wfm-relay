import type { H3Event } from 'h3'

const TOKEN_COOKIE = 'wfm_token'
const HOSTNAME_COOKIE = 'wfm_hostname'

/** Picks eval or prod token URL based on whether the hostname contains 'cfn'. */
export function getTokenUrl(hostname: string): string {
  const config = useRuntimeConfig()

  if (!hostname) return config.wfmTokenUrlEval

  try {
    const { host } = new URL(hostname)
    if (host.toLowerCase().includes('cfn')) return config.wfmTokenUrlEval
  }
  catch {
    return config.wfmTokenUrlEval
  }

  return config.wfmTokenUrlProd
}

export function getWfmSession(event: H3Event): { token: string; hostname: string } {
  return {
    token: getCookie(event, TOKEN_COOKIE) ?? '',
    hostname: getCookie(event, HOSTNAME_COOKIE) ?? '',
  }
}

export function setWfmSession(event: H3Event, token: string, hostname: string): void {
  const isProd = process.env.NODE_ENV === 'production'
  const cookieOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 8, // 8 hours
    path: '/',
  }
  setCookie(event, TOKEN_COOKIE, token, cookieOptions)
  setCookie(event, HOSTNAME_COOKIE, hostname, cookieOptions)
}

export function clearWfmSession(event: H3Event): void {
  deleteCookie(event, TOKEN_COOKIE)
  deleteCookie(event, HOSTNAME_COOKIE)
}

/**
 * Makes an authenticated request to the WFM API.
 * Proxies the upstream HTTP error status on failure.
 */
export async function callWfmApi(
  token: string,
  hostname: string,
  method: 'GET' | 'POST',
  apiPath: string,
  data?: unknown,
): Promise<unknown> {
  const url = `${hostname.replace(/\/$/, '')}/${apiPath.replace(/^\//, '')}`

  try {
    return await $fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      ...(method === 'GET'
        ? { query: data as Record<string, string> }
        : { body: (data ?? {}) as Record<string, unknown> }),
    })
  }
  catch (error) {
    const err = error as { response?: { status: number; _data?: unknown } }
    const wfmData = err.response?._data as Record<string, unknown> | undefined
    // Surface the WFM error message so the client can display it directly
    const wfmMessage = wfmData?.message ?? wfmData?.detail ?? wfmData?.errorMessage
    throw createError({
      statusCode: err.response?.status ?? 502,
      statusMessage: typeof wfmMessage === 'string' ? wfmMessage : 'WFM API request failed',
      data: wfmData,
    })
  }
}
