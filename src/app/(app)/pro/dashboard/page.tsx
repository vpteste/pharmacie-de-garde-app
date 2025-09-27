'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/components/providers/AuthContext';
import { Container, Row, Col, Button, Spinner, Tabs, Tab } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { motion, Variants } from 'framer-motion';
import GlassCard from '@/app/components/GlassCard/GlassCard';
import CalendarManager from '@/app/components/CalendarManager/CalendarManager';
import InventoryManager from '@/app/components/InventoryManager/InventoryManager';
import OpeningHoursManager from '@/app/components/OpeningHoursManager/OpeningHoursManager';
import './Dashboard.css';

// Animation variants for staggered effect
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { duration: 0.5, ease: 'easeInOut' } },
};

interface DashboardStats {
  monthlyHours: number | null;
  nextDuty: string | null;
  medsAlertCount: number | null;
}

const DashboardPage = () => {
    const { t } = useTranslation();
    const { userProfile, firebaseUser, logout, isLoading } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState<DashboardStats>({ monthlyHours: null, nextDuty: null, medsAlertCount: null });
    const [isLoadingStats, setIsLoadingStats] = useState(true);

    useEffect(() => {
        if (!isLoading && (!userProfile || userProfile.role !== 'pharmacist')) {
            router.push('/pro/login');
        }
    }, [userProfile, isLoading, router]);

    useEffect(() => {
        const fetchStats = async () => {
            if (!firebaseUser) return;
            setIsLoadingStats(true);
            try {
                const token = await firebaseUser.getIdToken();
                const response = await fetch('/api/pro/dashboard-stats', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch stats');
                }

                const data = await response.json();
                setStats({ monthlyHours: data.monthlyHours, nextDuty: data.nextDuty, medsAlertCount: data.medsAlertCount });
            } catch (error) {
                console.error("Error fetching dashboard stats:", error);
                setStats({ monthlyHours: 0, nextDuty: "N/A", medsAlertCount: 0 }); // Show fallback on error
            } finally {
                setIsLoadingStats(false);
            }
        };

        fetchStats();
    }, [firebaseUser]);

    const handleLogout = async () => {
        await logout();
        router.push('/pro/login');
    };

    if (isLoading || !userProfile) {
        return (
            <div className="dashboard-wrapper d-flex justify-content-center align-items-center">
                <Spinner animation="border" variant="primary" />
            </div>
        );
    }

    const statCards = [
        { title: t('stats_hours_on_duty'), value: isLoadingStats ? '...' : stats.monthlyHours },
        { title: t('stats_next_duty'), value: isLoadingStats ? '...' : stats.nextDuty },
        { title: t('stats_meds_alert'), value: isLoadingStats ? '...' : stats.medsAlertCount },
    ];

    return (
        <div className="dashboard-wrapper">
            <Container fluid>
                <motion.div variants={containerVariants} initial="hidden" animate="show">
                    <Row>
                        <Col>
                            <GlassCard className="main-dashboard-card" variants={itemVariants} style={{padding: 0}}>
                                <div className="card-header d-flex justify-content-between align-items-center">
                                    {t('dashboard_title')}
                                    <Button variant="outline-danger" size="sm" onClick={handleLogout}>
                                        {t('logout_button')}
                                    </Button>
                                </div>
                                <div style={{padding: '1.5rem 1.5rem 0 1.5rem'}}>
                                    <h4>{t('welcome_title')} {userProfile.role === 'pharmacist' && userProfile.name}!</h4>
                                    <p className="text-muted" style={{marginBottom: '1rem'}}>
                                        {t('welcome_message', { email: userProfile.email })}
                                    </p>
                                    <hr style={{marginTop: 0}}/>
                                </div>
                                <Tabs defaultActiveKey="calendar" id="dashboard-tabs" className="mb-3">
                                    <Tab eventKey="calendar" title={t('calendar_tab')}>
                                        <div style={{ padding: '1.5rem' }}>
                                            <CalendarManager />
                                        </div>
                                    </Tab>
                                    <Tab eventKey="inventory" title={t('inventory_tab')}>
                                        <div style={{ padding: '1.5rem' }}>
                                            <InventoryManager />
                                        </div>
                                    </Tab>
                                    <Tab eventKey="hours" title={t('hours_tab')}>
                                        <div style={{ padding: '1.5rem' }}>
                                            <OpeningHoursManager />
                                        </div>
                                    </Tab>
                                </Tabs>
                            </GlassCard>
                        </Col>
                    </Row>

                    <div className="stats-grid">
                        {statCards.map((stat, index) => (
                            <GlassCard key={index} className="stat-card" variants={itemVariants}>
                                <h5>{stat.title}</h5>
                                <p>{stat.value}</p>
                            </GlassCard>
                        ))}
                         <GlassCard className="stat-card" variants={itemVariants}>
                                <h5>{t('health_watch_title')}</h5>
                                <p style={{fontSize: '1rem', opacity: 0.8}}>{t('no_active_alert')}</p>
                         </GlassCard>
                    </div>
                </motion.div>
            </Container>
        </div>
    );
};

export default DashboardPage;
