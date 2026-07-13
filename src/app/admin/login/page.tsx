import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import LoginForm from "./login-form";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  const existingUserCount = await prisma.user.count();

  if (existingUserCount === 0) {
    redirect("/admin/setup");
  }

  return <LoginForm />;
}
