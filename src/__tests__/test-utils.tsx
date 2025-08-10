import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';
import { ToastProvider } from '../components/ui/toast';
import { ToastContext } from '../contexts/toast';

type CustomRenderOptions = Omit<RenderOptions, 'wrapper'>;

export function renderWithProviders(
  ui: ReactElement,
  options: CustomRenderOptions = {},
) {
  const mockToastContext = {
    showToast: jest.fn(),
  };

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <ToastContext.Provider value={mockToastContext}>
        <ToastProvider>{children}</ToastProvider>
      </ToastContext.Provider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...options });
}

export * from '@testing-library/react';
export { renderWithProviders as render };
