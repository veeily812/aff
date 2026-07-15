import Image from "next/image";

interface ProductCardProps {
  name: string;
  description: string;
  price?: string | null;
  imageUrl: string;
  affiliateUrl: string;
}

export default function ProductCard({
  name,
  description,
  price,
  imageUrl,
  affiliateUrl,
}: ProductCardProps) {
  return (
    <div className="not-prose glass-card glass-card-hover my-6 flex flex-col gap-4 rounded-2xl p-4 sm:flex-row">
      <div className="relative h-48 w-full shrink-0 overflow-hidden rounded-xl bg-white sm:h-32 sm:w-32">
        <Image src={imageUrl} alt={name} fill className="object-cover" sizes="(max-width: 640px) 100vw, 128px" />
      </div>
      <div className="flex flex-1 flex-col justify-between gap-3">
        <div>
          <h3 className="font-semibold text-black">{name}</h3>
          <p className="mt-1 text-sm text-black/60">{description}</p>
          {price ? <p className="gradient-text mt-1 text-sm font-bold">{price}</p> : null}
        </div>
        <a
          href={affiliateUrl}
          target="_blank"
          rel="nofollow sponsored noopener noreferrer"
          className="gradient-button inline-block w-fit rounded-lg px-4 py-2 text-sm font-semibold text-black"
        >
          Buy Now
        </a>
      </div>
    </div>
  );
}
