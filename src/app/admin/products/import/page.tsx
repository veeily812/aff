import { notFound } from "next/navigation";
import { getCurrentUser, canImportContent } from "@/lib/auth";
import ImportForm from "./import-form";

export default async function ImportProductsPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser || !canImportContent(currentUser.role)) {
    notFound();
  }

  return <ImportForm />;
}
