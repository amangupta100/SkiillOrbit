import { Tabs } from '../tabs';

export default function LoginLayout({ children }) {
  return (
    <div className="container mx-auto px-4 py-8">
      <Tabs />
      {children}
    </div>
  );
}