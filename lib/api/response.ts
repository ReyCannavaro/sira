import { NextResponse } from 'next/server'

export type ApiResponse<T = unknown> = {
  success: boolean
  data?:    T
  error?:   string
  message?: string
}

export function ok<T>(data: T, message?: string, status = 200) {
  return NextResponse.json<ApiResponse<T>>(
    { success: true, data, message },
    { status }
  )
}

export function created<T>(data: T, message?: string) {
  return ok(data, message, 201)
}

export function badRequest(error: string) {
  return NextResponse.json<ApiResponse>(
    { success: false, error },
    { status: 400 }
  )
}

export function unauthorized(error = 'Unauthorized') {
  return NextResponse.json<ApiResponse>(
    { success: false, error },
    { status: 401 }
  )
}

export function forbidden(error = 'Forbidden') {
  return NextResponse.json<ApiResponse>(
    { success: false, error },
    { status: 403 }
  )
}

export function notFound(error = 'Not found') {
  return NextResponse.json<ApiResponse>(
    { success: false, error },
    { status: 404 }
  )
}

export function serverError(error = 'Internal server error') {
  return NextResponse.json<ApiResponse>(
    { success: false, error },
    { status: 500 }
  )
}