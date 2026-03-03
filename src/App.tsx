import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import CustomerMenu from "./components/CustomerMenu";
import AdminDashboard from "./components/AdminDashboard";
import { Toaster } from "react-hot-toast";

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#f5f5f0] text-[#1a1a1a]">
        <Routes>
          <Route path="/menu" element={<CustomerMenu />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/" element={<Navigate to="/menu" replace />} />
        </Routes>
        <Toaster position="bottom-center" />
      </div>
    </BrowserRouter>
  );
}
