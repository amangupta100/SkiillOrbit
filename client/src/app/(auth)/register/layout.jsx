import { Tabs } from '../tabs';

export default function RegisterLayout({ children }) {
  return (
    <div className="container mx-auto px-4 py-8">
      <Tabs />
      {children}
    </div>
  );
}