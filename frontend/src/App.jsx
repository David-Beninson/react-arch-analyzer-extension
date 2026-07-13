import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Layout from './components/Common/Layout';
import ProtectedRoute from './components/Common/ProtectedRoute';
import NotFound from './pages/NotFound/NotFound';
import HomePage from './pages/Home/HomePage';
import NewProject from './pages/NewProject/NewProject';
import Dashboard from './pages/Dashboard/Dashboard';

const router = createBrowserRouter([
    {
        path: '/',
        element: <Layout />,
        errorElement: <NotFound />,
        children: [
            {
                element: <ProtectedRoute />,
                children: [
                    {
                        index: true,
                        element: <HomePage />,
                    },
                    {
                        path: 'newproject',
                        element: <NewProject />,
                    },
                    {
                        path: 'dashboard/:projectName?',
                        element: <Dashboard />,
                    },
                ],
            },
            { path: '*', element: <NotFound /> },
        ],
    },
]);

export default function App() {
    return <RouterProvider router={router} />;
}