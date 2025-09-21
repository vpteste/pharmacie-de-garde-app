'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import './Navbar.css';

// Icônes SVG directement intégrées pour la simplicité et la performance
const PharmacyIcon = ({ isActive }: { isActive: boolean }) => (
    <svg className="nav-icon" fill="none" stroke={isActive ? '#3fc17a' : '#8e8e93'} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m8.4-8.6l-.7.7M4.3 4.3l-.7.7m15.4 0l-.7-.7M4.3 19.7l-.7-.7"></path></svg>
);

const AppointmentIcon = ({ isActive }: { isActive: boolean }) => (
    <svg className="nav-icon" fill="none" stroke={isActive ? '#3fc17a' : '#8e8e93'} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
);

const MedicationIcon = ({ isActive }: { isActive: boolean }) => (
    <svg className="nav-icon" fill="none" stroke={isActive ? '#3fc17a' : '#8e8e93'} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v4.586a1 1 0 01-.293.707l-3.414 3.414a1 1 0 01-.707.293H9.414a1 1 0 01-.707-.293L5.293 9.293A1 1 0 015 8.586V5l-1-1z"></path></svg>
);

const HomeIcon = ({ isActive }: { isActive: boolean }) => (
    <svg className="nav-icon" fill="none" stroke={isActive ? '#3fc17a' : '#8e8e93'} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
);

const ProAreaIcon = ({ isActive }: { isActive: boolean }) => (
    <svg className="nav-icon" fill="none" stroke={isActive ? '#3fc17a' : '#8e8e93'} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
);

const Navbar = () => {
    const pathname = usePathname();

    const navLinks = [
        { href: '/', label: 'Accueil', icon: HomeIcon },
        { href: '/pharmacies', label: 'Pharmacies', icon: PharmacyIcon },
        { href: '/rendez-vous', label: 'Rendez-vous', icon: AppointmentIcon },
        { href: '/medicaments', label: 'Médicaments', icon: MedicationIcon },
        { href: '/inscrire-etablissement', label: 'Espace Pro', icon: ProAreaIcon },
    ];

    return (
        <nav className="navbar-container">
            {navLinks.map(({ href, label, icon: Icon }) => {
                const isActive = pathname.startsWith(href);
                return (
                    <Link key={href} href={href} className={`nav-item ${isActive ? 'active' : ''}`}>
                        <Icon isActive={isActive} />
                        {label}
                    </Link>
                );
            })}
        </nav>
    );
};

export default Navbar;
