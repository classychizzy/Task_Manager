import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from './pages/Login'
// import { useEffect } from "react";
// import { checkBackendHealth } from "./api/testapi";

function App() {


  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<h1>Task Manager</h1>} />
        <Route path="/login" element={<LoginPage />} />
        {/* <Route path="*" element={<h1>404 - Page Not Found</h1>} /> */}
        <Route path="/register" element={<h1>Register</h1>} />
        <Route path="/dashboard" element={<h1>Dashboard</h1>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;