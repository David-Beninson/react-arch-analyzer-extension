import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Layout from './components/Common/Layout'
import NotFound from './pages/NotFound/NotFound'
import HomePage from './pages/Home/HomePage'
import NewProject from './pages/NewProject/NewProject'
import Dashboard from './pages/Dashboard/Dashboard'

export default function App() {
  const router = createBrowserRouter([
    {
      path: '/',
      element: <Layout />,
      errorElement: <NotFound />,
      children: [
        {
          index: true,
          element: <HomePage />
        },
        {
          path: '/newproject',
          element: <NewProject />
        },
        {
          path: '/dashboard/:projectName?',
          element: <Dashboard />
        },
        {
          path: '*',
          element: <NotFound />
        }
      ]
    }
  ])
  return <RouterProvider router={router} />
}