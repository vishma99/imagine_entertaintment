import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Mainpage from "./page/Mainpage";
import EventCreate from "./page/CreateEvent";
import PendingEvents from "./page/Pending";
import MissingItem from "./page/MissingItem";
import Summary from "./page/Summary";
import Scan from "./page/Scan";
import AddItem from "./page/AddItem";
import ReturnItem from "./page/returnItem";
import Members from "./page/Members";
import ItemSummary from "./page/ItemSummary";
import Register from "./page/Register";
import Login from "./page/Login";
import AdminDashboard from "./page/AdminDashboard";

export default function App() {
  const isAuthenticated = localStorage.getItem("token");
  const userRole = localStorage.getItem("userRole");
  return (
    <div>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          {/* <Route path="/navbar" element={<Navbar />} /> */}
          <Route
            path="/"
            element={isAuthenticated ? <Mainpage /> : <Navigate to="/login" />}
          />
          <Route
            path="/createEvent"
            element={
              isAuthenticated ? <EventCreate /> : <Navigate to="/login" />
            }
          />
          <Route
            path="/pendingEvent"
            element={
              isAuthenticated ? <PendingEvents /> : <Navigate to="/login" />
            }
          />
          <Route
            path="/missingItem"
            element={
              isAuthenticated ? <MissingItem /> : <Navigate to="/login" />
            }
          />
          <Route
            path="/summary"
            element={isAuthenticated ? <Summary /> : <Navigate to="/login" />}
          />
          <Route
            path="/scan"
            element={isAuthenticated ? <Scan /> : <Navigate to="/login" />}
          />
          <Route
            path="/additem/:eventId/:category"
            element={isAuthenticated ? <AddItem /> : <Navigate to="/login" />}
          />
          <Route
            path="/returnitem/:eventId/:category"
            element={
              isAuthenticated ? <ReturnItem /> : <Navigate to="/login" />
            }
          />
          <Route
            path="/member"
            element={isAuthenticated ? <Members /> : <Navigate to="/login" />}
          />
          <Route
            path="/itemSummary"
            element={
              isAuthenticated ? <ItemSummary /> : <Navigate to="/login" />
            }
          />
          <Route
            path="/register"
            element={
              isAuthenticated && userRole === "Admin" ? (
                <Register />
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          <Route
            path="/adminDashboard"
            element={
              isAuthenticated && userRole === "Admin" ? (
                <AdminDashboard />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}
