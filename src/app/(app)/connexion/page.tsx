'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/app/components/providers/AuthContext';
import { Container, Row, Col, Card, Form, Button, Spinner, Alert } from 'react-bootstrap';
import Link from 'next/link';
import './UserLogin.css';

const LoginPage = () => {
    const { t } = useTranslation();
    const router = useRouter();
    const { login } = useAuth();
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        const email = e.currentTarget.email.value;
        const password = e.currentTarget.password.value;

        try {
            const profile = await login(email, password);
            if (profile.role === 'pharmacist') {
                router.push('/pro/dashboard');
            } else {
                router.push('/mon-compte');
            }
        } catch (err) {
            let errorMessage = t('login_error');
            if (err instanceof Error) {
                // Firebase errors have a 'code' property, but it's not standard on Error
                if ('code' in err && err.code === 'auth/invalid-credential') {
                    errorMessage = t('invalid_credentials_error');
                }
            }
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="user-login-wrapper">
            <Container>
                <Row className="justify-content-center">
                    <Col md={6} lg={5}>
                        <Card className="login-card">
                            <Card.Body>
                                <h3 className="text-center mb-4">{t('user_login_title')}</h3>
                                {error && <Alert variant="danger">{error}</Alert>}
                                <Form onSubmit={handleLogin}>
                                    <Form.Group className="mb-3" controlId="email">
                                        <Form.Label>{t('email_label')}</Form.Label>
                                        <Form.Control type="email" placeholder={t('email_placeholder') ?? ''} required />
                                    </Form.Group>
                                    <Form.Group className="mb-3" controlId="password">
                                        <Form.Label>{t('password_label')}</Form.Label>
                                        <Form.Control type="password" placeholder={t('password_placeholder') ?? ''} required />
                                    </Form.Group>
                                    <Button variant="primary" type="submit" className="w-100" disabled={isLoading}>
                                        {isLoading ? <Spinner animation="border" size="sm" /> : t('login_button')}
                                    </Button>
                                </Form>
                                <div className="mt-3 text-center">
                                    <Link href="/creer-compte">{t('create_account_link')}</Link>
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