import md5 from 'crypto-js/md5';

/** Returns the Gravatar URL for a given email address. */
export function gravatarUrl(email: string): string {
  const hash = md5(email.trim().toLowerCase());
  return `https://www.gravatar.com/avatar/${hash}?d=mp`;
}
