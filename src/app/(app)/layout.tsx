'use client';
import Navbar from '../components/Navbar/Navbar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <Navbar />
      {children}
    </div>
  );
}
