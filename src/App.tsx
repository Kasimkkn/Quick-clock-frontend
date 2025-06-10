import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { useAuth } from './context/AuthContext';
import Admin from './pages/Admin';
import AnalyticsPage from './pages/admin/AnalyticsPage';
import AttendancePage from './pages/admin/AttendancePage';
import CalendarPage from './pages/admin/CalendarPage';
import EmployeesPage from './pages/admin/EmployeesPage';
import LeavesPage from './pages/admin/LeavesPage';
import LocationsPage from './pages/admin/LocationsPage';
import NotificationsPage from './pages/admin/NotificationsPage';
import ProjectsPage from './pages/admin/ProjectsPage';
import RequestsPage from './pages/admin/RequestsPage';
import SettingsPage from './pages/admin/SettingsPage';
import TasksPage from './pages/admin/TasksPage';
import Dashboard from './pages/Dashboard';
import MyAttendancePage from './pages/employee/MyAttendancePage';
import MyLeavesPage from './pages/employee/MyLeavesPage';
import MyNotificationsPage from './pages/employee/MyNotificationsPage';
import MyTasksPage from './pages/employee/MyTasksPage';
import RequestPage from './pages/employee/RequestPage';
import TeamCalendarPage from './pages/employee/TeamCalendarPage';
import Index from './pages/Index';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import Scan from './pages/Scan';
import TeamCollaborationPage from './pages/TeamCollaborationPage';

import './App.css';

function App() {
  const { isAuthenticated, isAdmin } = useAuth();

  return (
    <Routes>
      <Route path="/" element={isAuthenticated ? <Navigate to={isAdmin ? "/admin" : "/dashboard"} /> : <Index />} />
      <Route path="/login" element={<Login />} />
      {/* Team Collaboration Route - Available for both admins and employees */}
      <Route
        path="/collaboration"
        element={
          <ProtectedRoute>
            <TeamCollaborationPage />
          </ProtectedRoute>
        }
      />

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <Admin />
          </ProtectedRoute>
        }
      />
      <Route
        path="/attendance"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AttendancePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/leaves"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <LeavesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employees"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <EmployeesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/requests"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <RequestsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/calendar"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <CalendarPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/locations"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <LocationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <SettingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytics"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AnalyticsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/notifications"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <NotificationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/tasks"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <TasksPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <ProjectsPage />
          </ProtectedRoute>
        }
      />

      {/* Employee Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-attendance"
        element={
          <ProtectedRoute>
            <MyAttendancePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-leaves"
        element={
          <ProtectedRoute>
            <MyLeavesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-requests"
        element={
          <ProtectedRoute>
            <RequestPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/team-calendar"
        element={
          <ProtectedRoute>
            <TeamCalendarPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-notifications"
        element={
          <ProtectedRoute>
            <MyNotificationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-tasks"
        element={
          <ProtectedRoute>
            <MyTasksPage />
          </ProtectedRoute>
        }
      />
      <Route path="/scan" element={<Scan />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
