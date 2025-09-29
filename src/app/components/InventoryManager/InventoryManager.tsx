'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, Form, Button, Row, Col, ListGroup, Spinner, Badge, Alert } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/app/components/providers/AuthContext';
// import { useDebounce } from '@/hooks/useDebounce'; // No longer needed



interface InventoryItem {
    id: string;
    name: string;
    price: number;
    stock: number;
    threshold?: number;
}

const StockBadge = ({ stock, threshold }: { stock: number, threshold?: number }) => {
    const { t } = useTranslation();
    let bg = 'success';
    let label = t('stock_in_stock');

    if (stock === 0) {
        bg = 'danger';
        label = t('stock_out_of_stock');
    } else if (threshold && stock <= threshold) {
        bg = 'warning';
        label = t('stock_low_stock');
    }

    return <Badge bg={bg}>{label}</Badge>;
};

const InventoryManager = () => {
    const { t } = useTranslation();
    const { firebaseUser } = useAuth();

    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [searchTerm, setSearchTerm] = useState('');
    
    const [price, setPrice] = useState('');
    const [stock, setStock] = useState('');
    const [threshold, setThreshold] = useState('');
    
    const [isLoadingInventory, setIsLoadingInventory] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchInventory = useCallback(async () => {
        if (!firebaseUser) return;
        setIsLoadingInventory(true);
        try {
            const token = await firebaseUser.getIdToken();
            const response = await fetch('/api/pro/inventory', {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!response.ok) throw new Error('Failed to fetch inventory');
            const data = await response.json();
            setInventory(data.inventory);
        } catch {
            setError(t('error_fetching_inventory'));
        } finally {
            setIsLoadingInventory(false);
        }
    }, [firebaseUser, t]);

    useEffect(() => {
        fetchInventory();
    }, [fetchInventory]);

    const resetForm = () => {
        setSearchTerm('');
        setPrice('');
        setStock('');
        setThreshold('');
    };

    const handleAddToInventory = async (e: React.FormEvent) => {
        e.preventDefault();
        // Simplified logic: use search term as medication name
        if (!searchTerm || !price || stock === '' || !firebaseUser) return;

        setIsSubmitting(true);
        setError(null);
        try {
            const token = await firebaseUser.getIdToken();
            const response = await fetch('/api/pro/inventory', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    medicationId: searchTerm.toLowerCase().replace(/\s/g, '-'), // Create an ID from name
                    medicationName: searchTerm,
                    price: parseFloat(price),
                    stock: parseInt(stock, 10),
                    threshold: threshold ? parseInt(threshold, 10) : null
                })
            });

            if (!response.ok) throw new Error('Failed to add to inventory');
            
            resetForm();
            await fetchInventory();

        } catch {
            setError(t('error_adding_inventory'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (medicationId: string) => {
        if (!firebaseUser) return;
        setError(null);
        try {
            const token = await firebaseUser.getIdToken();
            await fetch(`/api/pro/inventory?medicationId=${medicationId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            await fetchInventory();
        } catch {
            setError(t('error_deleting_inventory'));
        }
    };

    return (
        <div>
            {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}
            <p className="text-muted">{t('inventory_management_subtitle')}</p>
            <Row>
                <Col md={6} className="mb-4 mb-md-0">
                    <Card><Card.Body>
                        <Card.Title>{t('add_medication_title')}</Card.Title>
                        <Form onSubmit={handleAddToInventory}>
                            <Form.Group className="mb-3" controlId="medicationSearch">
                                <Form.Label>{t('search_medication_label')}</Form.Label>
                                <Form.Control type="text" placeholder={t('medication_search_placeholder')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} required />
                            </Form.Group>
                            <Row>
                                <Col sm={6}>
                                    <Form.Group className="mb-3" controlId="price"><Form.Label>{t('price_label')}</Form.Label><Form.Control type="number" step="0.01" placeholder="12.99" value={price} onChange={(e) => setPrice(e.target.value)} required /></Form.Group>
                                </Col>
                                <Col sm={6}>
                                    <Form.Group className="mb-3" controlId="stock"><Form.Label>Quantité en stock</Form.Label><Form.Control type="number" placeholder="Ex: 50" value={stock} onChange={(e) => setStock(e.target.value)} required /></Form.Group>
                                </Col>
                            </Row>
                            <Form.Group className="mb-3" controlId="threshold"><Form.Label>Seuil d&apos;alerte stock bas (optionnel)</Form.Label><Form.Control type="number" placeholder="Ex: 10" value={threshold} onChange={(e) => setThreshold(e.target.value)} /></Form.Group>
                            <Button variant="primary" type="submit" disabled={isSubmitting || !searchTerm}>{isSubmitting ? <Spinner as="span" animation="border" size="sm" /> : t('add_to_inventory_button')}</Button>
                        </Form>
                    </Card.Body></Card>
                </Col>
                <Col md={6}>
                     <Card><Card.Body>
                        <Card.Title>{t('current_inventory_title')}</Card.Title>
                        {isLoadingInventory ? (
                            <div className="text-center p-4"><Spinner animation="border" /></div>
                        ) : inventory.length === 0 ? (
                            <p className="text-center text-muted mt-3">{t('inventory_list_placeholder')}</p>
                        ) : (
                            <ListGroup variant="flush">
                                {inventory.map(item => (
                                    <ListGroup.Item key={item.id} className="d-flex justify-content-between align-items-center">
                                        <div>
                                            <div className="fw-bold">{item.name}</div>
                                            <small className="text-muted">{item.price.toFixed(2)} € - Stock: {item.stock}</small>
                                            {item.threshold && <small className="d-block text-info">Seuil: {item.threshold}</small>}
                                        </div>
                                        <div className="d-flex align-items-center">
                                            <StockBadge stock={item.stock} threshold={item.threshold} />
                                            <Button variant="outline-danger" size="sm" className="ms-3" onClick={() => handleDelete(item.id)}>{t('delete_button')}</Button>
                                        </div>
                                    </ListGroup.Item>
                                ))}
                            </ListGroup>
                        )}
                    </Card.Body></Card>
                </Col>
            </Row>
        </div>
    );
};

export default InventoryManager;
