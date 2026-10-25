import React from 'react';
import { render, screen } from '@testing-library/react';

// Composant de test pour la validation du module E-Commerce EduMarket
interface CourseCardProps {
  id: number;
  title: string;
  price: number;
  currency: string;
  onAddToCart?: (id: number) => void;
}

const CourseCard: React.FC<CourseCardProps> = ({ id, title, price, currency, onAddToCart }) => (
  <div data-testid={`course-card-${id}`} className="course-card p-4 border rounded shadow">
    <h3 className="font-bold text-lg">{title}</h3>
    <div className="price-tag font-semibold text-emerald-600 mt-2">
      {price.toFixed(2)} {currency}
    </div>
    <button
      onClick={() => onAddToCart && onAddToCart(id)}
      className="mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
    >
      Commander cette formation
    </button>
  </div>
);

describe('EduMarket E-Commerce Frontend Tests', () => {
  test('Affiche correctement la fiche formation avec son prix et devise', () => {
    render(
      <CourseCard
        id={101}
        title="Architecture Logicielle & Microservices"
        price={79.99}
        currency="EUR"
      />
    );

    expect(screen.getByText('Architecture Logicielle & Microservices')).toBeInTheDocument();
    expect(screen.getByText('79.99 EUR')).toBeInTheDocument();
    expect(screen.getByText('Commander cette formation')).toBeInTheDocument();
  });

  test('Déclenche l action d ajout au panier lors du clic sur Commander', () => {
    const handleAddToCart = jest.fn();
    render(
      <CourseCard
        id={102}
        title="Cloud DevOps & Conteneurisation Docker"
        price={49.99}
        currency="EUR"
        onAddToCart={handleAddToCart}
      />
    );

    const button = screen.getByText('Commander cette formation');
    button.click();

    expect(handleAddToCart).toHaveBeenCalledTimes(1);
    expect(handleAddToCart).toHaveBeenCalledWith(102);
  });
});
