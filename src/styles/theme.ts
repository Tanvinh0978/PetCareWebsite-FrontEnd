import type { ThemeConfig } from 'antd'

export const colors = {
  primary: '#2f7d5b',
  pine: '#12302c',
  sun: '#ffc93c',
  paper: '#f6faf7',
} as const

export const antdTheme: ThemeConfig = {
  token: {
    colorPrimary: colors.primary,
    borderRadius: 8,
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  },
  components: {
    Layout: { headerBg: colors.pine, bodyBg: colors.paper },
  },
}
