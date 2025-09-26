'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Row, Col, Card, Form, Button, Spinner, Alert } from 'react-bootstrap';
import { useAuth } from '@/app/components/providers/AuthContext';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import './Login.css';

const LoginPage = () => {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const { login, userProfile } = useAuth();
    const router = useRouter();



    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const profile = await login(email, password);
            
            if (profile.role === 'pharmacist') {
                router.push('/pro/dashboard');
            } else {
                // Not a pharmacist, deny access.
                setError(t('pro_login_access_denied'));
                await logout(); // Log the user out as they don't belong here.
                setLoading(false);
            }

        } catch (err: any) {
            console.error("Login error:", err);
            if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.message.includes("User profile not found")) {
                setError(t('invalid_credentials_error'));
            } else if (err.code === 'auth/invalid-email') {
                setError(t('invalid_email_error'));
            } else {
                setError(t('login_error'));
            }
            setLoading(false);
        }
        // Do not set loading to false here on success, as the page will be redirecting
    };

    return (
        <div className="login-page-wrapper">
            <Container fluid className="login-container">
                <Row className="justify-content-center align-items-center h-100">
                    <Col xs={12} md={8} lg={6} xl={4}>
                        <Card className="login-card shadow-lg">
                            <Card.Body className="p-4 p-md-5">
                                <div className="text-center mb-4">
                                    <h2 className="login-title">{t('pro_space_title')}</h2>
                                    <p className="text-muted">{t('login_subtitle')}</p>
                                </div>
                                
                                {error && <Alert variant="danger">{error}</Alert>}

                                <Form onSubmit={handleLogin}>
                                    <Form.Group className="mb-3" controlId="formBasicEmail">
                                        <Form.Label>{t('email_label')}</Form.Label>
                                        <Form.Control
                                            type="email"
                                            placeholder={t('email_placeholder')}
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            className="login-input"
                                        />
                                    </Form.Group>

                                    <Form.Group className="mb-4" controlId="formBasicPassword">
                                        <Form.Label>{t('password_label')}</Form.Label>
                                        <Form.Control
                                            type="password"
                                            placeholder={t('password_placeholder')}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            className="login-input"
                                        />
                                    </Form.Group>

                                    <Button variant="primary" type="submit" className="w-100 login-button" disabled={loading}>
                                        {loading ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> : t('login_button')}
                                    </Button>
                                </Form>
                                <div className="mt-4 text-center">
                                    <p className="text-muted">
                                        {t('no_account')} <Link href="/inscrire-etablissement">{t('register_link')}</Link>
                                    </p>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </div>
    );
};

export default LoginPage;