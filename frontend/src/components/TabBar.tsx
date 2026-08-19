import { NavLink } from 'react-router-dom';

const items = [
  { to: '/', label: 'Главная', icon: 'home' },
  { to: '/schedule', label: 'Расписание', icon: 'cal' },
  { to: '/learn', label: 'Обучение', icon: 'learn' },
  { to: '/profile', label: 'Профиль', icon: 'user' },
];

function Icon({ name }: { name: string }) {
  if (name === 'home') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 11.5 12 5l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z" />
      </svg>
    );
  }
  if (name === 'cal') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 3h2v2h6V3h2v2h3v16H4V5h3V3zm-1 6v10h12V9H6z" />
      </svg>
    );
  }
  if (name === 'learn') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 4 3 8.5 12 13l7-3.5V16h2V8.5L12 4zM5 13.2V17c0 1.7 3.1 3 7 3s7-1.3 7-3v-3.8l-7 3.5-7-3.5z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm0 2c-4 0-8 2-8 5v1h16v-1c0-3-4-5-8-5z" />
    </svg>
  );
}

export function TabBar() {
  return (
    <nav className="tabbar">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          className={({ isActive }) => (isActive ? 'tabbar-link active' : 'tabbar-link')}
        >
          <Icon name={item.icon} />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
