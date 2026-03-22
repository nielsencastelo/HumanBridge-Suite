import Link from "next/link";

type Props = {
  kicker: string;
  title: string;
  description: string;
  ctaLabel: string;
  href: string;
};

export function HeroCard({ kicker, title, description, ctaLabel, href }: Props) {
  return (
    <article className="card">
      <div className="kicker">{kicker}</div>
      <h2>{title}</h2>
      <p className="muted">{description}</p>
      <Link href={href} className="button" style={{ display: "inline-flex", marginTop: 12 }}>
        {ctaLabel}
      </Link>
    </article>
  );
}
