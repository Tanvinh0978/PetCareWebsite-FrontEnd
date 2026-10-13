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
        token: { colorPrimary: '#059669', borderRadius: 8 },
      }}
    >
      <AntApp>
        <AppRoutes />
      </AntApp>
    </ConfigProvider>
  );
}
