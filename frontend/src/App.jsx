import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthProvider, AuthContext } from './context/AuthContext';
import ElderlyDashboard from './pages/ElderlyDashboard';
import CaretakerDashboard from './pages/CaretakerDashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import './App.css';

const ProtectedRoute = ({ children, allowedRole }) => {
  const { token, userRole } = useContext(AuthContext);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && userRole !== allowedRole) {
    return <Navigate to={userRole === 'caregiver' ? '/caretaker' : '/'} replace />;
  }

  return children;
};
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/"
            element={
              <ProtectedRoute allowedRole="elderly">
                <ElderlyDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/caretaker"
            element={
              <ProtectedRoute allowedRole="caregiver">
                <CaretakerDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
