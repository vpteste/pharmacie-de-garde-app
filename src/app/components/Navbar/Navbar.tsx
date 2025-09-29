'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { 
    FaHome, 
    FaClock, 
    FaCalendarAlt, 
    FaPills,
    FaBriefcase, 
    FaUser,
    FaEllipsisV
} from 'react-icons/fa';
import './Navbar.css';

// --- Language Switcher Component ---
const LanguageSwitcher = ({ onLanguageChange }: { onLanguageChange?: () => void }) => {
    const { i18n } = useTranslation();
    const currentLang = i18n.language.startsWith('fr') ? 'fr' : 'en';

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
        if (onLanguageChange) {
            onLanguageChange();
        }
    };

    return (
        <div className="language-switcher">
            <p className="more-menu-title">Langue</p>
            <div className="language-options">
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
        </div>
    );
};

// --- Main Navbar Component ---
const Navbar = () => {
    const { t } = useTranslation();
    const pathname = usePathname();
    const [isMenuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const navLinks = [
        { href: '/', labelKey: 'nav_home', icon: FaHome },
        { href: '/pharmacies', labelKey: 'nav_pharmacies', icon: FaClock },
        { href: '/rendez-vous', labelKey: 'nav_appointments', icon: FaCalendarAlt },
        { href: '/medicaments', labelKey: 'nav_medications', icon: FaPills },
    ];

    const secondaryLinks = [
        { href: '/pro/login', labelKey: 'nav_pro_area', icon: FaBriefcase },
        { href: '/connexion', labelKey: 'nav_user_area', icon: FaUser },
    ];

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    // Close menu on route change
    useEffect(() => {
        setMenuOpen(false);
    }, [pathname]);

    return (
        <nav className="liquid-navbar" ref={menuRef}>
            {/* --- Desktop Navigation --- */}
            <div className="desktop-nav">
                <div className="navbar-main-content">
                    <div className="nav-links">
                        {navLinks.map(({ href, labelKey, icon: Icon }) => {
                            const isActive = (href === '/' && pathname === href) || (href !== '/' && pathname.startsWith(href));
                            const uniqueClassName = labelKey.replace(/_/g, '-');
                            return (
                                <Link key={href} href={href} className={`nav-bubble ${uniqueClassName} ${isActive ? 'active' : ''}`} title={t(labelKey)}>
                                    {isActive && <motion.div className="floating-indicator" layoutId="floating-indicator" initial={false} transition={{ type: 'spring', stiffness: 500, damping: 40 }} />}
                                    <div className="nav-icon-container"><Icon className="nav-icon" /></div>
                                    <span className="nav-text">{t(labelKey)}</span>
                                </Link>
                            );
                        })}
                    </div>
                    <div className="nav-links-secondary">
                        <div className="desktop-secondary-links">
                            {secondaryLinks.map(({ href, labelKey, icon: Icon }) => {
                                const isActive = (href === '/' && pathname === href) || (href !== '/' && pathname.startsWith(href));
                                const uniqueClassName = labelKey.replace(/_/g, '-');
                                return (
                                    <Link key={href} href={href} className={`nav-bubble ${uniqueClassName} ${isActive ? 'active' : ''}`} title={t(labelKey)}>
                                        {isActive && <motion.div className="floating-indicator" layoutId={`floating-indicator-${labelKey}`} initial={false} transition={{ type: 'spring', stiffness: 500, damping: 40 }} />}
                                        <div className="nav-icon-container"><Icon className="nav-icon" /></div>
                                        <span className="nav-text">{t(labelKey)}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </div>
                <div className="desktop-language-switcher">
                    <LanguageSwitcher />
                </div>
            </div>

            {/* --- Mobile Navigation --- */}
            <div className="mobile-nav">
                {navLinks.map(({ href, labelKey, icon: Icon }) => {
                    const isActive = (href === '/' && pathname === href) || (href !== '/' && pathname.startsWith(href));
                    const uniqueClassName = labelKey.replace(/_/g, '-');
                    return (
                        <Link key={href} href={href} className={`nav-bubble ${uniqueClassName} ${isActive ? 'active' : ''}`} title={t(labelKey)}>
                            {isActive && <motion.div className="floating-indicator" layoutId="floating-indicator-mobile" initial={false} transition={{ type: 'spring', stiffness: 500, damping: 40 }} />}
                            <div className="nav-icon-container"><Icon className="nav-icon" /></div>
                        </Link>
                    );
                })}
                <div className="mobile-more-menu">
                    <button className="nav-bubble more-menu-bubble" onClick={() => setMenuOpen(o => !o)} title={t('nav_more_options')}>
                        <div className="nav-icon-container"><FaEllipsisV className="nav-icon" /></div>
                    </button>
                </div>
            </div>

            {/* Popup Menu (used by both, but positioned by mobile CSS) */}
            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div 
                        className="more-menu-popup"
                        initial={{ opacity: 0, scale: 0.9, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -20 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                    >
                        <div className="more-menu-links">
                            {secondaryLinks.map(({ href, labelKey, icon: Icon }) => (
                                <Link key={href} href={href} className="more-menu-link" onClick={() => setMenuOpen(false)}>
                                    <Icon />
                                    <span>{t(labelKey)}</span>
                                </Link>
                            ))}
                        </div>
                        <LanguageSwitcher onLanguageChange={() => setMenuOpen(false)} />
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
};

export default Navbar;
