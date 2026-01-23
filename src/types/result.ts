export interface Result<T> {
  code: number
  errorMessage?: string
  data: T
}
