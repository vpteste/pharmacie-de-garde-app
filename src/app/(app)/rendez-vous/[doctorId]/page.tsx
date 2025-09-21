'use client';
import React from 'react';
import { useParams } from 'next/navigation';
import '../../../components/RendezVous/RendezVous.css';

// On doit recréer les données ici pour que la page dynamique puisse les trouver
// Idéalement, ces données viendraient d'une base de données via un appel API
const mockDoctors = [
  { id: '1', name: 'Amina Diallo', specialty: 'Cardiologue', address: 'Clinique La Providence, Cocody, Abidjan', avatarUrl: 'https://i.pravatar.cc/150?img=1' },
  { id: '2', name: 'Koffi Martin', specialty: 'Pédiatre', address: 'Hôpital Mère-Enfant, Bingerville', avatarUrl: 'https://i.pravatar.cc/150?img=2' },
  { id: '3', name: 'Fatou Bamba', specialty: 'Dermatologue', address: 'Centre Médical Le Plateau, Abidjan', avatarUrl: 'https://i.pravatar.cc/150?img=3' },
  { id: '4', name: 'Yao N\'Guessan', specialty: 'Médecin Généraliste', address: 'Cabinet Médical Les 2 Plateaux, Abidjan', avatarUrl: 'https://i.pravatar.cc/150?img=4' },
];

const Calendar = () => {
    const days = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
    const dates = Array.from({ length: 31 }, (_, i) => i + 1);
    const availableSlots = [10, 12, 15, 18, 25]; // Jours disponibles simulés

    return (
        <div className="calendar-container">
            <h4>Disponibilités en Octobre</h4>
            <div className="calendar-grid">
                {days.map((day, index) => <div key={index} className="calendar-header">{day}</div>)}
                {dates.map(date => (
                    <div key={date} className={`calendar-day ${availableSlots.includes(date) ? 'available' : ''}`}>
                        {date}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function DoctorDetailPage() {
  const params = useParams();
  const doctorId = params.doctorId as string;
  const doctor = mockDoctors.find(d => d.id === doctorId);

  if (!doctor) {
    return <div className="rv-container"><h1>Médecin non trouvé</h1></div>;
  }

  return (
    <div className="rv-container">
      <div className="detail-header">
        <Image src={doctor.avatarUrl} alt={`Dr. ${doctor.name}`} className="detail-avatar" width={100} height={100} />
        <div className="detail-title">
          <h2 className="doctor-name">Dr. {doctor.name}</h2>
          <p className="doctor-specialty">{doctor.specialty}</p>
        </div>
      </div>
      <div>
        <p><strong>Adresse :</strong> {doctor.address}</p>
        {/* Une future bio du médecin pourrait aller ici */}
      </div>

      <Calendar />

      <button style={{width: '100%', padding: '15px', marginTop: '30px', background: '#3fc17a', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1.1rem', cursor: 'not-allowed'}} disabled>
        Demander un rendez-vous (Bientôt disponible)
      </button>
    </div>
  );
}
);
}
