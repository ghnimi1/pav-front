"use client"

import axios, { AxiosError, type AxiosRequestConfig } from "axios"

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace(/\/$/, "")
const AUTH_TOKEN_KEY = "authToken"

type ApiEnvelope<T> = {
  success?: boolean
  data?: T
  error?: string
  message?: string
}

type ApiRequestConfig = AxiosRequestConfig & {
  skipAuth?: boolean
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
})

apiClient.interceptors.request.use((config) => {
  if (config.skipAuth || typeof window === "undefined") {
    return config
  }

  const token = localStorage.getItem(AUTH_TOKEN_KEY)
  if (token) {
    config.headers = config.headers ?? {}
    ;(config.headers as Record<string, string>).Authorization = `Bearer ${token}`
  }

  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiEnvelope<unknown>>) => {
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      "Une erreur est survenue"

    return Promise.reject(new Error(message))
  }
)

function unwrapResponse<T>(payload: ApiEnvelope<T> | T): T {
  if (payload && typeof payload === "object" && "data" in payload) {
    return payload.data as T
  }

  return payload as T
}

export async function apiRequest<T>(config: ApiRequestConfig): Promise<T> {
  const response = await apiClient.request<ApiEnvelope<T> | T>(config)
  return unwrapResponse<T>(response.data)
}

export function apiGet<T>(url: string, config?: ApiRequestConfig) {
  return apiRequest<T>({ ...config, method: "GET", url })
}

export function apiPost<T>(url: string, data?: unknown, config?: ApiRequestConfig) {
  return apiRequest<T>({ ...config, method: "POST", url, data })
}

export function apiPut<T>(url: string, data?: unknown, config?: ApiRequestConfig) {
  return apiRequest<T>({ ...config, method: "PUT", url, data })
}

export function apiPatch<T>(url: string, data?: unknown, config?: ApiRequestConfig) {
  return apiRequest<T>({ ...config, method: "PATCH", url, data })
}

export function apiDelete<T>(url: string, config?: ApiRequestConfig) {
  return apiRequest<T>({ ...config, method: "DELETE", url })
}
