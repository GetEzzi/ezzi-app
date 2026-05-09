import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import type {
  DebugResponse,
  LeetCodeDebugResponse,
  LeetCodeSolveResponse,
  SolveResponse,
} from '../../shared/api';
import { SolutionProvider, useSolutionContext } from './SolutionContext';

function wrapper({ children }: { children: ReactNode }) {
  return <SolutionProvider>{children}</SolutionProvider>;
}

const solve: SolveResponse = {
  thoughts: ['t'],
  code: 'print(1)',
  time_complexity: 'O(1)',
  space_complexity: 'O(1)',
  problem_statement: 'p',
  conversationId: 'c',
};

const debug: DebugResponse = {
  code: 'fixed',
  thoughts: ['t'],
  time_complexity: 'O(n)',
  space_complexity: 'O(n)',
  conversationId: 'c',
};

const leetSolve: LeetCodeSolveResponse = { code: 'class', conversationId: 'c' };
const leetDebug: LeetCodeDebugResponse = { code: 'fixed-leet', conversationId: 'c' };

describe('SolutionContext', () => {
  describe('setSolution', () => {
    test('WHEN setSolution is called with SolveResponse THEN state.solution is set', () => {
      const { result } = renderHook(() => useSolutionContext(), { wrapper });

      // Act
      act(() => result.current.setSolution(solve));

      // Assert
      expect(result.current.state.solution).toEqual(solve);
    });

    test('WHEN setSolution is called with LeetCodeSolveResponse THEN state.solution is set', () => {
      const { result } = renderHook(() => useSolutionContext(), { wrapper });

      // Act
      act(() => result.current.setSolution(leetSolve));

      // Assert
      expect(result.current.state.solution).toEqual(leetSolve);
    });
  });

  describe('setNewSolution', () => {
    test('WHEN setNewSolution is called with DebugResponse THEN state.newSolution is set', () => {
      const { result } = renderHook(() => useSolutionContext(), { wrapper });

      // Act
      act(() => result.current.setNewSolution(debug));

      // Assert
      expect(result.current.state.newSolution).toEqual(debug);
    });

    test('WHEN setNewSolution is called with LeetCodeDebugResponse THEN state.newSolution is set', () => {
      const { result } = renderHook(() => useSolutionContext(), { wrapper });

      // Act
      act(() => result.current.setNewSolution(leetDebug));

      // Assert
      expect(result.current.state.newSolution).toEqual(leetDebug);
    });
  });

  describe('clearSolution', () => {
    test('WHEN clearSolution is called THEN state.solution becomes null', () => {
      const { result } = renderHook(() => useSolutionContext(), { wrapper });
      act(() => result.current.setSolution(solve));

      // Act
      act(() => result.current.clearSolution());

      // Assert
      expect(result.current.state.solution).toBeNull();
    });
  });

  describe('clearNewSolution', () => {
    test('WHEN clearNewSolution is called THEN state.newSolution becomes null', () => {
      const { result } = renderHook(() => useSolutionContext(), { wrapper });
      act(() => result.current.setNewSolution(debug));

      // Act
      act(() => result.current.clearNewSolution());

      // Assert
      expect(result.current.state.newSolution).toBeNull();
    });
  });

  describe('clearAll', () => {
    test('WHEN clearAll is called THEN both solution and newSolution become null', () => {
      const { result } = renderHook(() => useSolutionContext(), { wrapper });
      act(() => {
        result.current.setSolution(solve);
        result.current.setNewSolution(debug);
      });

      // Act
      act(() => result.current.clearAll());

      // Assert
      expect(result.current.state).toEqual({ solution: null, newSolution: null });
    });
  });
});
