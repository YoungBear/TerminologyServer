import { App as AntdApp, ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import TermListPage from './pages/TermListPage';

export default function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <AntdApp>
        <TermListPage />
      </AntdApp>
    </ConfigProvider>
  );
}
