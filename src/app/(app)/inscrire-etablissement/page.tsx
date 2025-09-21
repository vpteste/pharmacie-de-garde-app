
'use client';
import { useState } from 'react';
import { Form, Button, ProgressBar, Card, Container, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { auth, db } from '../../firebase'; // Import Firebase config
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import './inscrire.css';

export default function InscrireEtablissementPage() {
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    // Step 1
    establishmentName: '',
    address: '',
    phone: '',
    email: '',
    // Step 2
    licenseNumber: '',
    headPharmacist: '',
    // Step 3
    openingHours: {
      monday: { open: '09:00', close: '19:00', closed: false },
      tuesday: { open: '09:00', close: '19:00', closed: false },
      wednesday: { open: '09:00', close: '19:00', closed: false },
      thursday: { open: '09:00', close: '19:00', closed: false },
      friday: { open: '09:00', close: '19:00', closed: false },
      saturday: { open: '09:00', close: '12:00', closed: false },
      sunday: { open: '', close: '', closed: true },
    },
    services: {
      vaccination: false,
      antigenicTests: false,
      customPreparations: false,
      medicalEquipment: false,
      teleconsultation: false,
    },
    // Step 4
    ownerEmail: '',
    password: '',
    confirmPassword: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    if (name.includes('.')) {
      const [category, key] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [category]: {
          // @ts-ignore
          ...prev[category],
          [key]: type === 'checkbox' ? checked : value,
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
    }
  };
  
  const handleTimeChange = (day: string, type: 'open' | 'close', value: string) => {
    setFormData(prev => ({
      ...prev,
      openingHours: {
        ...prev.openingHours,
        [day]: { ...prev.openingHours[day as keyof typeof prev.openingHours], [type]: value }
      }
    }));
  };

  const handleDayClosedToggle = (day: string) => {
    setFormData(prev => ({
      ...prev,
      openingHours: {
        ...prev.openingHours,
        [day]: { ...prev.openingHours[day as keyof typeof prev.openingHours], closed: !prev.openingHours[day as keyof typeof prev.openingHours].closed }
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setIsLoading(true);

    try {
      // 1. Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, formData.ownerEmail, formData.password);
      const user = userCredential.user;

      // 2. Create pharmacy document in Firestore
      const { ownerEmail, password, confirmPassword, ...pharmacyData } = formData;
      await setDoc(doc(db, "pharmacies", user.uid), {
        ...pharmacyData,
        owner_uid: user.uid,
        status: 'pending_approval', // For moderation
        createdAt: serverTimestamp(),
      });

      setFormSubmitted(true);

    } catch (error: any) {
      console.error("Error during registration:", error);
      if (error.code === 'auth/email-already-in-use') {
        setError("Cette adresse e-mail est déjà utilisée. Veuillez en choisir une autre.");
      } else {
        setError("Une erreur est survenue lors de l'inscription. Veuillez réessayer.");
      }
    } finally {
      setIsLoading(false);
    }
  };


  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const progress = (step - 1) * 33.33;

  if (formSubmitted) {
    return (
        <div className="registration-page">
            <Container>
                <Row className="justify-content-center">
                    <Col lg={8} xl={7}>
                        <Card className="text-center p-5">
                            <Card.Body>
                                <h2 className="text-success">Inscription Réussie !</h2>
                                <p className="mt-3">Merci pour votre inscription. Votre établissement est maintenant en cours de validation par notre équipe.</p>
                                <p>Vous serez notifié par e-mail une fois la validation effectuée. Vous pourrez alors vous connecter à votre tableau de bord.</p>
                                <Button href="/" variant="primary" className="mt-4">Retour à l'accueil</Button>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </div>
    );
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <Card.Body>
            <Card.Title>Étape 1: Informations de base</Card.Title>
            <p className="text-muted">Commencez par les informations essentielles de votre établissement.</p>
            <Form.Group className="mb-3">
              <Form.Label>Nom de l'établissement</Form.Label>
              <Form.Control type="text" name="establishmentName" value={formData.establishmentName} onChange={handleInputChange} placeholder="Pharmacie du Centre" required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Adresse</Form.Label>
              {/* TODO: Intégrer Google Places Autocomplete ici */}
              <Form.Control type="text" name="address" value={formData.address} onChange={handleInputChange} placeholder="123 Rue de la République, 75001 Paris" required />
            </Form.Group>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Numéro de téléphone</Form.Label>
                  <Form.Control type="tel" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="01 23 45 67 89" required />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Adresse e-mail de contact</Form.Label>
                  <Form.Control type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="contact@pharmacieducentre.fr" required />
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        );
      case 2:
        return (
          <Card.Body>
            <Card.Title>Étape 2: Informations légales et services</Card.Title>
             <p className="text-muted">Renseignez vos informations réglementaires et les services que vous proposez.</p>
            <Row>
                <Col md={6}>
                    <Form.Group className="mb-3">
                        <Form.Label>Numéro de licence ou d'agrément</Form.Label>
                        <Form.Control type="text" name="licenseNumber" value={formData.licenseNumber} onChange={handleInputChange} placeholder="N° XXXXXX" required />
                    </Form.Group>
                </Col>
                <Col md={6}>
                    <Form.Group className="mb-3">
                        <Form.Label>Nom du pharmacien titulaire</Form.Label>
                        <Form.Control type="text" name="headPharmacist" value={formData.headPharmacist} onChange={handleInputChange} placeholder="Dr. Marie Dupont" required />
                    </Form.Group>
                </Col>
            </Row>
            <hr className="my-4" />
            <Form.Group className="mb-3">
              <Form.Label>Services proposés</Form.Label>
              <div className="services-grid">
                <Form.Check type="switch" id="vaccination" name="services.vaccination" label="Vaccination" checked={formData.services.vaccination} onChange={handleInputChange} />
                <Form.Check type="switch" id="antigenicTests" name="services.antigenicTests" label="Tests antigéniques" checked={formData.services.antigenicTests} onChange={handleInputChange} />
                <Form.Check type="switch" id="customPreparations" name="services.customPreparations" label="Préparations magistrales" checked={formData.services.customPreparations} onChange={handleInputChange} />
                <Form.Check type="switch" id="medicalEquipment" name="services.medicalEquipment" label="Matériel médical" checked={formData.services.medicalEquipment} onChange={handleInputChange} />
                <Form.Check type="switch" id="teleconsultation" name="services.teleconsultation" label="Téléconsultation" checked={formData.services.teleconsultation} onChange={handleInputChange} />
              </div>
            </Form.Group>
          </Card.Body>
        );
      case 3:
        return (
            <Card.Body>
                <Card.Title>Étape 3: Horaires d'ouverture</Card.Title>
                <p className="text-muted">Indiquez vos horaires pour chaque jour de la semaine.</p>
                {Object.keys(formData.openingHours).map(day => (
                    <Row key={day} className="align-items-center mb-2 day-row">
                        <Col xs={3} sm={2}>
                            <Form.Label className="text-capitalize">{day}</Form.Label>
                        </Col>
                        <Col>
                            <Form.Control 
                                type="time" 
                                value={formData.openingHours[day as keyof typeof formData.openingHours].open}
                                onChange={(e) => handleTimeChange(day, 'open', e.target.value)}
                                disabled={formData.openingHours[day as keyof typeof formData.openingHours].closed}
                            />
                        </Col>
                        <Col>
                            <Form.Control 
                                type="time" 
                                value={formData.openingHours[day as keyof typeof formData.openingHours].close}
                                onChange={(e) => handleTimeChange(day, 'close', e.target.value)}
                                disabled={formData.openingHours[day as keyof typeof formData.openingHours].closed}
                            />
                        </Col>
                        <Col xs={12} sm="auto" className="mt-2 mt-sm-0">
                            <Form.Check 
                                type="checkbox" 
                                label="Fermé" 
                                checked={formData.openingHours[day as keyof typeof formData.openingHours].closed}
                                onChange={() => handleDayClosedToggle(day)}
                            />
                        </Col>
                    </Row>
                ))}
            </Card.Body>
        );
      case 4:
        return (
          <Card.Body>
            <Card.Title>Étape 4: Créez votre compte</Card.Title>
            <p className="text-muted">Ce compte vous permettra de gérer les informations de votre établissement.</p>
            <Form.Group className="mb-3">
              <Form.Label>Adresse e-mail de connexion</Form.Label>
              <Form.Control type="email" name="ownerEmail" value={formData.ownerEmail} onChange={handleInputChange} placeholder="pharmacien@email.com" required />
            </Form.Group>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Mot de passe</Form.Label>
                  <Form.Control type="password" name="password" value={formData.password} onChange={handleInputChange} required />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Confirmer le mot de passe</Form.Label>
                  <Form.Control type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange} required />
                </Form.Group>
              </Col>
            </Row>
            {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
          </Card.Body>
        );
      default:
        return null;
    }
  };

  return (
    <div className="registration-page">
      <Container>
        <Row className="justify-content-center">
          <Col lg={8} xl={7}>
            <div className="text-center mb-5">
                <h1 className="registration-title">Inscrivez votre établissement</h1>
                <p className="lead text-muted">Rejoignez notre réseau et gagnez en visibilité auprès de milliers de patients.</p>
            </div>
            <Card className="registration-card">
              <Card.Header>
                <ProgressBar now={progress} label={`${Math.round(progress)}%`} />
              </Card.Header>
              <Form onSubmit={handleSubmit}>
                {renderStep()}
                <Card.Footer className="d-flex justify-content-between align-items-center">
                  {step > 1 && <Button variant="secondary" onClick={prevStep} disabled={isLoading}>Précédent</Button>}
                  <div />
                  {step < 4 && <Button variant="primary" onClick={nextStep}>Suivant</Button>}
                  {step === 4 && 
                    <Button variant="success" type="submit" disabled={isLoading}>
                      {isLoading ? <><Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> En cours...</> : "Terminer l&apos;inscription"}
                    </Button>
                  }
                </Card.Footer>
              </Form>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}
>
        </Row>
      </Container>
    </div>
  );
}
