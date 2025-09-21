'use client';
import { useState, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import { fr } from 'date-fns/locale';
import { useState, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import { fr } from 'date-fns/locale';
import { doc, setDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../../../../firebase';
import { useAuth } from '../../AuthContext';
import { Button, Spinner, Alert, Popover, OverlayTrigger } from 'react-bootstrap';
import 'react-day-picker/dist/style.css';
import './gardes.css';

type GardeStatus = 'jour' | 'nuit' | 'jour_nuit' | 'aucune';

export default function GardesPage() {
    const { user } = useAuth();
    const [gardes, setGardes] = useState<Record<string, GardeStatus>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedDay, setSelectedDay] = useState<Date | undefined>();
    const [currentMonth, setCurrentMonth] = useState(new Date());

    useEffect(() => {
        if (!user) return;

        const fetchGardes = async () => {
            setIsLoading(true);
            try {
                const gardesCollectionRef = collection(db, `pharmacies/${user.uid}/schedules`);
                const querySnapshot = await getDocs(gardesCollectionRef);
                const fetchedGardes: Record<string, GardeStatus> = {};
                querySnapshot.forEach((doc) => {
                    fetchedGardes[doc.id] = doc.data().status;
                });
                setGardes(fetchedGardes);
            } catch (err) {
                console.error(err);
                setError("Impossible de charger le calendrier des gardes.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchGardes();
    }, [user]);

    const handleDayClick = (day: Date) => {
        setSelectedDay(day);
    };

    const updateGardeStatus = async (date: Date, status: GardeStatus) => {
        if (!user) return;
        const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD
        
        try {
            const gardeDocRef = doc(db, `pharmacies/${user.uid}/schedules`, dateString);
            await setDoc(gardeDocRef, { status: status });
            setGardes(prev => ({ ...prev, [dateString]: status }));
            setSelectedDay(undefined); // Close popover
        } catch (err) {
            console.error(err);
            alert("Erreur lors de la mise à jour du statut.");
        }
    };

    const modifiers = {
        jour: (date: Date) => gardes[date.toISOString().split('T')[0]] === 'jour',
        nuit: (date: Date) => gardes[date.toISOString().split('T')[0]] === 'nuit',
        jour_nuit: (date: Date) => gardes[date.toISOString().split('T')[0]] === 'jour_nuit',
    };

    const modifiersClassNames = {
        jour: 'garde-jour',
        nuit: 'garde-nuit',
        jour_nuit: 'garde-jour-nuit',
    };

    const DayContentWithPopover = (props: { date: Date; children: React.ReactNode }) => {
        const date = props.date;
        const popover = (
            <Popover id={`popover-${date.toISOString()}`}>
                <Popover.Header as="h3">Modifier la garde</Popover.Header>
                <Popover.Body>
                    <p>Statut pour le {date.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    <div className="d-grid gap-2">
                        <Button variant="outline-success" size="sm" onClick={() => updateGardeStatus(date, 'jour')}>Jour</Button>
                        <Button variant="outline-primary" size="sm" onClick={() => updateGardeStatus(date, 'nuit')}>Nuit</Button>
                        <Button variant="outline-info" size="sm" onClick={() => updateGardeStatus(date, 'jour_nuit')}>Jour & Nuit</Button>
                        <Button variant="outline-secondary" size="sm" onClick={() => updateGardeStatus(date, 'aucune')}>Aucune</Button>
                    </div>
                </Popover.Body>
            </Popover>
        );

        return (
            <OverlayTrigger trigger="click" placement="right" overlay={popover} rootClose>
                <div className="day-content-wrapper">{props.children}</div>
            </OverlayTrigger>
        );
    };

    if (isLoading) {
        return <Spinner animation="border" />;
    }

    if (error) {
        return <Alert variant="danger">{error}</Alert>;
    }

    return (
        <div>
            <h1>Gestion de mes gardes</h1>
            <p>Cliquez sur une date pour définir ou modifier son statut de garde.</p>
            <div className="calendar-container">
                <DayPicker
                    locale={fr}
                    mode="single"
                    selected={selectedDay}
                    onSelect={setSelectedDay}
                    onDayClick={handleDayClick}
                    month={currentMonth}
                    onMonthChange={setCurrentMonth}
                    modifiers={modifiers}
                    modifiersClassNames={modifiersClassNames}
                    components={{
                        DayContent: DayContentWithPopover
                    }}
                />
            </div>
        </div>
    );
}
