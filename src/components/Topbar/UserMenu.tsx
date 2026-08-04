import { useState } from 'react';
import { User, UserPlus, LogOut, User as UserBig } from 'lucide-react';
import { initialsOf, useAppStore } from '../../state/useAppStore';
import type { UserProfile } from '../../types/ui';
import styles from './Topbar.module.css';

/** The real photo when one loaded successfully, falling back to initials otherwise (no photo, or a broken URL). Exported for the My Profile dialog to reuse. */
export function AvatarContent({ profile }: { profile: UserProfile }) {
  const [imgFailed, setImgFailed] = useState(false);
  if (profile.avatarUrl && !imgFailed) {
    return (
      <img
        src={profile.avatarUrl}
        alt={profile.name}
        className={styles.avatarImg}
        referrerPolicy="no-referrer"
        onError={() => setImgFailed(true)}
      />
    );
  }
  return <>{initialsOf(profile.name)}</>;
}


function primaryRole(roles?: string[]): string {
  const normalized = (roles ?? [])
    .map((role) => role.trim().toLowerCase())
    .filter(Boolean);

  const priority = [
    'super_administrator',
    'owner',
    'administrator',
    'manager',
    'editor',
    'reviewer',
    'viewer',
    'member',
  ];

  const selected = priority.find((role) => normalized.includes(role)) ?? normalized[0] ?? 'member';

  return selected
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function UserMenu() {
  const signedIn = useAppStore((s) => s.signedIn);
  const userMenuOpen = useAppStore((s) => s.userMenuOpen);
  const userProfile = useAppStore((s) => s.userProfile);
  const toggleUserMenu = useAppStore((s) => s.toggleUserMenu);
  const closeUserMenu = useAppStore((s) => s.closeUserMenu);
  const signIn = useAppStore((s) => s.openAuth);
  const signOut = useAppStore((s) => s.signOut);
  const openProfile = useAppStore((s) => s.openProfile);

  const role = primaryRole(userProfile.roles);
  const accountClick = () => (signedIn ? toggleUserMenu() : signIn());

  return (
    <div className={styles.menuAnchorTight}>
      {userMenuOpen && (
        <>
          <div className={styles.menuScrim} onClick={closeUserMenu} />
          <div className={styles.userMenu} role="menu">
            <div className={styles.userMenuHeader}>
              <span className={styles.avatar}>
                <AvatarContent profile={userProfile} />
              </span>
              <div className={styles.avatarText}>
                <div className={styles.avatarName}>{userProfile.name}</div>
                <div className={styles.avatarEmail}>{userProfile.email}</div>
                <div className={styles.avatarCompany}>
                  {userProfile.companyName ?? 'No company assigned'}
                </div>
                <div className={styles.avatarRoleLine}>
                  <span className={styles.userRoleBadge}>{role}</span>
                </div>
              </div>
            </div>
            <div className={styles.userMenuHeaderDivider} />
            <button type="button" className={styles.menuItem} onClick={openProfile}>
              <span className={styles.menuItemIcon}>
                <User size={16} />
              </span>
              <span className={styles.menuItemTrailing}>My Profile</span>
            </button>
            <button type="button" className={styles.menuItem}>
              <span className={styles.menuItemIcon}>
                <UserPlus size={16} />
              </span>
              <span className={styles.menuItemTrailing}>Invite Members</span>
            </button>
            <div className={styles.menuDivider} />
            <button type="button" className={styles.menuDangerItem} onClick={signOut}>
              <span className={styles.menuItemIcon}>
                <LogOut size={15} />
              </span>
              <span className={styles.menuItemTrailing}>Sign Out</span>
            </button>
          </div>
        </>
      )}
      {signedIn ? (
        <button
          type="button"
          className={styles.avatarSm}
          title={`${userProfile.name} · Account`}
          onClick={accountClick}
        >
          <AvatarContent profile={userProfile} />
        </button>
      ) : (
        <button type="button" className={styles.signInBtn} title="Sign in" onClick={accountClick}>
          <UserBig size={18} />
        </button>
      )}
    </div>
  );
}
