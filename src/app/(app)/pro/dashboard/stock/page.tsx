'use client';
import { Container, Card } from 'react-bootstrap';

export default function StockPage() {
    return (
        <Container fluid>
            <h1>Gestion du Stock</h1>
            <p className="text-muted">Cette fonctionnalité est en cours de développement.</p>
            <Card className="mt-4">
                <Card.Body>
                    <Card.Title>Prochainement</Card.Title>
                    <Card.Text>
                        Vous pourrez bientôt :
                        <ul>
                            <li>Gérer une liste de médicaments clés pour informer les patients de leur disponibilité.</li>
                            <li>Recevoir et répondre aux demandes de stock des utilisateurs en temps réel.</li>
                        </ul>
                    </Card.Text>
                </Card.Body>
            </Card>
        </Container>
    );
}
