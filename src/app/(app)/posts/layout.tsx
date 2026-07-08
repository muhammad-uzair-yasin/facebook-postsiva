import { PostsNav } from "@/components/posts/PostsNav";

export default function PostsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen space-y-6 p-4 md:p-10">
      <PostsNav />
      {children}
    </div>
  );
}
