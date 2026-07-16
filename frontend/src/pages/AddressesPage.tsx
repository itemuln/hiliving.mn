import { AccountShell } from '../features/account/AccountShell';
import { AddressList } from '../features/account/AddressList';
export function AddressesPage() {
  return (
    <AccountShell title="Хүргэлтийн хаяг">
      <AddressList />
    </AccountShell>
  );
}
