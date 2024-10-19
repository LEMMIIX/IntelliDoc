
import { Routes, Route } from 'react-router-dom';
import Login from "./pages/Login.jsx/Login";
import Signup from "./pages/Signup";
import Home from "./pages/Home";
import Dashboard from "./features/dashboard/Dashboard.jsx";


const App = () => {
  return (
    <div>
      <Routes>
        <Route path="/" element={<Home/>} /> 
        <Route path="/dashboard" element={<Dashboard/>} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Routes>
    </div>
  );
}

export default App;

