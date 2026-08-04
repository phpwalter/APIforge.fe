import { useEffect, useMemo, useState } from 'react';
import { Building2, Check, LoaderCircle, UserPlus, X } from 'lucide-react';
import { useAppStore } from '../../state/useAppStore';
import { updateMe } from '../../lib/api/auth';
import { getAuthToken } from '../../lib/api/authToken';
import { assignCompanyMember, createCompany } from '../../lib/api/companies';
import { AvatarContent } from '../Topbar/UserMenu';
import styles from './ProfileModal.module.css';

type Tab = 'personal' | 'account' | 'organization' | 'preferences';

function normalizeRoles(roles?: string[]): string[] {
  return (roles ?? []).map((role) => role.trim().toLowerCase()).filter(Boolean);
}

export function ProfileModal() {
  const userProfile = useAppStore((s) => s.userProfile);
  const updateUserProfile = useAppStore((s) => s.updateUserProfile);
  const closeProfile = useAppStore((s) => s.closeProfile);
  const [tab, setTab] = useState<Tab>(userProfile.companyId ? 'personal' : 'organization');
  const [name, setName] = useState(userProfile.name);
  const [bio, setBio] = useState(userProfile.bio ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [companySlug, setCompanySlug] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [companyCountry, setCompanyCountry] = useState('');
  const [companyTimezone, setCompanyTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState('member');

  const roles = useMemo(() => normalizeRoles(userProfile.roles), [userProfile.roles]);
  const canAdministerCompany = roles.some((role) => ['owner', 'administrator', 'admin', 'super_administrator'].includes(role));

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') closeProfile(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [closeProfile]);

  const savePersonal = async () => {
    setSaving(true); setError(null); setNotice(null);
    try {
      const trimmedName = name.trim() || userProfile.name;
      const trimmedBio = bio.trim() || undefined;
      if (!getAuthToken()) {
        updateUserProfile({ name: trimmedName, bio: trimmedBio });
      } else {
        if (!userProfile.recordVersion) throw new Error('Your profile version is unavailable. Sign in again.');
        const me = await updateMe({ record_version: userProfile.recordVersion, display_name: trimmedName, bio: trimmedBio });
        updateUserProfile({ name: me.display_name ?? trimmedName, bio: me.bio ?? trimmedBio, recordVersion: me.record_version });
      }
      setNotice('Profile saved.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Profile could not be saved.');
    } finally { setSaving(false); }
  };

  const createOrganization = async () => {
    setSaving(true); setError(null); setNotice(null);
    try {
      const company = await createCompany({
        name: companyName.trim(), slug: companySlug.trim() || undefined,
        website_url: companyWebsite.trim() || undefined,
        country: companyCountry.trim() || undefined, timezone: companyTimezone.trim() || undefined,
        contact_email: userProfile.email,
      });
      updateUserProfile({ companyId: company.id, companyName: company.name, companySlug: company.slug, roles: Array.from(new Set([...(userProfile.roles ?? []), 'owner'])) });
      setNotice(`${company.name} was created and assigned to your account.`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Company could not be created.');
    } finally { setSaving(false); }
  };

  const assignMember = async () => {
    if (!userProfile.companyId) return;
    setSaving(true); setError(null); setNotice(null);
    try {
      await assignCompanyMember(userProfile.companyId, memberEmail.trim(), memberRole);
      setMemberEmail('');
      setNotice('The user was assigned to the company.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'The user could not be assigned.');
    } finally { setSaving(false); }
  };

  return (
    <div className={styles.scrim} onClick={closeProfile}>
      <section className={styles.dialog} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="My Profile">
        <header className={styles.header}>
          <div><div className={styles.title}>My Profile</div><div className={styles.subtitle}>Manage your identity, account, organization, and preferences.</div></div>
          <button type="button" className={styles.iconButton} onClick={closeProfile} aria-label="Close"><X size={18} /></button>
        </header>

        <div className={styles.shell}>
          <aside className={styles.sidebar}>
            <div className={styles.identityCard}>
              <span className={styles.avatar}><AvatarContent profile={userProfile} /></span>
              <strong>{userProfile.name}</strong><span>{userProfile.email}</span>
            </div>
            {(['personal','account','organization','preferences'] as Tab[]).map((item) => (
              <button key={item} type="button" className={tab === item ? styles.navActive : styles.navButton} onClick={() => setTab(item)}>
                {item[0].toUpperCase() + item.slice(1)}
              </button>
            ))}
          </aside>

          <main className={styles.content}>
            {tab === 'personal' && <>
              <h2>Personal information</h2><p className={styles.lead}>Information shown across APIForge.</p>
              <label className={styles.field}><span>Display name</span><input value={name} onChange={(e) => setName(e.target.value)} /></label>
              <label className={styles.field}><span>Bio</span><textarea rows={5} value={bio} onChange={(e) => setBio(e.target.value)} /></label>
              <button type="button" className={styles.primaryButton} disabled={saving} onClick={savePersonal}>{saving && <LoaderCircle size={14} className={styles.spin} />}Save profile</button>
            </>}

            {tab === 'account' && <>
              <h2>Account</h2><p className={styles.lead}>Authentication and account status.</p>
              <div className={styles.detailGrid}><span>Email</span><strong>{userProfile.email}</strong><span>Status</span><strong><Check size={14} /> Active</strong><span>Roles</span><strong>{roles.join(', ') || 'member'}</strong></div>
            </>}

            {tab === 'organization' && <>
              <h2>Organization</h2><p className={styles.lead}>Create a company or manage its membership.</p>
              {!userProfile.companyId ? <div className={styles.emptyState}>
                <Building2 size={32} /><h3>No company assigned</h3><p>Create a company to unlock company-level Methods and Headers settings.</p>
                <div className={styles.formGrid}>
                  <label className={styles.field}><span>Company name</span><input value={companyName} onChange={(e) => setCompanyName(e.target.value)} /></label>
                  <label className={styles.field}><span>Slug (optional)</span><input value={companySlug} onChange={(e) => setCompanySlug(e.target.value)} placeholder="generated-from-name" /></label>
                  <label className={styles.field}><span>Website (optional)</span><input value={companyWebsite} onChange={(e) => setCompanyWebsite(e.target.value)} /></label>
                  <label className={styles.field}><span>Country (optional)</span><input value={companyCountry} onChange={(e) => setCompanyCountry(e.target.value)} /></label>
                  <label className={styles.field}><span>Time zone</span><input value={companyTimezone} onChange={(e) => setCompanyTimezone(e.target.value)} /></label>
                </div>
                <button type="button" className={styles.primaryButton} disabled={saving || !companyName.trim()} onClick={createOrganization}>{saving && <LoaderCircle size={14} className={styles.spin} />}Create company</button>
              </div> : <>
                <div className={styles.companyCard}><Building2 size={22} /><div><span>Current company</span><strong>{userProfile.companyName ?? 'Company name unavailable'}</strong></div></div>
                {canAdministerCompany && <div className={styles.memberPanel}><h3><UserPlus size={18} /> Assign user</h3><p>The user must already have signed in to APIForge.</p><div className={styles.inlineForm}><input type="email" placeholder="user@example.com" value={memberEmail} onChange={(e) => setMemberEmail(e.target.value)} /><select value={memberRole} onChange={(e) => setMemberRole(e.target.value)}><option value="administrator">Administrator</option><option value="manager">Manager</option><option value="member">Member</option><option value="viewer">Viewer</option></select><button type="button" className={styles.primaryButton} disabled={saving || !memberEmail.trim()} onClick={assignMember}>Assign</button></div></div>}
              </>}
            </>}

            {tab === 'preferences' && <><h2>Preferences</h2><p className={styles.lead}>Personal display and notification preferences will be managed here.</p><div className={styles.placeholder}>Preference controls remain unchanged and can be migrated into this section incrementally.</div></>}

            {error && <div className={styles.error}>{error}</div>}
            {notice && <div className={styles.success}>{notice}</div>}
          </main>
        </div>
      </section>
    </div>
  );
}
