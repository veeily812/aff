import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import SetupForm from "./setup-form";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  const existingUserCount = await prisma.user.count();

  if (existingUserCount > 0) {
    redirect("/admin/login");
  }

  return (
    <div className="-m-4 -my-8 flex min-h-screen items-center justify-center px-4 sm:-m-8">
      <SetupForm />
    </div>
  );
}
