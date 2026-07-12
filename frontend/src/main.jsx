import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { TreeProvider } from './context/TreeContext.jsx'
import { ProjectsProvider } from './context/ProjectsContext.jsx'
import { PropsProvider } from './context/PropsContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <TreeProvider>
      <ProjectsProvider>
        <PropsProvider>
          <App />
        </PropsProvider>
      </ProjectsProvider>
    </TreeProvider>
  </StrictMode>,
)
