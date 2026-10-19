import type { ThemeConfig } from 'antd'

export const colors = {
  primary: '#785839',
  pine: '#26180f',
  sun: '#c69f7b',
  paper: '#fdf9f3',
} as const

export const antdTheme: ThemeConfig = {
  token: {
    colorPrimary: colors.primary,
    borderRadius: 10,
    fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
  },
  components: {
    Layout: { headerBg: colors.pine, bodyBg: colors.paper },
  },
}
