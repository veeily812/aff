import type { Metadata } from "next";
import SignupForm from "./signup-form";

export const metadata: Metadata = {
  title: "Create your store",
  description: "Set up your own affiliate storefront in under a minute.",
};

export default function SignupPage() {
  return <SignupForm />;
}
