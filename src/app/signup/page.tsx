import AuthLayout from "@/components/AuthLayout";
import { SignupForm } from "@/components/AuthForms";

export default function SignupPage() {
  return (
    <AuthLayout>
      <SignupForm />
    </AuthLayout>
  );
}