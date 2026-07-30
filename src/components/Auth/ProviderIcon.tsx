import { useState } from 'react';
import { KeyRound } from 'lucide-react';

interface ProviderIconProps {
  id: string;
  className?: string;
}

const iconModules = import.meta.glob('../../assets/*.svg', {
  eager: true,
  import: 'default',
  query: '?url',
}) as Record<string, string>;

const iconUrls = Object.fromEntries(
  Object.entries(iconModules).map(([path, url]) => {
    const filename = path.split('/').pop() ?? '';
    return [filename.toLowerCase(), url];
  }),
);

export function ProviderIcon({ id, className }: ProviderIconProps) {
  const [failed, setFailed] = useState(false);
  const src = iconUrls[`${id.trim().toLowerCase()}.svg`];

  if (!src || failed) {
    return <KeyRound className={className} size={20} aria-hidden="true" />;
  }

  return (
    <img
      className={className}
      src={src}
      alt=""
      aria-hidden="true"
      width={20}
      height={20}
      onError={() => setFailed(true)}
    />
  );
}
