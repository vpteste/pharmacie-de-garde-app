'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { 
    FaHome, 
    FaClock, 
    FaCalendarAlt, 
    FaPills,
    FaBriefcase, 
    FaUser
} from 'react-icons/fa';
import './Navbar.css';



// --- Language Switcher Component ---
const LanguageSwitcher = () => {
    const { i18n } = useTranslation();
    const currentLang = i18n.language.startsWith('fr') ? 'fr' : 'en';

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
    };

    return (
        <div className="language-switcher">
            <button 
                onClick={() => changeLanguage('fr')} 
                className={`language-bubble ${currentLang === 'fr' ? 'active' : ''}`}
                aria-label="Changer la langue en français"
            >
                FR
            </button>
            <button 
                onClick={() => changeLanguage('en')} 
                className={`language-bubble ${currentLang === 'en' ? 'active' : ''}`}
                aria-label="Switch language to English"
            >
                EN
            </button>
        </div>
    );
};

// --- Main Navbar Component ---
const Navbar = () => {
    const { t } = useTranslation();
    const pathname = usePathname();

    const navLinks = [
        { href: '/', labelKey: 'nav_home', icon: FaHome },
        { href: '/pharmacies', labelKey: 'nav_pharmacies', icon: FaClock },
        { href: '/rendez-vous', labelKey: 'nav_appointments', icon: FaCalendarAlt },
        { href: '/medicaments', labelKey: 'nav_medications', icon: FaPills },
        { href: '/pro/login', labelKey: 'nav_pro_area', icon: FaBriefcase },
        { href: '/connexion', labelKey: 'nav_user_area', icon: FaUser },
    ];

    return (
        <nav className="liquid-navbar">
            <div className="nav-links">
                {navLinks.map(({ href, labelKey, icon: Icon }) => {
                    const isActive = (href === '/' && pathname === href) || (href !== '/' && pathname.startsWith(href));
                    const uniqueClassName = labelKey.replace(/_/g, '-');

                    return (
                        <Link 
                            key={href} 
                            href={href} 
                            className={`nav-bubble ${uniqueClassName} ${isActive ? 'active' : ''}`}
                            title={t(labelKey)}
                        >
                            {isActive && (
                                <motion.div 
                                    className="floating-indicator"
                                    layoutId="floating-indicator"
                                    initial={false}
                                    transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                                />
                            )}
                            <div className="nav-icon-container">
                                <Icon className="nav-icon" />
                            </div>
                            <span className="nav-text">{t(labelKey)}</span>
                        </Link>
                    );
                })}
            </div>
            <LanguageSwitcher />
        </nav>
    );
};

export default Navbar;
