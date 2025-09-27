import React from 'react';
import { Button, ButtonGroup } from 'react-bootstrap';
import { ToolbarProps, Event, View } from 'react-big-calendar';
import { BsChevronLeft, BsChevronRight } from 'react-icons/bs';
import { useTranslation } from 'react-i18next';

const CalendarToolbar = <TEvent extends Event>({ label, view, views, onNavigate, onView }: ToolbarProps<TEvent>) => {
    const { t } = useTranslation();

    const viewNames: { [key: string]: string } = {
        month: t('month'),
        week: t('week'),
        day: t('day'),
        agenda: t('agenda'),
    };

    return (
        <div className="rbc-custom-toolbar">
            <div className="rbc-toolbar-left">
                <Button variant="light" onClick={() => onNavigate('PREV')} aria-label={t('previous') ?? 'Previous'}>
                    <BsChevronLeft />
                </Button>
                <Button variant="light" className="rbc-toolbar-today" onClick={() => onNavigate('TODAY')}>
                    {t('today')}
                </Button>
                <Button variant="light" onClick={() => onNavigate('NEXT')} aria-label={t('next') ?? 'Next'}>
                    <BsChevronRight />
                </Button>
            </div>
            <div className="rbc-toolbar-center">
                <span className="rbc-toolbar-label">{label}</span>
            </div>
            <div className="rbc-toolbar-right">
                <ButtonGroup>
                    {(views as string[]).map((viewName) => (
                        <Button
                            key={viewName}
                            variant={view === viewName ? 'primary' : 'light'}
                            onClick={() => onView(viewName as View)}
                        >
                            {viewNames[viewName]}
                        </Button>
                    ))}
                </ButtonGroup>
            </div>
        </div>
    );
};

export default CalendarToolbar;