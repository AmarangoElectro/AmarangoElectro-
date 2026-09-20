import Image from "next/image";

interface Props {
  image?: string;
  alt: string;
  icon: string;
  slug: string;
  compact?: boolean;
  priority?: boolean;
}

export function CategoryVisual({ image, alt, icon, slug, compact = false, priority = false }: Props) {
  if (image) {
    return <Image src={image} alt={alt} fill priority={priority} sizes={compact ? "(max-width: 700px) 100vw, 33vw" : "(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw"} unoptimized />;
  }
  return (
    <span className={`category-placeholder-art category-placeholder-${slug}`} aria-hidden="true">
      <i>{icon}</i>
      <b>{alt}</b>
      <span />
    </span>
  );
}
