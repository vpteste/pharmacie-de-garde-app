'use client';

import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import './RendezVous.css';

export default function RendezVousPage() {
    const { t } = useTranslation();

    const tips = [
        {
            title: t('tip_1_title'),
            text: t('tip_1_text'),
        },
        {
            title: t('tip_2_title'),
            text: t('tip_2_text'),
        },
        {
            title: t('tip_3_title'),
            text: t('tip_3_text'),
        },
    ];

    return (
        <div className="rendezvous-container">
            <Container>
                <Row className="justify-content-center">
                    <Col lg={10} xl={8}>
                        <Card className="hero-card">
                            <Card.Body>
                                <h1>{t('appointments_page_title')}</h1>
                                <p className="lead text-muted">
                                    {t('appointments_page_subtitle')}
                                </p>
                                <Link href="/pharmacies" passHref>
                                    <Button variant="primary" size="lg">{t('find_pharmacy_now_button')}</Button>
                                </Link>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                <div className="tips-section">
                    <h2>{t('practical_tips_title')}</h2>
                    <Row xs={1} md={3} className="g-4">
                        {tips.map((tip, index) => (
                            <Col key={index}>
                                <Card className="tip-card">
                                    <Card.Body>
                                        <Card.Title as="h5">{tip.title}</Card.Title>
                                        <Card.Text>{tip.text}</Card.Text>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </div>
            </Container>
        </div>
    );
}