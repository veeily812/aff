const PRODUCT_TOKEN_REGEX = /\[\[product:([a-zA-Z0-9_-]+)\]\]/g;

export type PostContentBlock =
  | { type: "markdown"; content: string }
  | { type: "product"; productId: string };

export function parsePostBody(body: string): PostContentBlock[] {
  const blocks: PostContentBlock[] = [];
  let lastIndex = 0;

  for (const match of body.matchAll(PRODUCT_TOKEN_REGEX)) {
    const matchIndex = match.index ?? 0;

    if (matchIndex > lastIndex) {
      blocks.push({ type: "markdown", content: body.slice(lastIndex, matchIndex) });
    }

    blocks.push({ type: "product", productId: match[1] });
    lastIndex = matchIndex + match[0].length;
  }

  if (lastIndex < body.length) {
    blocks.push({ type: "markdown", content: body.slice(lastIndex) });
  }

  return blocks;
}

export function extractProductIds(body: string): string[] {
  return [...body.matchAll(PRODUCT_TOKEN_REGEX)].map((match) => match[1]);
}
