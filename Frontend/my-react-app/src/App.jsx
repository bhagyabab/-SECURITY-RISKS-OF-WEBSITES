import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./Home/LandingPage";
import Login from "./Home/Login";
import Signup from "./Home/Signup";
import AdminLayout from "./Admin/AdminLayout";
import AdminDashboard from "./Admin/AdminDashboard";
import UserManagement from "./Admin/UserManagement";
import FileManagement from "./Admin/Filemanagement";
import Notifications from "./Admin/Notifications";
import UserDashboard from "./User/UserDashboard";
import UploadFile from "./User/UploadFile";
import MyFiles from "./User/MyFiles";
import Profile from "./User/Profile";
import UserLayout from "./User/UserLayout";
import ManagerLayout from "./Manager/ManagerLayout";
import ManagerDashboard from "./Manager/ManagerDashboard";
import ManagerFiles from "./Manager/ManagerFiles";
import ManagerUsers from "./Manager/ManagerUsers";
import ManagerNotifications from "./Manager/ManagerNotifications";
import AllFiles from "./User/AllFiles";
import ManagerProfile from "./Manager/ManagerProfile";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<UserManagement />} />
          <Route path="/admin/files" element={<FileManagement />} />
          <Route path="/admin/notifications" element={<Notifications />} />
        </Route>

        <Route path="/user" element={<UserLayout />}>
          <Route path="dashboard" element={<UserDashboard />} />
          <Route path="upload" element={<UploadFile />} />
          <Route path="files" element={<MyFiles />} />
          <Route path="all-files" element={<AllFiles />} />   {/* ← add this */}
          <Route path="profile" element={<Profile />} />
        </Route>

        <Route path="/manager" element={<ManagerLayout />}>
          <Route path="dashboard" element={<ManagerDashboard />} />
          <Route path="files" element={<ManagerFiles />} />
          <Route path="users" element={<ManagerUsers />} />
          <Route path="notifications" element={<ManagerNotifications />} />
          <Route path="profile" element={<ManagerProfile />} />  {/* ← add this */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;