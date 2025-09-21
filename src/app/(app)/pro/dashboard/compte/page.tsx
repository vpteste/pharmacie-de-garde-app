'use client';
import { Container, Card, Form, Button, Row, Col } from 'react-bootstrap';

// This is a placeholder component. In a real app, you would fetch user/pharmacy data.

export default function ComptePage() {
    return (
        <Container fluid>
            <h1>Mon Compte</h1>
            <p className="text-muted">Mettez à jour les informations de votre compte et de votre établissement.</p>
            
            <Card className="mt-4">
                <Card.Header>
                    <Card.Title as="h5">Informations du Compte</Card.Title>
                </Card.Header>
                <Card.Body>
                    <Form>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Email de connexion</Form.Label>
                                    <Form.Control type="email" defaultValue="pharmacien@exemple.com" disabled />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Button variant="secondary">Changer le mot de passe</Button>
                    </Form>
                </Card.Body>
            </Card>

            <Card className="mt-4">
                <Card.Header>
                    <Card.Title as="h5">Informations de l&apos;Établissement</Card.Title>
                </Card.Header>
                <Card.Body>
                    <Form>
                         <Form.Group className="mb-3">
                            <Form.Label>Nom de l&apos;établissement</Form.Label>
                            <Form.Control type="text" defaultValue="Pharmacie du Centre" />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Adresse</Form.Label>
                            <Form.Control type="text" defaultValue="123 Rue de la République, 75001 Paris" />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Téléphone</Form.Label>
                            <Form.Control type="text" defaultValue="01 23 45 67 89" />
                        </Form.Group>
                        <Button variant="primary">Enregistrer les modifications</Button>
                    </Form>
                </Card.Body>
            </Card>
        </Container>
    );
}
