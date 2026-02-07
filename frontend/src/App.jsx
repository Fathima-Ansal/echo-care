import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ElderlyDashboard from './pages/ElderlyDashboard';
import CaretakerDashboard from './pages/CaretakerDashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ElderlyDashboard />} />
        <Route path="/caretaker" element={<CaretakerDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
