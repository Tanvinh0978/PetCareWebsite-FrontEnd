import { useRoutes } from 'react-router-dom';
import Layout from './shared/components/Layout';
import Home from './pages/Home';
import NotFound from './pages/NotFound';
import { featureRoutes } from './features';

export default function App() {
  return useRoutes([
    {
      element: <Layout />,
      children: [
        { index: true, element: <Home /> },
        ...featureRoutes,
        { path: '*', element: <NotFound /> },
      ],
    },
  ]);
}
