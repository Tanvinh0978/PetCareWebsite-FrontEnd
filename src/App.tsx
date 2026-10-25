import AppRoutes from "@/routes";
import { ConfigProvider, App as AntApp, theme } from "antd";
import enUS from "antd/locale/en_US";
import { useTheme } from "@/theme/ThemeContext";

export default function App() {
  const { mode } = useTheme();

  return (
    <ConfigProvider
      locale={enUS}
      theme={{
        algorithm: mode === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#785839',
          colorLink: '#785839',
          colorLinkHover: '#3d2d23',
          colorSuccess: '#4a634e',
          colorWarning: '#c69f7b',
          borderRadius: 10,
          fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
          ...(mode === 'dark'
            ? {
                colorBgBase: '#19120e',
                colorBgContainer: '#231a14',
                colorBorder: '#382a21',
              }
            : {
                colorBgBase: '#fdf9f3',
                colorBgContainer: '#ffffff',
                colorBorder: '#e8ded6',
              }),
        },
      }}
    >
      <AntApp>
        <AppRoutes />
      </AntApp>
    </ConfigProvider>
  );
}
