'use client';

import React, { useState } from 'react';
import { Modal, Button, Form, Spinner, Alert } from 'react-bootstrap';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { db } from '@/app/firebase';

interface ReportErrorModalProps {
    show: boolean;
    onHide: () => void;
    pharmacy: google.maps.places.PlaceResult | null;
}

export const ReportErrorModal = ({ show, onHide, pharmacy }: ReportErrorModalProps) => {
    const { t } = useTranslation();
    const [errorType, setErrorType] = useState('');
    const [comment, setComment] = useState('');
    const [otherError, setOtherError] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionState, setSubmissionState] = useState<'idle' | 'success' | 'error'>('idle');

    const ERROR_TYPES = [
        t('error_type_not_on_call'),
        t('error_type_wrong_phone'),
        t('error_type_wrong_address'),
        t('error_type_closed'),
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!errorType || !pharmacy) return;

        setIsSubmitting(true);
        setSubmissionState('idle');

        try {
            await addDoc(collection(db, 'reports'), {
                pharmacyId: pharmacy.place_id,
                pharmacyName: pharmacy.name,
                pharmacyAddress: pharmacy.vicinity,
                errorType: errorType,
                comment: comment,
                reportedAt: serverTimestamp(),
                status: 'new',
            });
            setSubmissionState('success');
        } catch (err) {
            console.error("Error submitting report: ", err);
            setSubmissionState('error');
        } finally {
            setIsSubmitting(false);
            setTimeout(() => {
                onHide();
                resetForm();
            }, 3000);
        }
    };

    const resetForm = () => {
        setErrorType('');
        setComment('');
        setOtherError(false);
        setSubmissionState('idle');
    }

    const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setOtherError(false);
        setErrorType(e.target.value);
        setComment('');
    }

    const handleOtherRadioChange = () => {
        setOtherError(true);
        setErrorType(t('error_type_other'));
    }

    return (
        <Modal show={show} onHide={onHide} centered onExited={resetForm}>
            <Modal.Header closeButton>
                <Modal.Title>{t('report_error_modal_title')}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {submissionState === 'success' ? (
                    <Alert variant="success">{t('report_success_message')}</Alert>
                ) : submissionState === 'error' ? (
                    <Alert variant="danger">{t('report_error_message')}</Alert>
                ) : (
                    <Form onSubmit={handleSubmit}>
                        <p>{t('reporting_for_pharmacy')} <strong>{pharmacy?.name}</strong></p>
                        <Form.Group>
                            <Form.Label>{t('what_is_the_issue')}</Form.Label>
                            {ERROR_TYPES.map(type => (
                                <Form.Check 
                                    key={type}
                                    type="radio"
                                    id={`error-type-${type}`}
                                    label={type}
                                    value={type}
                                    checked={errorType === type}
                                    onChange={handleRadioChange}
                                    required
                                />
                            ))}
                            <Form.Check 
                                type="radio"
                                id={`error-type-other`}
                                label={t('error_type_other')}
                                checked={otherError}
                                onChange={handleOtherRadioChange}
                                required
                            />
                        </Form.Group>
                        
                        {otherError && (
                            <Form.Group className="mt-3">
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder={t('describe_the_issue_placeholder')}
                                    required
                                />
                            </Form.Group>
                        )}

                        <div className="d-grid mt-4">
                            <Button variant="primary" type="submit" disabled={isSubmitting}>
                                {isSubmitting ? <Spinner as="span" animation="border" size="sm" /> : t('send_report_button')}
                            </Button>
                        </div>
                    </Form>
                )}
            </Modal.Body>
        </Modal>
    );
};