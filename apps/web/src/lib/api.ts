const baseUrl = (import.meta.env.VITE_EDITORIAL_API_BASE_URL as string | undefined) ?? '/api'

export class EditorialApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
    this.name = 'EditorialApiError'
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })

  if (!response.ok) {
    throw new EditorialApiError(`Editorial API request failed: ${response.status}`, response.status)
  }

  return response.json() as Promise<T>
}
