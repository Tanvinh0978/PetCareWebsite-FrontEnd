import AppRoutes from "@/routes";
import { ConfigProvider, App as AntApp } from "antd";
import enUS from "antd/locale/en_US";

export default function App() {
  return (
    <ConfigProvider locale={enUS}>
      <AntApp>
        <AppRoutes />
      </AntApp>
    </ConfigProvider>
  );
}
