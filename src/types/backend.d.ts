export {}
declare global {
  // Mọi response của backend PetCare đều bọc theo dạng này.
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
  }
}
