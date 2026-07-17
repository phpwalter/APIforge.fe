/**
 * Google/Apple/Atlassian/Confluence still use placeholder monogram badges —
 * NOT the official logos. GitHub/GitLab/Bitbucket use the real brand marks
 * from src/assets/. Every icon here keeps the same (size) props signature so
 * nothing else in the app needs to change if more get swapped in later.
 */
import type { ReactElement, SVGProps } from 'react';
import githubLogo from '../../assets/github.svg';
import gitlabLogo from '../../assets/GitLab.svg';
import bitbucketLogo from '../../assets/bitbucket.svg';

export type IconProps = SVGProps<SVGSVGElement> & { size?: number };
export type IconComponent = (props: IconProps) => ReactElement;

function MonogramBadge({
  size = 20,
  bg,
  text,
  labelSize = 8.5,
  ...rest
}: IconProps & { bg: string; text: string; labelSize?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...rest}>
      <rect width="24" height="24" rx="6" fill={bg} />
      <text
        x="12"
        y="16"
        fontFamily="Hanken Grotesk, system-ui, sans-serif"
        fontSize={labelSize}
        fontWeight={700}
        fill="#fff"
        textAnchor="middle"
      >
        {text}
      </text>
    </svg>
  );
}

export function GoogleIcon(props: IconProps) {
  return <MonogramBadge {...props} bg="#4a82d8" text="Go" />;
}

export function AtlassianIcon(props: IconProps) {
  return <MonogramBadge {...props} bg="#0052CC" text="At" />;
}

export function ConfluenceIcon(props: IconProps) {
  return <MonogramBadge {...props} bg="#1868DB" text="Co" />;
}

function BrandLogo({ src, alt, size = 20, className }: { src: string; alt: string } & IconProps) {
  return <img src={src} alt={alt} width={size} height={size} className={className} aria-hidden={alt ? undefined : true} />;
}

export function GitHubIcon({ size, className }: IconProps) {
  return <BrandLogo src={githubLogo} alt="" size={size} className={className} />;
}

export function BitbucketIcon({ size, className }: IconProps) {
  return <BrandLogo src={bitbucketLogo} alt="" size={size} className={className} />;
}

export function GitLabIcon({ size, className }: IconProps) {
  return <BrandLogo src={gitlabLogo} alt="" size={size} className={className} />;
}

export function AppleIcon({ size = 20, ...rest }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...rest}>
      <rect width="24" height="24" rx="6" fill="#1a1a1a" />
      <path
        d="M14.2 6.6c.5-.6 1.3-1.1 2-1.1.1.8-.2 1.6-.7 2.2-.5.6-1.2 1.1-2 1-.1-.8.3-1.6.7-2.1zM16.5 9.9c-1.1 0-2 .6-2.5.6-.5 0-1.3-.6-2.2-.6-1.1 0-2.2.7-2.7 1.7-1.2 2-.3 5 .8 6.7.5.8 1.1 1.7 2 1.7.8 0 1.1-.5 2-.5.9 0 1.2.5 2 .5.9 0 1.4-.8 2-1.6.6-.9.8-1.7.9-1.8-.1 0-1.8-.7-1.8-2.7 0-1.7 1.4-2.5 1.4-2.6-.6-1-1.6-1.4-2-1.4z"
        fill="#fff"
      />
    </svg>
  );
}
