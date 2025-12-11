import { render, screen } from '@testing-library/react';
import App from './App';

// Mock Vercel Speed Insights
jest.mock('@vercel/speed-insights/react', () => ({
  SpeedInsights: () => null,
}), { virtual: true });

test('renders inventory dashboard login screen', () => {
  render(<App />);
  const headerElement = screen.getByText(/Inventory Dashboard/i);
  expect(headerElement).toBeInTheDocument();
});
