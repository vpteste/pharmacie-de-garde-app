'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Calendar, dateFnsLocalizer, Event as BigCalendarEvent, View } from 'react-big-calendar';
import { Modal, Button, Alert } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { fr } from 'date-fns/locale/fr';
import { enUS } from 'date-fns/locale/en-US';
import { collection, getDocs, Timestamp } from 'firebase/firestore';
import { useAuth } from '@/app/components/providers/AuthContext';
import { db } from '@/app/firebase';
import GlassCard from '@/app/components/GlassCard/GlassCard';
import CalendarToolbar from './CalendarToolbar';

import "react-big-calendar/lib/css/react-big-calendar.css";
import './CalendarManager.css';

const locales = { 'fr': fr, 'en-US': enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek: (date: Date) => startOfWeek(date, { weekStartsOn: 1 }), getDay, locales });

interface SlotInfo { start: Date; end: Date; }
interface DutyEvent extends BigCalendarEvent {
    id: string;
}

const CalendarManager = () => {
  const { t, i18n } = useTranslation();
  const { userProfile, firebaseUser } = useAuth();
  const [events, setEvents] = useState<DutyEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<SlotInfo | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<DutyEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState<View>('month');

  const dutiesRef = userProfile?.role === 'pharmacist'
    ? collection(db, "pharmacies", userProfile.uid, "duties") 
    : null;

  const fetchEvents = useCallback(async () => {
    if (!dutiesRef) { setIsLoading(false); return; }
    setIsLoading(true);
    try {
        const querySnapshot = await getDocs(dutiesRef);
        const fetchedEvents = querySnapshot.docs.map(doc => ({
            id: doc.id,
            title: t('scheduled_duty_title'), 
            start: (doc.data().start as Timestamp).toDate(), 
            end: (doc.data().end as Timestamp).toDate(),
        } as DutyEvent));
        setEvents(fetchedEvents);
    } catch (error) { console.error("Error fetching events: ", error); setError(t('error_fetching_duties')); }
    finally { setIsLoading(false); }
  }, [dutiesRef, t]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const handleSelectSlot = useCallback((slotInfo: SlotInfo) => {
    if (slotInfo.start < new Date()) return;
    setSelectedSlot(slotInfo);
    setShowAddModal(true);
  }, []);

  const handleSelectEvent = useCallback((event: DutyEvent) => {
    setSelectedEvent(event);
    setShowDeleteModal(true);
  }, []);

  const handleSaveEvent = async () => {
    if (!selectedSlot || !firebaseUser) return;
    setError(null);
    try {
        const token = await firebaseUser.getIdToken();
        const response = await fetch('/api/pro/duties', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ start: selectedSlot.start, end: selectedSlot.end })
        });
        if (!response.ok) throw new Error('Failed to save event');
        const newEvent = await response.json();
        setEvents(prev => [...prev, { ...newEvent, start: new Date(newEvent.start._seconds * 1000), end: new Date(newEvent.end._seconds * 1000), title: t('scheduled_duty_title') }]);
        setShowAddModal(false);
        setSelectedSlot(null);
    } catch (error) { console.error("Error adding event: ", error); setError(t('error_saving_duty')); }
  };

  const handleDeleteEvent = async () => {
    if (!selectedEvent || !firebaseUser) return;
    setError(null);
    try {
        const token = await firebaseUser.getIdToken();
        const response = await fetch(`/api/pro/duties?dutyId=${selectedEvent.id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Failed to delete event');
        setEvents(prev => prev.filter(event => event.id !== selectedEvent.id));
        setShowDeleteModal(false);
        setSelectedEvent(null);
    } catch (error) { console.error("Error deleting event: ", error); setError(t('error_deleting_duty')); }
  };

  return (
    <GlassCard className="calendar-glass-card">
        {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}
        {isLoading && <div className='loading-overlay'>{t('calendar_loading')}</div>}
        <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '70vh' }}
            culture={i18n.language}
            selectable
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            view={currentView}
            onView={(view) => setCurrentView(view)}
            components={{ toolbar: CalendarToolbar }}
            messages={{ next: t("next"), previous: t("previous"), today: t("today"), month: t("month"), week: t("week"), day: t("day"), agenda: t("agenda") }}
        />
        <Modal show={showAddModal} onHide={() => setShowAddModal(false)} centered dialogClassName="glass-modal">
            <Modal.Header closeButton>
                <Modal.Title>{t('confirm_slot_title')}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {selectedSlot && <p>{t('confirm_slot_body', { start: format(selectedSlot.start, 'dd/MM/yyyy HH:mm'), end: format(selectedSlot.end, 'dd/MM/yyyy HH:mm') })}</p>}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={() => setShowAddModal(false)}>{t('cancel_button')}</Button>
                <Button variant="primary" onClick={handleSaveEvent}>{t('confirm_button')}</Button>
            </Modal.Footer>
        </Modal>
        <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered dialogClassName="glass-modal">
            <Modal.Header closeButton>
                <Modal.Title>{t('delete_duty_title')}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {selectedEvent && selectedEvent.start && selectedEvent.end && <p>{t('delete_duty_body', { start: format(selectedEvent.start, 'dd/MM/yyyy HH:mm'), end: format(selectedEvent.end, 'dd/MM/yyyy HH:mm') })}</p>}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>{t('cancel_button')}</Button>
                <Button variant="danger" onClick={handleDeleteEvent}>{t('delete_button')}</Button>
            </Modal.Footer>
        </Modal>
    </GlassCard>
  );
};

export default CalendarManager;
