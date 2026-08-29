import type { components } from './core-types.generated';

export type SpeciesResult = components['schemas']['Species'];
export type GeneResult = components['schemas']['Gene'];
export type RunRequest = components['schemas']['RunRequest'];
export type RunResult = components['schemas']['RunResult'];
export type StartRunResponse = components['schemas']['StartRunResponse'];

export class CoreApiError extends Error {
  constructor(message: string, public readonly status: number, public readonly code?: string) {
    super(message);
    this.name = 'CoreApiError';
  }
}

interface ClerkWindow {
  Clerk?: {
    user?: {
      id?: string;
      fullName?: string;
      username?: string;
      primaryEmailAddress?: { emailAddress?: string };
      imageUrl?: string;
    };
    session?: {
      getToken: () => Promise<string | null>;
    };
  };
}

export async function shellApi<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);

  // Automatically attach Clerk session headers if available in browser context
  if (typeof window !== 'undefined') {
    const clerk = (window as unknown as ClerkWindow).Clerk;
    if (clerk?.user?.id) {
      if (!headers.has('x-clerk-user-id')) headers.set('x-clerk-user-id', clerk.user.id);
      const name = clerk.user.fullName || clerk.user.username;
      if (name && !headers.has('x-clerk-user-name')) headers.set('x-clerk-user-name', name);
      if (clerk.user.primaryEmailAddress?.emailAddress && !headers.has('x-clerk-user-email')) {
        headers.set('x-clerk-user-email', clerk.user.primaryEmailAddress.emailAddress);
      }
      if (clerk.user.imageUrl && !headers.has('x-clerk-user-avatar')) headers.set('x-clerk-user-avatar', clerk.user.imageUrl);

      // Attach token if session exists
      try {
        const token = await clerk.session?.getToken();
        if (token && !headers.has('Authorization')) {
          headers.set('Authorization', `Bearer ${token}`);
        }
      } catch {
        // Token retrieval failure shouldn't block request if headers are set
      }
    }
  }

  let response: Response;
  try {
    response = await fetch(path, { credentials: 'same-origin', ...init, headers });
  } catch {
    throw new CoreApiError('Relict Shell could not reach the backend service.', 0, 'unreachable');
  }

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string; message?: string; code?: string } | null;
    throw new CoreApiError(
      payload?.error ?? payload?.message ?? `Request failed (${response.status})`,
      response.status,
      payload?.code,
    );
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export async function logoutBackend(): Promise<void> {
  try {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
  } catch {
    // Ignore network error on logout
  }
}

export function getSpecies(query: string): Promise<SpeciesResult[]> {
  return shellApi(`/api/core/v1/search/species?q=${encodeURIComponent(query)}`);
}

export function getGenes(query: string, species: string): Promise<GeneResult[]> {
  return shellApi(`/api/core/v1/search/genes?q=${encodeURIComponent(query)}&species=${encodeURIComponent(species)}`);
}

export function startRun(
  request: RunRequest & { projectId: string },
): Promise<StartRunResponse & { localRunId?: string; coreRunId?: string }> {
  return shellApi('/api/core/v1/runs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
}

export function getRun(runId: string): Promise<RunResult> {
  return shellApi(`/api/core/v1/runs/${encodeURIComponent(runId)}`);
}

export interface RunStreamHandlers {
  onEvent?: (payload: unknown, type: string) => void;
  onMessage?: (payload: unknown) => void;
  onError?: (error: Error) => void;
  onComplete?: () => void;
}

const EVENT_NAMES = ['node_added', 'edge_scored', 'strategy_ready', 'run_complete'] as const;

export function openRunStream(runId: string, handlers: RunStreamHandlers): () => void {
  const stream = new EventSource(`/api/core/v1/runs/${encodeURIComponent(runId)}/stream`, { withCredentials: true });

  const listeners = EVENT_NAMES.map((type) => {
    const listener = (event: MessageEvent<string>) => {
      try {
        const payload: unknown = JSON.parse(event.data);
        handlers.onEvent?.(payload, type);
        handlers.onMessage?.(payload);
        if (type === 'run_complete') {
          handlers.onComplete?.();
          stream.close();
        }
      } catch {
        handlers.onError?.(new Error(`Core sent malformed ${type} event data.`));
      }
    };
    stream.addEventListener(type, listener as EventListener);
    return [type, listener] as const;
  });

  stream.onerror = () => {
    handlers.onError?.(new Error('The Core event stream was interrupted.'));
    stream.close();
  };

  return () => {
    for (const [type, listener] of listeners) stream.removeEventListener(type, listener as EventListener);
    stream.close();
  };
}
