import { Link, useLocation } from "react-router-dom";
import "./Sidebar.css";

const Sidebar = () => {
  const location = useLocation();

  // const isActive = (path) => location.pathname.includes(path);
  const isActive = (path) => location.pathname === path;


  return ( 
    <div className="sidebar" style={{ backgroundColor: '#ffffff' }}>
       <div className="user-info">
      <img src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png" alt="avatar" />
        <div>
        <p><strong>Xin chào, Admin!</strong></p>
        <p className="text-xs text-gray-500">ADMIN</p>
      </div>
      </div>
      <ul>
        <li className={isActive("/admin") ? "active" : ""}>
          <Link to="/admin">Dashboard</Link>
        </li>
        <li className={isActive("/admin/users") ? "active" : ""}>
          <Link to="/admin/users">Manage User</Link>
        </li>
        <li className={isActive("/admin/plan") ? "active" : ""}>
          <Link to="/admin/plan">Manage Health Exam Plan</Link>
        </li>
        <li className={isActive("/admin/managedoctor") ? "active" : ""}>
          <Link to="/admin/managedoctor">Manage Doctor</Link>
        </li>

      </ul>
    </div>
  );
};

export default Sidebar;
