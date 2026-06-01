import { create } from 'zustand';

import { chatMessages, fanRooms, leaderboardEntries, matches, products, restaurants, teams, watchLinks } from '@/src/data/mock';
import { ChatMessage, FanRoom, LeaderboardEntry, Match, Product, Restaurant, Team, WatchLink } from '@/src/domain/models';
import { DataMode } from '@/src/services/contracts';

type Snapshot = {
  teams: Team[];
  matches: Match[];
  watchLinks: WatchLink[];
  leaderboardEntries: LeaderboardEntry[];
  fanRooms: FanRoom[];
  chatMessages: ChatMessage[];
  restaurants: Restaurant[];
  products: Product[];
  predictionCount: number;
};

type AppDataState = Snapshot & {
  mode: DataMode;
  status: 'idle' | 'loading' | 'ready' | 'error';
  revision: number;
  errorMessage: string | null;
  setMode: (mode: DataMode) => void;
  setStatus: (status: AppDataState['status']) => void;
  setError: (message: string | null) => void;
  applySnapshot: (snapshot: Partial<Snapshot>) => void;
  upsertChatMessage: (message: ChatMessage) => void;
  removeChatMessage: (messageId: string) => void;
  resetToMock: () => void;
};

const initialSnapshot: Snapshot = {
  teams,
  matches,
  watchLinks,
  leaderboardEntries,
  fanRooms,
  chatMessages,
  restaurants,
  products,
  predictionCount: 184,
};

export const useAppDataStore = create<AppDataState>((set) => ({
  ...initialSnapshot,
  mode: 'mock',
  status: 'idle',
  revision: 0,
  errorMessage: null,
  setMode: (mode) => set((state) => ({ mode, revision: state.revision + 1 })),
  setStatus: (status) => set({ status }),
  setError: (message) => set((state) => ({ errorMessage: message, status: message ? 'error' : state.status, revision: state.revision + 1 })),
  applySnapshot: (snapshot) =>
    set((state) => ({
      ...snapshot,
      status: 'ready',
      errorMessage: null,
      revision: state.revision + 1,
    })),
  upsertChatMessage: (message) =>
    set((state) => {
      const existing = state.chatMessages.findIndex((entry) => entry.id === message.id);
      const chatMessages = [...state.chatMessages];

      if (existing >= 0) {
        chatMessages[existing] = message;
      } else {
        chatMessages.push(message);
      }

      chatMessages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      return { chatMessages, revision: state.revision + 1 };
    }),
  removeChatMessage: (messageId) =>
    set((state) => ({
      chatMessages: state.chatMessages.filter((message) => message.id !== messageId),
      revision: state.revision + 1,
    })),
  resetToMock: () => set((state) => ({ ...initialSnapshot, mode: 'mock', status: 'ready', errorMessage: null, revision: state.revision + 1 })),
}));