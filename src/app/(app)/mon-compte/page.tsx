'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Row, Col, Button, Spinner } from 'react-bootstrap';
import { useAuth } from '@/app/components/providers/AuthContext';
import { useTranslation } from 'react-i18next';
import FavoritePharmaciesList from '@/app/components/FavoritePharmacies/FavoritePharmaciesList';
import TrackedMedicationsList from '@/app/components/TrackedMedications/TrackedMedicationsList';
import './MonCompte.css';

const MonComptePage = () => {
    const { t } = useTranslation();
    const { userProfile, setUserProfile, firebaseUser, logout, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !userProfile) {
            router.push('/connexion');
        }
    }, [userProfile, isLoading, router]);

    const handleLogout = async () => {
        await logout();
        router.push('/');
    };

    const handleToggleFavorite = async (pharmacyId: string) => {
        if (!userProfile || !firebaseUser || !setUserProfile) return;
        const originalProfile = userProfile;
        const updatedFavorites = originalProfile.favoritePharmacies?.filter(id => id !== pharmacyId) || [];
        setUserProfile({ ...originalProfile, favoritePharmacies: updatedFavorites });
        try {
            const token = await firebaseUser.getIdToken();
            await fetch('/api/user/favorites', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ pharmacyId })
            });
        } catch (error) {
            setUserProfile(originalProfile);
        }
    };

    const handleToggleTrack = async (medicationId: string) => {
        if (!userProfile || !firebaseUser || !setUserProfile) return;
        const originalProfile = userProfile;
        const isTracked = originalProfile.trackedMedications?.includes(medicationId);
        const updatedTracked = isTracked
            ? originalProfile.trackedMedications?.filter(id => id !== medicationId)
            : [...(originalProfile.trackedMedications || []), medicationId];
        setUserProfile({ ...originalProfile, trackedMedications: updatedTracked });
        try {
            const token = await firebaseUser.getIdToken();
            const method = isTracked ? 'DELETE' : 'POST';
            const url = isTracked ? `/api/user/tracked-medications?medicationId=${medicationId}` : '/api/user/tracked-medications';
            await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: isTracked ? undefined : JSON.stringify({ medicationId })
            });
        } catch (error) {
            setUserProfile(originalProfile);
        }
    };

    if (isLoading || !userProfile) {
        return <div className="page-loading-wrapper"><Spinner animation="border" variant="primary" /></div>;
    }
    
    if (userProfile.role !== 'user') {
         router.push('/pro/dashboard');
         return <div className="page-loading-wrapper"><Spinner animation="border" variant="primary" /></div>;
    }

    return (
        <div className="mon-compte-page-wrapper">
            <Container className="mon-compte-container">
                <Row className="justify-content-center">
                    <Col md={10} lg={8}>
                        <div className="text-center mb-5">
                            <h2 className="mon-compte-title">{t('user_space_title')}</h2>
                            <p className="text-muted">{t('welcome_message_user', { email: userProfile.email })}</p>
                        </div>

                        <FavoritePharmaciesList 
                            pharmacyIds={userProfile.favoritePharmacies || []} 
                            handleToggleFavorite={handleToggleFavorite}
                        />

                        <div className="mt-4">
                            <TrackedMedicationsList 
                                trackedMedicationIds={userProfile.trackedMedications || []}
                                handleToggleTrack={handleToggleTrack}
                            />
                        </div>

                        <Button variant="outline-danger" onClick={handleLogout} className="w-100 mt-5">
                            {t('logout_button')}
                        </Button>
                    </Col>
                </Row>
            </Container>
        </div>
    );
};

export default MonComptePage;