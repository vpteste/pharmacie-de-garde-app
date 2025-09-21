'use client';
import { useAuth, AuthProvider } from './AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!isLoading && !user && pathname !== '/pro/login') {
            router.push('/pro/login');
        }
    }, [user, isLoading, router, pathname]);

    // Render children if user is authenticated or on the login page itself
    if (user || pathname === '/pro/login') {
        return <>{children}</>;
    }

    // If loading, the AuthProvider already shows a spinner.
    // If not loading and no user, the useEffect will trigger a redirect.
    // So we can return null or a spinner here as a fallback.
    return null;
};

export default function ProLayout({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <ProtectedRoute>
                {children}
            </ProtectedRoute>
        </AuthProvider>
    );
}
