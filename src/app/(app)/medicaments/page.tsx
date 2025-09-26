'use client';

import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Accordion, Table, Spinner, Button, Badge } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/app/components/providers/AuthContext';
import { useDebounce } from '@/hooks/useDebounce';
import './Medicaments.css';

// --- Types ---
interface PharmacyResult {
    pharmacyId: string;
    pharmacyName: string;
    price: number;
    stockLevel: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
}

interface MedicationSearchResult {
    medicationId: string;
    medicationName: string;
    pharmacies: PharmacyResult[];
}

// --- Components ---
const StockBadge = ({ stockLevel }: { stockLevel: PharmacyResult['stockLevel'] }) => {
    const { t } = useTranslation();
    const variants = {
        IN_STOCK: { bg: 'success', label: t('stock_in_stock') },
        LOW_STOCK: { bg: 'warning', label: t('stock_low_stock') },
        OUT_OF_STOCK: { bg: 'danger', label: t('stock_out_of_stock') },
    };
    const variant = variants[stockLevel] || { bg: 'secondary', label: stockLevel };
    return <Badge bg={variant.bg}>{variant.label}</Badge>;
};

const MedsPage = () => {
    const { t } = useTranslation();
    const { userProfile, setUserProfile, firebaseUser } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<MedicationSearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    
    const debouncedSearchTerm = useDebounce(searchTerm, 400);

    useEffect(() => {
        if (debouncedSearchTerm.length < 2) {
            setResults([]);
            return;
        }

        const search = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`/api/medications/public-search?term=${debouncedSearchTerm}`);
                const data = await response.json();
                setResults(data.results || []);
            } catch (error) {
                console.error("Failed to search medication inventory:", error);
                setResults([]);
            } finally {
                setIsLoading(false);
            }
        };

        search();
    }, [debouncedSearchTerm]);

    const handleToggleTrack = async (medicationId: string) => {
        if (!userProfile || !firebaseUser) {
            // Consider redirecting to login page
            return;
        }

        const originalProfile = userProfile;
        const isTracked = originalProfile.trackedMedications?.includes(medicationId);
        const updatedTracked = isTracked
            ? originalProfile.trackedMedications?.filter(id => id !== medicationId)
            : [...(originalProfile.trackedMedications || []), medicationId];

        // Optimistic update
        if(setUserProfile) {
            setUserProfile({ ...originalProfile, trackedMedications: updatedTracked });
        }

        try {
            const token = await firebaseUser.getIdToken();
            const method = isTracked ? 'DELETE' : 'POST';
            const url = isTracked ? `/api/user/tracked-medications?medicationId=${medicationId}` : '/api/user/tracked-medications';
            
            const response = await fetch(url, {
                method: method,
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: isTracked ? undefined : JSON.stringify({ medicationId })
            });

            if (!response.ok) throw new Error('API call failed');

        } catch (error) {
            if(setUserProfile) setUserProfile(originalProfile); // Revert on failure
            console.error("Failed to update tracked medications:", error);
        }
    };

    return (
        <div className="medicaments-container">
            <Container>
                <div className="search-header">
                    <h1>{t('meds_page_title')}</h1>
                    <p className="text-muted">{t('meds_page_subtitle_dynamic')}</p>
                </div>

                <Row className="justify-content-center">
                    <Col md={8} lg={6}>
                        <div className="search-bar">
                            <Form.Control
                                type="search"
                                placeholder={t('meds_search_placeholder')}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                size="lg"
                            />
                        </div>
                    </Col>
                </Row>

                <div className="results-container mt-4">
                    {isLoading ? (
                        <div className="text-center"><Spinner animation="border" /></div>
                    ) : results.length > 0 ? (
                        <Accordion alwaysOpen>
                            {results.map((med, index) => {
                                const isTracked = userProfile?.trackedMedications?.includes(med.medicationId);
                                return (
                                    <Accordion.Item eventKey={String(index)} key={med.medicationId}>
                                        <Accordion.Header>
                                            <div className="d-flex justify-content-between w-100 align-items-center pe-2">
                                                <span>{med.medicationName}</span>
                                                <Button 
                                                    size="sm" 
                                                    variant={isTracked ? 'primary' : 'outline-primary'}
                                                    onClick={(e) => { e.stopPropagation(); handleToggleTrack(med.medicationId); }}
                                                    disabled={!userProfile}
                                                >
                                                    {isTracked ? t('untrack_medication_button') : t('track_medication_button')}
                                                </Button>
                                            </div>
                                        </Accordion.Header>
                                        <Accordion.Body>
                                            <Table striped bordered hover responsive size="sm">
                                                <thead>
                                                    <tr>
                                                        <th>{t('pharmacy_label')}</th>
                                                        <th>{t('price_label')}</th>
                                                        <th>{t('availability_label')}</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {med.pharmacies.map(p => (
                                                        <tr key={p.pharmacyId}>
                                                            <td>{p.pharmacyName}</td>
                                                            <td>{p.price.toFixed(2)} €</td>
                                                            <td><StockBadge stockLevel={p.stockLevel} /></td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </Table>
                                        </Accordion.Body>
                                    </Accordion.Item>
                                );
                            })}
                        </Accordion>
                    ) : debouncedSearchTerm.length >= 2 && (
                        <Col xs={12}>
                            <div className="no-results">
                                <p>{t('no_meds_found', { term: debouncedSearchTerm })}</p>
                            </div>
                        </Col>
                    )}
                </div>
            </Container>
        </div>
    );
};

export default MedsPage;