import { AccountShell } from '../features/account/AccountShell';
import { PasswordChangeForm } from '../features/account/PasswordChangeForm';
export function SecurityPage() {
  return (
    <AccountShell title="Нууцлал">
      <PasswordChangeForm />
    </AccountShell>
  );
}
