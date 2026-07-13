"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

interface PostFormValues {
  id?: string;
  title: string;
  slug: string;
  body: string;
  published: boolean;
  channelId?: string | null;
}

interface AdminProduct {
  id: string;
  name: string;
}

interface ChannelOption {
  id: string;
  name: string;
}

interface PostFormProps {
  initialValues?: PostFormValues;
  channels?: ChannelOption[];
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function PostForm({ initialValues, channels }: PostFormProps) {
  const router = useRouter();
  const isEdit = Boolean(initialValues?.id);

  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [slug, setSlug] = useState(initialValues?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [body, setBody] = useState(initialValues?.body ?? "");
  const [published, setPublished] = useState(initialValues?.published ?? false);
  const [channelId, setChannelId] = useState(initialValues?.channelId ?? "");
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetch("/api/admin/products")
      .then((response) => response.json())
      .then((result: { success: boolean; data?: AdminProduct[] }) => {
        if (result.success && result.data) {
          setProducts(result.data);
        }
      })
      .catch(() => undefined);
  }, []);

  function handleTitleChange(value: string) {
    setTitle(value);

    if (!slugTouched) {
      setSlug(slugify(value));
    }
  }

  function insertProductToken() {
    if (!selectedProductId) {
      return;
    }

    const token = `[[product:${selectedProductId}]]`;
    const textarea = bodyRef.current;

    if (!textarea) {
      setBody((current) => `${current}\n\n${token}\n\n`);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const next = `${body.slice(0, start)}\n\n${token}\n\n${body.slice(end)}`;
    setBody(next);

    requestAnimationFrame(() => {
      textarea.focus();
      const cursor = start + token.length + 4;
      textarea.setSelectionRange(cursor, cursor);
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const url = isEdit ? `/api/admin/posts/${initialValues?.id}` : "/api/admin/posts";
      const method = isEdit ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, slug, body, published, channelId }),
      });

      const result: { success: boolean; error?: string } = await response.json();

      if (!result.success) {
        setError(result.error ?? "Something went wrong");
        return;
      }

      router.push("/admin/posts");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card max-w-2xl space-y-4 rounded-2xl p-6">
      <div className="space-y-1">
        <label htmlFor="title" className="text-sm font-medium text-white/70">
          Title
        </label>
        <input
          id="title"
          required
          value={title}
          onChange={(event) => handleTitleChange(event.target.value)}
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 focus:border-purple-400/50 focus:outline-none focus:ring-2 focus:ring-purple-400/20"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="slug" className="text-sm font-medium text-white/70">
          Slug
        </label>
        <input
          id="slug"
          required
          value={slug}
          onChange={(event) => {
            setSlugTouched(true);
            setSlug(event.target.value);
          }}
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 focus:border-purple-400/50 focus:outline-none focus:ring-2 focus:ring-purple-400/20"
        />
      </div>

      <div className="space-y-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label htmlFor="body" className="text-sm font-medium text-white/70">
            Body (Markdown)
          </label>
          <div className="flex min-w-0 items-center gap-2">
            <select
              value={selectedProductId}
              onChange={(event) => setSelectedProductId(event.target.value)}
              className="w-40 shrink rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-white focus:border-purple-400/50 focus:outline-none"
            >
              <option value="" className="bg-slate-900">
                Select product...
              </option>
              {products.map((product) => (
                <option key={product.id} value={product.id} className="bg-slate-900">
                  {product.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={insertProductToken}
              disabled={!selectedProductId}
              className="shrink-0 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/80 transition-colors hover:text-white disabled:opacity-50"
            >
              Insert Product
            </button>
          </div>
        </div>
        <textarea
          id="body"
          ref={bodyRef}
          required
          rows={16}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-mono text-sm text-white placeholder-white/30 focus:border-purple-400/50 focus:outline-none focus:ring-2 focus:ring-purple-400/20"
        />
        <p className="text-xs text-white/40">
          Use the picker above to insert a product card anywhere in the text.
        </p>
      </div>

      {channels ? (
        <div className="space-y-1">
          <label htmlFor="channelId" className="text-sm font-medium text-white/70">
            Channel (optional)
          </label>
          <select
            id="channelId"
            value={channelId}
            onChange={(event) => setChannelId(event.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-purple-400/50 focus:outline-none focus:ring-2 focus:ring-purple-400/20"
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

      <div className="flex items-center gap-2">
        <input
          id="published"
          type="checkbox"
          checked={published}
          onChange={(event) => setPublished(event.target.checked)}
          className="h-4 w-4 rounded border-white/20 bg-white/5"
        />
        <label htmlFor="published" className="text-sm text-white/70">
          Published
        </label>
      </div>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="gradient-button rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {isSubmitting ? "Saving..." : isEdit ? "Save Changes" : "Create Post"}
      </button>
    </form>
  );
}
