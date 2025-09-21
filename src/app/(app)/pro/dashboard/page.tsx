'use client';
import { useAuth } from '../AuthContext';
import { Container, Card, Row, Col, Button } from 'react-bootstrap';
import Link from 'next/link';

// A placeholder component for a summary stat card
const StatCard = ({ title, value, icon }: { title: string, value: string, icon: React.ReactNode }) => (
    <Card>
        <Card.Body className="d-flex align-items-center">
            <div className="me-3">{icon}</div>
            <div>
                <div className="text-muted">{title}</div>
                <div className="h4 fw-bold mb-0">{value}</div>
            </div>
        </Card.Body>
    </Card>
);

export default function DashboardPage() {
    const { user } = useAuth();

    return (
        <Container fluid>
            <h1 className="h2">Tableau de Bord</h1>
            {user && <p className="text-muted">Bienvenue, {user.email}</p>}
            
            <Row className="my-4">
                <Col md={4}>
                    <StatCard 
                        title="Statut de garde ce soir" 
                        value="De Garde"
                        icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-success"><path d="M12 3v1m0 16v1m8.4-8.6l-.7.7M4.3 4.3l-.7.7m15.4 0l-.7-.7M4.3 19.7l-.7-.7"/></svg>}
                    />
                </Col>
                 <Col md={4}>
                    <StatCard 
                        title="Demandes de stock en attente" 
                        value="3"
                        icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-warning"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>}
                    />
                </Col>
            </Row>

            <Card>
                <Card.Header>
                    <Card.Title as="h5">Accès Rapide</Card.Title>
                </Card.Header>
                <Card.Body>
                    <p>Gérez rapidement les aspects les plus importants de votre établissement.</p>
                    <Link href="/pro/dashboard/gardes" passHref>
                        <Button variant="primary" className="me-2">Gérer mon calendrier de garde</Button>
                    </Link>
                    <Link href="/pro/dashboard/stock" passHref>
                        <Button variant="outline-secondary">Voir les demandes de stock</Button>
                    </Link>
                </Card.Body>
            </Card>
        </Container>
    );
}
