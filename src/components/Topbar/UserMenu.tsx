import { User, UserPlus, Keyboard, HelpCircle, ExternalLink, Sparkles, LogOut, User as UserBig } from 'lucide-react';
import { initialsOf, useAppStore } from '../../state/useAppStore';
import styles from './Topbar.module.css';

export function UserMenu() {
  const signedIn = useAppStore((s) => s.signedIn);
  const userMenuOpen = useAppStore((s) => s.userMenuOpen);
  const userProfile = useAppStore((s) => s.userProfile);
  const toggleUserMenu = useAppStore((s) => s.toggleUserMenu);
  const closeUserMenu = useAppStore((s) => s.closeUserMenu);
  const signIn = useAppStore((s) => s.openAuth);
  const signOut = useAppStore((s) => s.signOut);

  const initials = initialsOf(userProfile.name);
  const accountClick = () => (signedIn ? toggleUserMenu() : signIn());

  return (
    <div className={styles.menuAnchorTight}>
      {userMenuOpen && (
        <>
          <div className={styles.menuScrim} onClick={closeUserMenu} />
          <div className={styles.userMenu} role="menu">
            <div className={styles.userMenuHeader}>
              <span className={styles.avatar}>{initials}</span>
              <div className={styles.avatarText}>
                <div className={styles.avatarName}>{userProfile.name}</div>
                <div className={styles.avatarEmail}>{userProfile.email}</div>
              </div>
            </div>
            <div className={styles.userMenuHeaderDivider} />
            <button type="button" className={styles.menuItem}>
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
            <button type="button" className={styles.menuItem}>
              <span className={styles.menuItemIcon}>
                <Keyboard size={16} />
              </span>
              <span className={styles.menuItemTrailing}>Keyboard Shortcuts</span>
            </button>
            <div className={styles.menuDivider} />
            <button type="button" className={styles.menuItem}>
              <span className={styles.menuItemIcon}>
                <HelpCircle size={16} />
              </span>
              <span className={styles.menuItemTrailing}>Help &amp; Documentation</span>
              <span className={styles.menuItemExternal}>
                <ExternalLink size={13} />
              </span>
            </button>
            <button type="button" className={styles.menuItem}>
              <span className={styles.menuItemIcon}>
                <Sparkles size={16} />
              </span>
              <span className={styles.menuItemTrailing}>What&apos;s New</span>
              <span className={styles.menuItemExternal}>
                <ExternalLink size={13} />
              </span>
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
          {initials}
        </button>
      ) : (
        <button type="button" className={styles.signInBtn} title="Sign in" onClick={accountClick}>
          <UserBig size={18} />
        </button>
      )}
    </div>
  );
}
