export {}
declare global {
  interface IBackendRes<T> {
    isSuccess: boolean
    statusCode: number
    message: string
    result: T
  }
  interface IPagedResult<T> {
    items: T[]
    totalCount: number
    pageNumber: number
    pageSize: number
    totalPages: number
    hasPreviousPage: boolean
    hasNextPage: boolean
  }
  interface IUser {
    id: string
    login: string
    name?: string
    email?: string
    role: string
    avatarUrl?: string
    roles?: string[]
    permissions?: string[]
  }
}
