import HowToWireTutorial from '@components/SchematicPanel/HowToWireTutorial';
import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('HowToWireTutorial', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <HowToWireTutorial tutorialOpen={true} setTutorialOpen={() => {}} />,
    );
    expect(container).toBeInTheDocument();
  });
});
