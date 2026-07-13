"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface ChannelOption {
  id: string;
  name: string;
}

interface ProductFormValues {
  id?: string;
  name: string;
  description: string;
  price: string;
  category?: string;
  channelId?: string | null;
  affiliateUrl: string;
  imageUrl?: string;
}

interface ProductFormProps {
  initialValues?: ProductFormValues;
  channels?: ChannelOption[];
}

const inputClass =
  "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 focus:border-purple-400/50 focus:outline-none focus:ring-2 focus:ring-purple-400/20";
const labelClass = "text-sm font-medium text-white/70";

export default function ProductForm({ initialValues, channels }: ProductFormProps) {
  const router = useRouter();
  const isEdit = Boolean(initialValues?.id);

  const [name, setName] = useState(initialValues?.name ?? "");
  const [description, setDescription] = useState(initialValues?.description ?? "");
  const [price, setPrice] = useState(initialValues?.price ?? "");
  const [category, setCategory] = useState(initialValues?.category ?? "");
  const [channelId, setChannelId] = useState(initialValues?.channelId ?? "");
  const [affiliateUrl, setAffiliateUrl] = useState(initialValues?.affiliateUrl ?? "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!isEdit && !imageFile) {
      setError("Please choose a product image");
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData();
    formData.set("name", name);
    formData.set("description", description);
    formData.set("price", price);
    formData.set("category", category);
    formData.set("channelId", channelId);
    formData.set("affiliateUrl", affiliateUrl);

    if (imageFile) {
      formData.set("image", imageFile);
    }

    try {
      const url = isEdit ? `/api/admin/products/${initialValues?.id}` : "/api/admin/products";
      const method = isEdit ? "PATCH" : "POST";

      const response = await fetch(url, { method, body: formData });
      const result: { success: boolean; error?: string } = await response.json();

      if (!result.success) {
        setError(result.error ?? "Something went wrong");
        return;
      }

      router.push("/admin/products");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card max-w-lg space-y-4 rounded-2xl p-6">
      <div className="space-y-1">
        <label htmlFor="name" className={labelClass}>
          Name
        </label>
        <input
          id="name"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          className={inputClass}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="description" className={labelClass}>
          Description
        </label>
        <textarea
          id="description"
          required
          rows={4}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className={inputClass}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="price" className={labelClass}>
          Price (optional)
        </label>
        <input
          id="price"
          value={price}
          onChange={(event) => setPrice(event.target.value)}
          placeholder="$19.99"
          className={inputClass}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="category" className={labelClass}>
          Category (optional)
        </label>
        <input
          id="category"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          placeholder="Clothing, Electronics, Home..."
          className={inputClass}
        />
      </div>

      {channels ? (
        <div className="space-y-1">
          <label htmlFor="channelId" className={labelClass}>
            Channel (optional)
          </label>
          <select
            id="channelId"
            value={channelId}
            onChange={(event) => setChannelId(event.target.value)}
            className={inputClass}
          >
            <option value="" className="bg-slate-900">
              No channel
            </option>
            {channels.map((channel) => (
              <option key={channel.id} value={channel.id} className="bg-slate-900">
                {channel.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div className="space-y-1">
        <label htmlFor="affiliateUrl" className={labelClass}>
          Affiliate URL
        </label>
        <input
          id="affiliateUrl"
          type="url"
          required
          value={affiliateUrl}
          onChange={(event) => setAffiliateUrl(event.target.value)}
          placeholder="https://example.com/product?tag=affiliate-id"
          className={inputClass}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="image" className={labelClass}>
          Product Image {isEdit ? "(leave blank to keep current)" : ""}
        </label>
        {initialValues?.imageUrl ? (
          <div className="relative mb-2 h-24 w-24 overflow-hidden rounded-lg bg-white/5">
            <Image src={initialValues.imageUrl} alt={name} fill className="object-cover" sizes="96px" />
          </div>
        ) : null}
        <input
          id="image"
          type="file"
          accept="image/*"
          onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
          className="w-full text-sm text-white/70"
        />
      </div>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="gradient-button rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {isSubmitting ? "Saving..." : isEdit ? "Save Changes" : "Create Product"}
      </button>
    </form>
  );
}
