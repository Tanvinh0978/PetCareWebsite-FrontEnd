import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  isAuthenticated: boolean
  user: IUser | null
  accessToken: string | null
  role: string | null
  setAuth: (accessToken: string, user: IUser) => void
  setPermissions: (permissions: string[]) => void
  setRoles: (roles: string[]) => void
  updateUser: (patch: Partial<IUser>) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      accessToken: null,
      role: null,
      setAuth: (accessToken, user) => set({ isAuthenticated: true, accessToken, user, role: user.role }),
      setPermissions: (permissions) =>
        set((state) => ({ user: state.user ? { ...state.user, permissions } : null })),
      setRoles: (roles) =>
        set((state) => ({ user: state.user ? { ...state.user, roles } : null })),
      updateUser: (patch) =>
        set((state) => ({ user: state.user ? { ...state.user, ...patch } : null })),
      logout: () => set({ isAuthenticated: false, user: null, accessToken: null, role: null }),
    }),
    { name: 'petcare-auth-storage' },
  ),
)
