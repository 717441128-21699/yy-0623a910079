import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Layout from '@/components/Layout'
import Overview from '@/pages/Overview'
import Analysis from '@/pages/Analysis'
import Review from '@/pages/Review'

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/overview" replace />} />
          <Route path="overview" element={<Overview />} />
          <Route path="analysis" element={<Analysis />} />
          <Route path="review" element={<Review />} />
        </Route>
      </Routes>
    </Router>
  )
}
