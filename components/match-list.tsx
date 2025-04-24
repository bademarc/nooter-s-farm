import React from 'react';

interface MatchListProps {
  category: string;
}

const MatchList: React.FC<MatchListProps> = ({ category }) => {
  // TODO: Implement Match List based on category
  console.warn(`Placeholder MatchList component rendered for category: ${category}`);
  return <div>Placeholder: Match List for {category}</div>; // Placeholder UI
};

export default MatchList; 