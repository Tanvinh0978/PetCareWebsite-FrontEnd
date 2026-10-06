import { BrowserRouter } from 'react-router-dom'
import { App as AntdApp, ConfigProvider } from 'antd'
import { ProConfigProvider, enUSIntl } from '@ant-design/pro-components'
import enUS from 'antd/locale/en_US'
import AppRoutes from './routes/app.route.tsx'
import { antdTheme } from './styles/theme.ts'

function App() {
  return (
    <ConfigProvider locale={enUS} theme={antdTheme}>
      <AntdApp>
        <ProConfigProvider intl={enUSIntl}>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </ProConfigProvider>
      </AntdApp>
    </ConfigProvider>
  )
}

export default App
