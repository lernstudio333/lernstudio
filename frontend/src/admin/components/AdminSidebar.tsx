import { NavLink, useNavigate } from 'react-router-dom';
import { BsCollection, BsImages, BsPeopleFill, BsBarChartFill } from 'react-icons/bs';
import { useAuth } from '../../contexts/AuthContext';

const navItems = [
  { to: '/admin/content',   icon: <BsCollection />,   label: 'Content',   adminOnly: false },
  { to: '/admin/media',     icon: <BsImages />,       label: 'Media',     adminOnly: false },
  { to: '/admin/users',     icon: <BsPeopleFill />,   label: 'Users',     adminOnly: false },
  { to: '/admin/learnings', icon: <BsBarChartFill />, label: 'Learnings', adminOnly: true  },
];

function AdminSidebar() {
  const { role } = useAuth();
  const navigate = useNavigate();

  return (
    <nav
      style={{ width: '220px', flexShrink: 0, borderRight: '1px solid #dee2e6', padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column' }}
      className="bg-body-tertiary"
    >
      {/* Header */}
      <div className="mb-3 px-2 d-flex align-items-center gap-2">
        <span
          role="button"
          onClick={() => navigate('/')}
          style={{ color: '#198754', fontWeight: 700, cursor: 'pointer', fontSize: '1.05rem' }}
        >
          Lern-Studio
        </span>
        {role && (
          <span
            className="badge bg-primary"
            style={{ borderRadius: '999px', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em' }}
          >
            {role}
          </span>
        )}
      </div>

      {/* Nav items */}
      <ul className="nav flex-column gap-1" style={{ flex: 1 }}>
        {navItems.filter(item => !item.adminOnly || role === 'admin').map(item => (
          <li className="nav-item" key={item.to}>
            <NavLink
              to={item.to}
              className="nav-link d-flex align-items-center gap-2"
              style={({ isActive }) => isActive
                ? { color: 'var(--bs-primary)', fontWeight: 700, backgroundColor: 'rgba(var(--bs-primary-rgb), 0.12)', borderRadius: '6px' }
                : { color: 'var(--bs-secondary)', fontWeight: 400 }
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>

      {/* Back button */}
      <button
        onClick={() => navigate('/')}
        className="btn btn-primary w-100 d-flex align-items-center justify-content-start gap-2 mt-2"
        style={{ borderRadius: '6px', fontWeight: 500, fontSize: '0.8rem' }}
      >
        <span
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '1.3rem', height: '1.3rem', borderRadius: '50%',
            backgroundColor: 'white', flexShrink: 0,
          }}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
            <polyline points="7,1 3,5 7,9" stroke="var(--bs-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
        Start Learning
      </button>
    </nav>
  );
}

export default AdminSidebar;
