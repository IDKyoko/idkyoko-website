import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Home from './pages/Home'
import DetailKomik from './pages/DetailKomik'

const router = createBrowserRouter([
  { path: '/', element: <Home /> },
  { path: '/komik/:id', element: <DetailKomik /> },
])

export default function AppRouter() {
  return <RouterProvider router={router} />
}
