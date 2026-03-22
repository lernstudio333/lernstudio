import { Outlet } from 'react-router-dom';
import AdminSidebar from './components/AdminSidebar';

function AdminLayout() {
  return (
    <div className="admin-root" style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <AdminSidebar />
      <main style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
        <Outlet />
      </main>
    </div>
  );
}

export default AdminLayout;
