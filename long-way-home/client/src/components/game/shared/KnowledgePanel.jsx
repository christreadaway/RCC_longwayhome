import { useState, useEffect, useMemo } from 'react';
import { useGameState, useGameDispatch } from '../../../store/GameContext';
import knowledgePanelData from '../../../data/knowledge-panel.json';
import knowledgePanel35 from '../../../data/knowledge-panel-3-5.json';

export default function KnowledgePanel({ currentLandmark, lastEvent, gradeBand }) {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const [selectedCard, setSelectedCard] = useState(null);

  if (gradeBand === 'k2') return null;

  const cards = gradeBand === '3_5' ? knowledgePanel35.cards : knowledgePanelData.cards;

  const availableCards = useMemo(() => {
    return cards.filter(card => {
      // Match by landmark
      if (currentLandmark && card.trigger_landmarks?.includes(currentLandmark.id)) return true;
      // Match by last event
      if (lastEvent && card.trigger_events?.includes(lastEvent.type)) return true;
      return false;
    });
  }, [currentLandmark, lastEvent, cards]);

  if (availableCards.length === 0) return null;

  function handleOpenCard(card) {
    setSelectedCard(card);
    dispatch({ type: 'READ_KNOWLEDGE_CARD', cardId: card.id });
  }

  return (
    <div className="space-y-2">
      {/* Card indicators */}
      {!selectedCard && availableCards.map(card => (
        <button
          key={card.id}
          onClick={() => handleOpenCard(card)}
          className={`w-full text-left p-3 rounded-lg border transition-all ${
            state.knowledgeCardsRead.includes(card.id)
              ? 'border-gray-200 bg-gray-50'
              : 'border-trail-gold bg-trail-gold/10 knowledge-pulse'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="text-trail-gold text-lg">&#128214;</span>
            <div>
              <div className="text-sm font-semibold text-trail-darkBrown">{card.title}</div>
              <div className="text-xs text-trail-brown">Historical Knowledge</div>
            </div>
          </div>
        </button>
      ))}

      {/* Open card */}
      {selectedCard && (
        <div className="card-parchment">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-bold text-trail-darkBrown">{selectedCard.title}</h3>
            <button
              onClick={() => setSelectedCard(null)}
              className="text-gray-400 hover:text-gray-600 text-lg leading-none"
            >
              &times;
            </button>
          </div>
          <p className="text-trail-darkBrown text-sm leading-relaxed mb-3">
            {selectedCard.body}
          </p>
          {selectedCard.sources && selectedCard.sources.length > 0 && (
            <div className="text-xs text-trail-brown/60">
              Sources: {selectedCard.sources.join(', ')}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
