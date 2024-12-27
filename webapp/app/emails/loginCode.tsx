type LoginCodeProps = { code: string; magicLink: string };

export function LoginCode({ code, magicLink }: LoginCodeProps) {
  return (
    <div>
      <div>Code: {code}</div>
      <div>
        ...or <a href={magicLink}>click here to verify</a>.
      </div>
    </div>
  );
}
