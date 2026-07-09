import PostForm from "../post-form";

export default function NewPostPage() {
  return (
    <div className="space-y-6">
      <h1 className="gradient-text text-2xl font-bold">New Post</h1>
      <PostForm />
    </div>
  );
}
