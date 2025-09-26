'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Row, Col, Card, Form, Button, Spinner, Alert, Toast, ToastContainer } from 'react-bootstrap';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import './UserRegister.css';

const UserRegisterPage = () => {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [showSuccessToast, setShowSuccessToast] = useState(false);

    const router = useRouter();



    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    email, 
                    password, 
                    role: 'user' 
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                // Use the error message from the API response
                throw new Error(data.error || t('register_error'));
            }

            setShowSuccessToast(true);
            setTimeout(() => {
                router.push('/connexion'); // Redirect to login after showing toast
            }, 2000); // Show toast for 2 seconds

        } catch (err: any) {
            console.error("Registration error:", err);
            // Set the error message from the caught error
            setError(err.message || t('register_error'));
            setLoading(false);
        }
    };

    return (
        <div className="user-register-page-wrapper">
            <Container fluid className="user-register-container">
                <Row className="justify-content-center align-items-center h-100">
                    <Col xs={12} md={8} lg={6} xl={4}>
                        <Card className="user-register-card shadow-lg">
                            <Card.Body className="p-4 p-md-5">
                                <div className="text-center mb-4">
                                    <h2 className="user-register-title">{t('create_user_account_title')}</h2>
                                    <p className="text-muted">{t('create_user_account_subtitle')}</p>
                                </div>
                                
                                {error && <Alert variant="danger">{error}</Alert>}

                                <Form onSubmit={handleRegister}>
                                    <Form.Group className="mb-3" controlId="email">
                                        <Form.Label>{t('email_label')}</Form.Label>
                                        <Form.Control type="email" placeholder={t('email_placeholder')} value={email} onChange={(e) => setEmail(e.target.value)} required className="user-register-input" />
                                    </Form.Group>

                                    <Form.Group className="mb-4" controlId="password">
                                        <Form.Label>{t('password_label')}</Form.Label>
                                        <Form.Control type="password" placeholder={t('password_min_char_placeholder')} value={password} onChange={(e) => setPassword(e.target.value)} required className="user-register-input" />
                                    </Form.Group>

                                    <Button variant="primary" type="submit" className="w-100 user-register-button" disabled={loading}>
                                        {loading ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> : t('create_account_button')}
                                    </Button>
                                </Form>
                                <div className="mt-4 text-center">
                                    <p className="text-muted">
                                        {t('already_have_account')} <Link href="/connexion">{t('login_link')}</Link>
                                    </p>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>

            <ToastContainer position="top-end" className="p-3">
                <Toast onClose={() => setShowSuccessToast(false)} show={showSuccessToast} delay={2000} autohide bg="success">
                    <Toast.Header>
                        <strong className="me-auto">{t('registration_success_title')}</strong>
                    </Toast.Header>
                    <Toast.Body className="text-white">{t('registration_success_message')}</Toast.Body>
                </Toast>
            </ToastContainer>
        </div>
    );
};

export default UserRegisterPage;