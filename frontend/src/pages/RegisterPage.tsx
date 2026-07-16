import { AuthPageShell } from '../features/auth/AuthPageShell';
import { RegisterForm } from '../features/auth/RegisterForm';
export function RegisterPage() {
  return (
    <AuthPageShell
      title="Бүртгүүлэх"
      subtitle="Хувийн мэдээлэл, хүргэлтийн хаягаа аюулгүй удирдах бүртгэл үүсгэнэ үү."
    >
      <RegisterForm />
    </AuthPageShell>
  );
}
