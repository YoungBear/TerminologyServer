import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'

// Temporary minimal entry point so the dev environment runs and the
// Ant Design dependency is type-checked at build time.
// Replaced by the full App shell in a later task.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigProvider locale={zhCN}>
      <div style={{ padding: 24 }}>术语管理系统</div>
    </ConfigProvider>
  </StrictMode>,
)
