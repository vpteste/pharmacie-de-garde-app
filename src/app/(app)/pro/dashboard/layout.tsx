import ProSidebar from './ProSidebar';
import './DashboardLayout.css';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="pro-dashboard-layout">
            <ProSidebar />
            <main className="pro-main-content">
                {children}
            </main>
        </div>
    );
}
