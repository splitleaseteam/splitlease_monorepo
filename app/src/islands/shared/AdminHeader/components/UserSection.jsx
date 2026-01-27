export default function UserSection({ user }) {
  if (!user) {
    return (
      <div className="admin-header__user-section">
        <span className="admin-header__user-text">Log In</span>
      </div>
    );
  }

  const firstName = user.firstName || 'User';
  const email = user.email || '';
  const isAdmin = user.isAdmin ?? false;
  const profilePhotoUrl = user.profilePhotoUrl || null;

  return (
    <div className="admin-header__user-section admin-header__user-section--logged-in">
      <span className="admin-header__user-text admin-header__user-text--logged-in">
        {firstName}, {email}, admin user: {isAdmin.toString()}
      </span>
      {profilePhotoUrl && (
        <img
          src={profilePhotoUrl}
          alt={firstName}
          className="admin-header__profile-img"
        />
      )}
    </div>
  );
}
