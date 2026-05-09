import { AppMode } from '../../shared/api';
import type { AppModeProcessor } from './AppModeProcessor';
import { LeetCodeProcessor } from './LeetCodeProcessor';
import { LiveInterviewProcessor } from './LiveInterviewProcessor';

export class AppModeProcessorFactory {
  private static instance: AppModeProcessorFactory;
  private processors: Map<AppMode, AppModeProcessor> = new Map();

  private constructor() {
    // Initialize processors
    this.processors.set(AppMode.LIVE_INTERVIEW, new LiveInterviewProcessor());
    this.processors.set(AppMode.LEETCODE_SOLVER, new LeetCodeProcessor());
  }

  public static getInstance(): AppModeProcessorFactory {
    if (!AppModeProcessorFactory.instance) {
      AppModeProcessorFactory.instance = new AppModeProcessorFactory();
    }

    return AppModeProcessorFactory.instance;
  }

  public getProcessor(appMode: AppMode): AppModeProcessor {
    const processor = this.processors.get(appMode);
    const fallback = this.processors.get(AppMode.LIVE_INTERVIEW);

    if (!processor) {
      console.warn(`No processor found for app mode: ${appMode}, falling back to LIVE_INTERVIEW`);

      return fallback!;
    }

    return processor;
  }

  // Method to register new processors dynamically (for future extensibility)
  public registerProcessor(appMode: AppMode, processor: AppModeProcessor): void {
    this.processors.set(appMode, processor);
  }
}
