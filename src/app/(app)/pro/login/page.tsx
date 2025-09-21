'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Form, Button, Card, Container, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../../firebase';
import Link from 'next/link';
import './login.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/pro/dashboard'); // Redirect to dashboard on success
    } catch (error: any) {
      console.error("Login error:", error.code);
      switch (error.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          setError("Adresse e-mail ou mot de passe incorrect.");
          break;
        default:
          setError("Une erreur est survenue. Veuillez réessayer.");
          break;
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <Container>
        <Row className="justify-content-center">
          <Col md={6} lg={5} xl={4}>
            <Card className="login-card">
              <Card.Body>
                <div className="text-center mb-4">
                  <h1 className="login-title">Espace Professionnel</h1>
                  <p className="text-muted">Connectez-vous pour gérer votre établissement.</p>
                </div>
                <Form onSubmit={handleLogin}>
                  {error && <Alert variant="danger">{error}</Alert>}
                  <Form.Group className="mb-3" controlId="email">
                    <Form.Label>Adresse e-mail</Form.Label>
                    <Form.Control
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3" controlId="password">
                    <Form.Label>Mot de passe</Form.Label>
                    <Form.Control
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </Form.Group>

                  <div className="d-grid">
                    <Button variant="primary" type="submit" disabled={isLoading}>
                      {isLoading ? <Spinner animation="border" size="sm" /> : 'Se connecter'}
                    </Button>
                  </div>
                </Form>
              </Card.Body>
              <Card.Footer className="text-center">
                <small className="text-muted">
                  Pas encore de compte ? <Link href="/inscrire-etablissement">Inscrivez votre établissement</Link>
                </small>
              </Card.Footer>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}
