'use client';
import { OverlayView } from '@react-google-maps/api';
import './BlinkingMarker.css';

interface BlinkingMarkerProps {
    lat: number;
    lng: number;
    onClick: () => void;
}

const BlinkingMarker = ({ lat, lng, onClick }: BlinkingMarkerProps) => {
    return (
        <OverlayView
            position={{ lat, lng }}
            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
        >
            <div className="blinking-marker-container" onClick={onClick}>
                <div className="blinking-marker-pulse"></div>
                <div className="blinking-marker-dot"></div>
            </div>
        </OverlayView>
    );
};

export default BlinkingMarker;
