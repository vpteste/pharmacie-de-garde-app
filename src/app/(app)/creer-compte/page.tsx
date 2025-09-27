'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Container, Row, Col, Card, Form, Button, Spinner, Alert } from 'react-bootstrap';
import './UserRegister.css';

const UserRegisterPage = () => {
    const { t } = useTranslation();
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        const email = e.currentTarget.email.value;
        const password = e.currentTarget.password.value;

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, role: 'user' })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Registration failed');
            }

            router.push('/connexion?status=success');

        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError(t('register_error'));
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="user-register-page-wrapper">
            <Container>
                <Row className="justify-content-center">
                    <Col md={6} lg={5}>
                        <Card className="user-register-card">
                            <Card.Body>
                                <h3 className="text-center mb-4">{t('create_user_account_title')}</h3>
                                <p className="text-muted text-center">{t('create_user_account_subtitle')}</p>
                                
                                {error && <Alert variant="danger">{error}</Alert>}

                                <Form onSubmit={handleRegister}>
                                    <Form.Group className="mb-3" controlId="email">
                                        <Form.Label>{t('email_label')}</Form.Label>
                                        <Form.Control type="email" placeholder={t('email_placeholder') ?? ''} required />
                                    </Form.Group>

                                    <Form.Group className="mb-3" controlId="password">
                                        <Form.Label>{t('password_label')}</Form.Label>
                                        <Form.Control type="password" placeholder={t('password_min_char_placeholder') ?? ''} required />
                                    </Form.Group>

                                    <Button variant="primary" type="submit" className="w-100" disabled={isLoading}>
                                        {isLoading ? <Spinner as="span" animation="border" size="sm" /> : t('create_account_button')}
                                    </Button>
                                </Form>
                                <div className="mt-3 text-center">
                                    <p>{t('already_have_account')} <Link href="/connexion">{t('login_link')}</Link></p>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </div>
    );
};

export default UserRegisterPage;
