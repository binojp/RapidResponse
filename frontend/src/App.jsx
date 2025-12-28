import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";

import Login from "./Pages/Login";
import Register from "./Pages/Register";
import Heatmap from "./Pages/Heatmap";
import IncidentReport from "./Pages/IncidentReport";
import Leaderboard from "./Pages/Leaderboard";
import Navbar from "./Navbar";
import CitizenDash from "./Pages/CitizenDash";
import ResponderDash from "./Pages/ResponderDash";
import AddAdmin from "./Pages/AddAdmin";
import RewardsPage from "./Pages/Rewards.jsx";
import IncidentDetails from "./Pages/IncidentDetails";
import ResponderIncidentDetails from "./Pages/ResponderIncidentDetails";

/* ---------- AUTH HELPERS ---------- */

const isAuthenticated = () => {
  return !!localStorage.getItem("token");
};

/* ---------- ROUTE GUARDS ---------- */

function ProtectedLayout() {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
}

function PublicLayout() {
  if (isAuthenticated()) {
    return <Navigate to="/citizen/dashboard" replace />;
  }

  return <Outlet />;
}

/* ---------- APP ---------- */

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* PUBLIC ROUTES (NO NAVBAR) */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* PROTECTED ROUTES (WITH NAVBAR) */}
        <Route element={<ProtectedLayout />}>
          <Route path="/heatmap" element={<Heatmap />} />
          <Route path="/incident/report" element={<IncidentReport />} />
          <Route path="/report" element={<IncidentReport />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/citizen/dashboard" element={<CitizenDash />} />
          <Route path="/user/dashboard" element={<CitizenDash />} />
          <Route path="/responder/dashboard" element={<ResponderDash />} />
          <Route path="/admin/dashboard" element={<ResponderDash />} />
          <Route path="/add" element={<AddAdmin />} />
          <Route path="/rewards" element={<RewardsPage />} />
          <Route path="/citizen/incident/:id" element={<IncidentDetails />} />
          <Route
            path="/responder/incident/:id"
            element={<ResponderIncidentDetails />}
          />
          <Route
            path="/admin/incident/:id"
            element={<ResponderIncidentDetails />}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
