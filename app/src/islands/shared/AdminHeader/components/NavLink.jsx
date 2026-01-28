export default function NavLink({
  name,
  path,
  icon: Icon,
  description = '',
  isActive = false,
}) {
  return (
    <a
      href={path}
      className={`admin-header__dropdown-link ${isActive ? 'admin-header__dropdown-link--active' : ''}`.trim()}
      title={description}
      role="menuitem"
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon className="admin-header__dropdown-link-icon" size={18} />
      <span>{name}</span>
    </a>
  );
}
