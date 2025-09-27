'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Form, Button, Spinner, Alert } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/app/components/providers/AuthContext';
import './OpeningHoursManager.css';

interface DayHours {
    isOpen: boolean;
    open: string;
    close: string;
}

interface WeekHours {
    [day: string]: DayHours;
}

const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const initialHours: WeekHours = daysOfWeek.reduce((acc, day) => {
    acc[day] = { isOpen: true, open: '08:00', close: '19:00' };
    if (day === 'saturday') acc[day] = { isOpen: true, open: '09:00', close: '13:00' };
    if (day === 'sunday') acc[day] = { isOpen: false, open: '09:00', close: '13:00' };
    return acc;
}, {} as WeekHours);

const OpeningHoursManager = () => {
    const { t } = useTranslation();
    const { firebaseUser } = useAuth();
    const [hours, setHours] = useState<WeekHours>(initialHours);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const fetchHours = useCallback(async () => {
        if (!firebaseUser) return;
        setIsLoading(true);
        try {
            const token = await firebaseUser.getIdToken();
            const response = await fetch('/api/pro/opening-hours', {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!response.ok) throw new Error('Failed to fetch hours');
            const data = await response.json();
            if (data.openingHours && Object.keys(data.openingHours).length > 0) {
                setHours(data.openingHours);
            }
        } catch (err) {
            setError("Erreur lors de la récupération des horaires.");
        } finally {
            setIsLoading(false);
        }
    }, [firebaseUser]);

    useEffect(() => {
        fetchHours();
    }, [fetchHours]);

    const handleHoursChange = (day: string, field: keyof DayHours, value: string | boolean) => {
        setHours(prev => ({
            ...prev,
            [day]: { ...prev[day], [field]: value },
        }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        setError(null);
        setSuccess(null);
        // TODO: Implement POST request to /api/pro/opening-hours
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsSaving(false);
        setSuccess(t('hours_saved_success'));
    };

    if (isLoading) {
        return <div className="text-center p-4"><Spinner animation="border" /></div>;
    }

    return (
        <div>
            {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}
            {success && <Alert variant="success" onClose={() => setSuccess(null)} dismissible>{success}</Alert>}

            <div className="mb-4">
                {daysOfWeek.map(day => (
                    <div key={day} className="day-row align-items-center">
                        <div className="day-label">{t(`day_${day}`)}</div>
                        <Form.Check 
                            type="switch"
                            id={`switch-${day}`}
                            label={hours[day].isOpen ? t('open') : t('closed')}
                            checked={hours[day].isOpen}
                            onChange={(e) => handleHoursChange(day, 'isOpen', e.target.checked)}
                        />
                        <div className="time-inputs ms-auto">
                            <Form.Control type="time" value={hours[day].open} onChange={(e) => handleHoursChange(day, 'open', e.target.value)} disabled={!hours[day].isOpen} />
                            <span>-</span>
                            <Form.Control type="time" value={hours[day].close} onChange={(e) => handleHoursChange(day, 'close', e.target.value)} disabled={!hours[day].isOpen} />
                        </div>
                    </div>
                ))}
            </div>
            <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Spinner as="span" animation="border" size="sm" /> : t('save_hours_button')}
            </Button>
        </div>
    );
};

export default OpeningHoursManager;