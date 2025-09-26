'use client';

import React, { useState, useEffect } from 'react';
import { Card, ListGroup, Spinner, Button, Alert } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

// Define the shape of the pharmacy details we expect from our API
interface PharmacyDetails {
    place_id: string;
    name: string;
    vicinity: string;
    formatted_phone_number?: string;
}

interface FavoritePharmaciesListProps {
    pharmacyIds: string[];
    handleToggleFavorite: (pharmacyId: string) => Promise<void>;
}

const FavoritePharmaciesList = ({ pharmacyIds, handleToggleFavorite }: FavoritePharmaciesListProps) => {
    const { t } = useTranslation();
    const [pharmacies, setPharmacies] = useState<PharmacyDetails[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!pharmacyIds || pharmacyIds.length === 0) {
            setIsLoading(false);
            setPharmacies([]);
            return;
        }

        const fetchPharmacyDetails = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await fetch('/api/pharmacy-details', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ placeIds: pharmacyIds })
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch pharmacy details');
                }

                const data = await response.json();
                setPharmacies(data.pharmacies);

            } catch (err) {
                setError(t('error_fetching_favorites'));
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPharmacyDetails();
    }, [pharmacyIds, t]);

    if (pharmacyIds.length === 0) {
        return (
            <Card>
                <Card.Body className="text-center text-muted p-4">
                    {t('no_favorite_pharmacies')}
                </Card.Body>
            </Card>
        );
    }

    return (
        <Card>
            <Card.Header as="h5">{t('my_favorite_pharmacies')}</Card.Header>
            {isLoading ? (
                <div className="d-flex justify-content-center p-4">
                    <Spinner animation="border" />
                </div>
            ) : error ? (
                <Alert variant="danger" className="m-3">{error}</Alert>
            ) : (
                <ListGroup variant="flush">
                    {pharmacies.map(pharmacy => (
                        <ListGroup.Item key={pharmacy.place_id} className="d-flex justify-content-between align-items-center">
                            <div>
                                <div className="fw-bold">{pharmacy.name}</div>
                                <div className="text-muted">{pharmacy.vicinity}</div>
                            </div>
                            <Button variant="outline-danger" size="sm" onClick={() => handleToggleFavorite(pharmacy.place_id)}>
                                {t('remove_button')}
                            </Button>
                        </ListGroup.Item>
                    ))}
                </ListGroup>
            )}
        </Card>
    );
};

export default FavoritePharmaciesList;
