// Environment configuration
export const config = {
  // API Configuration
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  
  // API Headers
  defaultHeaders: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  }
} as const

// Helper function to build API URLs
export const buildApiUrl = (endpoint: string): string => {
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint
  return `${config.apiBaseUrl}/${cleanEndpoint}`
}

// Helper function for API calls with default headers
export const apiRequest = async (endpoint: string, options: RequestInit = {}): Promise<Response> => {
  const url = buildApiUrl(endpoint)
  
  const defaultOptions: RequestInit = {
    headers: {
      ...config.defaultHeaders,
      ...(options.headers || {})
    }
  }
  
  return fetch(url, { ...defaultOptions, ...options })
}
