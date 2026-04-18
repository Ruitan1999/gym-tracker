interface LogoProps {
  className?: string;
  withWordmark?: boolean;
}

export default function Logo({ className, withWordmark }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-0.5 ${className ?? ''}`}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 381 309"
        fill="none"
        className="h-5 w-auto"
        aria-hidden="true"
      >
        <path d="M188.531 0C189.479 1.0187 193.084 7.06261 194.028 8.60675L204.744 26.1098L245.232 91.474L334.411 234.83L364.297 282.469C369.49 290.756 375.214 299.54 380.121 307.954L327.447 307.978C322.719 300.026 317.241 291.707 312.278 283.81L282.032 235.782L189.872 88.8083L189.145 87.7218L188.752 87.6814C187.129 89.7914 184.708 94.0614 183.236 96.492L174.639 110.517L146.902 155.746L53.7634 307.999C35.892 307.91 17.8291 308.172 0 307.897C7.57963 294.465 17.4216 279.281 25.5642 266.002L73.2465 188.135L148.711 64.9346C161.863 43.4653 175.143 21.2705 188.531 0Z" fill="#E34D28"/>
        <path d="M189.053 109.724C190.348 110.958 197.236 122.283 198.677 124.589L221.133 160.482L283.813 260.334C293.578 275.916 304.248 292.19 313.603 307.885C296.792 308.258 278.294 307.997 261.403 307.913L190.885 196.156L190.13 195.252C188.989 195.624 182.932 206.307 181.728 208.296L162.866 239.555C149.246 261.907 134.321 285.361 121.313 307.944C103.678 307.869 85.5735 308.215 67.9908 307.842L189.053 109.724Z" fill="#3C4345"/>
        <path d="M190.272 217.325C192.503 219.359 201.509 234.8 203.742 238.33L247.662 307.969L193.775 307.908L135.757 307.873C140.057 299.486 148.307 286.827 153.427 278.33L190.272 217.325Z" fill="#AFAFAD"/>
      </svg>
      {withWordmark && (
        <span
          className="inline-flex items-baseline"
          style={{ fontWeight: 800, letterSpacing: '-0.045em', fontSize: '1.5rem', lineHeight: 1 }}
        >
          <span style={{ color: 'var(--color-text)' }}>lift</span>
          <span style={{ color: 'var(--color-text)' }}>gauge</span>
          <span
            aria-hidden
            style={{
              display: 'inline-block',
              width: '0.35em',
              height: '0.35em',
              borderRadius: '999px',
              background: 'var(--color-volt)',
              marginLeft: '0.2em',
              transform: 'translateY(-0.1em)',
            }}
          />
        </span>
      )}
    </span>
  );
}
