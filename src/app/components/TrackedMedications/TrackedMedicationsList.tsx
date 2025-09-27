'use client';

import React, { useState, useEffect } from 'react';
import { Card, ListGroup, Spinner, Button, Accordion, Alert } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

// --- Types ---
interface PharmacyResult {
    pharmacyId: string;
    pharmacyName: string;
    price: number;
    stockLevel: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
}

interface TrackedMedication {
    medicationId: string;
    medicationName: string;
    pharmacies: PharmacyResult[];
}

interface TrackedMedicationsListProps {
    trackedMedicationIds: string[];
    handleToggleTrack: (medicationId: string) => Promise<void>;
}

const TrackedMedicationsList = ({ trackedMedicationIds, handleToggleTrack }: TrackedMedicationsListProps) => {
    const { t } = useTranslation();
    const [medications, setMedications] = useState<TrackedMedication[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!trackedMedicationIds || trackedMedicationIds.length === 0) {
            setIsLoading(false);
            setMedications([]);
            return;
        }

        const fetchStatuses = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await fetch('/api/medications/status', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ medicationIds: trackedMedicationIds })
                });
                if (!response.ok) throw new Error('Failed to fetch statuses');
                const data = await response.json();
                setMedications(data.results);
            } catch (_err) {
                setError(t('error_fetching_tracked'));
            } finally {
                setIsLoading(false);
            }
        };

        fetchStatuses();
    }, [trackedMedicationIds, t]);

    if (trackedMedicationIds.length === 0) {
        return (
            <Card>
                <Card.Body className="text-center text-muted p-4">
                    {t('no_tracked_medications')}
                </Card.Body>
            </Card>
        );
    }

    return (
        <Card>
            <Card.Header as="h5">{t('my_tracked_medications')}</Card.Header>
            {isLoading ? (
                <div className="d-flex justify-content-center p-4"><Spinner animation="border" /></div>
            ) : error ? (
                <Alert variant="danger" className="m-3">{error}</Alert>
            ) : (
                <Accordion alwaysOpen>
                    {medications.map((med, index) => (
                        <Accordion.Item eventKey={String(index)} key={med.medicationId}>
                            <Accordion.Header>
                                <div className="d-flex justify-content-between w-100 align-items-center pe-2">
                                    <span>{med.medicationName}</span>
                                    <small className="text-muted">
                                        {med.pharmacies.length > 0 
                                            ? t('available_at_n_pharmacies', { count: med.pharmacies.length })
                                            : t('unavailable_everywhere')
                                        }
                                    </small>
                                </div>
                            </Accordion.Header>
                            <Accordion.Body>
                                {med.pharmacies.length > 0 ? (
                                    <ListGroup variant="flush">
                                        {med.pharmacies.map(p => (
                                            <ListGroup.Item key={p.pharmacyId}>
                                                {p.pharmacyName} - {p.price.toFixed(2)}€
                                            </ListGroup.Item>
                                        ))}
                                    </ListGroup>
                                ) : (
                                    <p>{t('no_pharmacies_have_this')}</p>
                                )}
                                <Button variant="link" size="sm" className="mt-2" onClick={() => handleToggleTrack(med.medicationId)}>
                                    {t('untrack_medication_button')}
                                </Button>
                            </Accordion.Body>
                        </Accordion.Item>
                    ))}
                </Accordion>
            )}
        </Card>
    );
};

export default TrackedMedicationsList;
