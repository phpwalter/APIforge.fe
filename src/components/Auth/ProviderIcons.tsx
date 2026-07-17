/**
 * Placeholder provider "icons" — simple monogram badges in brand-adjacent
 * colors, NOT the official Google/GitHub/Apple/Atlassian/Confluence/
 * Bitbucket logos. Rendered as inline SVG (not <img src="...">) so they
 * always show up regardless of how/where this app is hosted or previewed.
 *
 * Swap the JSX in each component for the real licensed brand mark
 * whenever you're ready to use it — the props signature (size) can stay
 * the same so nothing else in the app needs to change.
 */
import type { ReactElement, SVGProps } from 'react';

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

export function GitHubIcon(props: IconProps) {
  return <MonogramBadge {...props} bg="#24292f" text="Gh" />;
}

export function ConfluenceIcon(props: IconProps) {
  return <MonogramBadge {...props} bg="#1868DB" text="Co" />;
}

export function BitbucketIcon(props: IconProps) {
  return <MonogramBadge {...props} bg="#0747A6" text="Bb" labelSize={7.5} />;
}

export function GitLabIcon(props: IconProps) {
  return <MonogramBadge {...props} bg="#FC6D26" text="Gl" />;
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
