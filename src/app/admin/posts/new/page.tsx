import PostForm from "../post-form";

export default function NewPostPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">New Post</h1>
      <PostForm />
    </div>
  );
}
