import { NavLink } from 'react-router-dom';
import { BsCollection, BsImages, BsPeopleFill } from 'react-icons/bs';

const navItems = [
  { to: '/admin/content', icon: <BsCollection />, label: 'Content' },
  { to: '/admin/media',   icon: <BsImages />,     label: 'Media' },
  { to: '/admin/users',   icon: <BsPeopleFill />, label: 'Users' },
];

function AdminSidebar() {
  return (
    <nav
      style={{ width: '220px', flexShrink: 0, borderRight: '1px solid #dee2e6', padding: '1rem 0.75rem' }}
      className="bg-body-tertiary"
    >
      <div className="fw-bold mb-3 px-2">Admin</div>
      <ul className="nav nav-pills flex-column gap-1">
        {navItems.map(item => (
          <li className="nav-item" key={item.to}>
            <NavLink
              to={item.to}
              className={({ isActive }) => 'nav-link d-flex align-items-center gap-2' + (isActive ? ' active' : '')}
            >
              {item.icon}
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default AdminSidebar;
