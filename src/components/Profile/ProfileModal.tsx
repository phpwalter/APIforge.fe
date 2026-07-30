import { lazy, Suspense, useEffect, useState } from 'react';
import { X, LoaderCircle, Check } from 'lucide-react';
import { useAppStore } from '../../state/useAppStore';
import { providerLabel } from '../Auth/providers';
import { ProviderIcon } from '../Auth/ProviderIcon';
import { AvatarContent } from '../Topbar/UserMenu';
import { updateMe } from '../../lib/api/auth';
import { getAuthToken } from '../../lib/api/authToken';
import { GITHUB_PLUGIN } from '../../lib/plugins/github';
import { GITLAB_PLUGIN } from '../../lib/plugins/gitlab';
import { BITBUCKET_PLUGIN } from '../../lib/plugins/bitbucket';
import { gravatarUrl } from '../../lib/gravatar';
import styles from './ProfileModal.module.css';

// Reuses each plugin's own lazy loader (see types.ts for why settingsPanel is a loader, not a
// direct component reference) so these stay in their own small chunks instead of being pulled
// into the main bundle — lazy() must be called once at module scope, not per render.
const GitHubSettingsPanel = lazy(GITHUB_PLUGIN.settingsPanel!);
const GitLabSettingsPanel = lazy(GITLAB_PLUGIN.settingsPanel!);
const BitbucketSettingsPanel = lazy(BITBUCKET_PLUGIN.settingsPanel!);

/** Providers with their own dedicated plugin row below (GitHub/GitLab/Bitbucket) — a primary
 * sign-in through one of these already shows a "Primary" badge on that row, so the generic
 * fallback row just above it only needs to cover everything else (e.g. Google). */
const HAS_OWN_LINKED_ROW = new Set(['github', 'gitlab', 'bitbucket']);

function formatDate(raw?: string): string | null {
  if (!raw) return null;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

export function ProfileModal() {
  const userProfile = useAppStore((s) => s.userProfile);
  const authProvider = useAppStore((s) => s.authProvider);
  const updateUserProfile = useAppStore((s) => s.updateUserProfile);
  const closeProfile = useAppStore((s) => s.closeProfile);

  const [name, setName] = useState(userProfile.name);
  const [bio, setBio] = useState(userProfile.bio ?? '');
  const [useGravatar, setUseGravatar] = useState(userProfile.useGravatar ?? false);
  const [gravatarEmail, setGravatarEmail] = useState(userProfile.gravatarEmail ?? '');
  const [avatarUrl, setAvatarUrl] = useState(userProfile.avatarUrl);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const memberSince = formatDate(userProfile.memberSince);
  const primaryProvider = authProvider && !HAS_OWN_LINKED_ROW.has(authProvider) ? authProvider : undefined;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeProfile();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [closeProfile]);

  const handleGravatarActivate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    setUseGravatar(isChecked);
    if (isChecked) {
      const email = userProfile.email;
      setGravatarEmail(email);
      setAvatarUrl(gravatarUrl(email));
    } else {
      setAvatarUrl(undefined);
    }
  };

  const handleGravatarEmailKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      updateUserProfile({ gravatarEmail: gravatarEmail });
      setAvatarUrl(gravatarUrl(gravatarEmail));
    }
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    const trimmedName = name.trim() || userProfile.name;
    const trimmedBio = bio.trim() || undefined;
    const trimmedGravatarEmail = gravatarEmail.trim() || undefined;

    // No real session (demo sign-in has no bearer token) — nothing to persist server-side, just
    // keep the edit local, same as everything else in demo mode.
    if (!getAuthToken()) {
      updateUserProfile({
        name: trimmedName,
        bio: trimmedBio,
        useGravatar,
        gravatarEmail: trimmedGravatarEmail,
        avatarUrl: useGravatar ? gravatarUrl(trimmedGravatarEmail || userProfile.email) : undefined,
      });
      setSaving(false);
      closeProfile();
      return;
    }

    try {
      const me = await updateMe({
        display_name: trimmedName,
        bio: trimmedBio,
        use_gravatar: useGravatar,
        gravatar_email: trimmedGravatarEmail,
      });
      updateUserProfile({
        name: me.display_name ?? trimmedName,
        bio: me.bio ?? trimmedBio,
        useGravatar: me.use_gravatar,
        gravatarEmail: me.gravatar_email,
        avatarUrl: me.avatar_url,
      });
      closeProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save to your account — try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.scrim} onClick={closeProfile}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className={styles.header}>
          <div className={styles.title}>My Profile</div>
          <button type="button" className={styles.closeBtn} title="Close" onClick={closeProfile}>
            <X size={15} />
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.identityRow}>
            <span className={styles.avatarLg}>
              <AvatarContent profile={{ ...userProfile, avatarUrl }} />
            </span>
            <div className={styles.identityText}>
              <div className={styles.email}>{userProfile.email}</div>
              {authProvider && (
                <div className={styles.metaLine}>Signed in with {providerLabel(authProvider)}</div>
              )}
              {memberSince && <div className={styles.metaLine}>Member since {memberSince}</div>}
            </div>
          </div>

          <div className={styles.field}>
            <div className={styles.fieldLabel}>Display Name</div>
            <input
              className={styles.textInput}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>

          <div className={styles.field}>
            <div className={styles.fieldLabel}>Bio</div>
            <textarea
              className={styles.textarea}
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="A little about you…"
            />
          </div>

          <div className={styles.separator} />

          <div className={styles.field}>
            <div className={styles.fieldLabel}>Use Gravatar</div>
            <div className={styles.gravatarRow}>
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={useGravatar}
                onChange={handleGravatarActivate}
              />
              <input
                className={styles.textInput}
                value={gravatarEmail}
                onChange={(e) => setGravatarEmail(e.target.value)}
                onKeyDown={handleGravatarEmailKeyDown}
                placeholder="Gravatar email address"
                disabled={!useGravatar}
              />
            </div>
          </div>

          {error && <div className={styles.errorMsg}>{error}</div>}

          <div className={styles.linkedSection}>
            <div className={styles.sectionLabel}>Linked Profiles</div>

            {primaryProvider && (
              <div className={styles.primaryRow}>
                <ProviderIcon id={primaryProvider} className={styles.primaryIcon} />
                <span className={styles.primaryLabel}>{providerLabel(primaryProvider)}</span>
                <span className={styles.primaryBadge}>
                  <Check size={11} />
                  Primary
                </span>
              </div>
            )}
            {!authProvider && (
              <div className={styles.demoNote}>
                You&apos;re using a demo sign-in — there&apos;s no primary account. Connecting a provider below still
                works and is saved to this browser.
              </div>
            )}

            <Suspense fallback={<div className={styles.linkedLoading}>Loading…</div>}>
              <div className={styles.linkedPanel}>
                <GitHubSettingsPanel />
              </div>
              <div className={styles.linkedPanel}>
                <GitLabSettingsPanel />
              </div>
              <div className={styles.linkedPanel}>
                <BitbucketSettingsPanel />
              </div>
            </Suspense>
          </div>
        </div>

        <div className={styles.footer}>
          <button type="button" className={styles.btnCancel} onClick={closeProfile} disabled={saving}>
            Cancel
          </button>
          <button type="button" className={styles.btnSave} onClick={save} disabled={saving}>
            {saving && <LoaderCircle size={13} className={styles.spin} />}
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
