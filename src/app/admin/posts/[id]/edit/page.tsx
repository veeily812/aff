import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PostForm from "../../post-form";

interface EditPostPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPostPage({ params }: EditPostPageProps) {
  const { id } = await params;
  const post = await prisma.post.findUnique({ where: { id } });

  if (!post) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Edit Post</h1>
      <PostForm
        initialValues={{
          id: post.id,
          title: post.title,
          slug: post.slug,
          body: post.body,
          published: post.published,
        }}
      />
    </div>
  );
}
