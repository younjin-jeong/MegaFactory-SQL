import { create } from "zustand";

interface WebSocketStore {
  isConnected: boolean;
  subscribedTopics: string[];
  setConnected: (connected: boolean) => void;
  addTopic: (topic: string) => void;
  removeTopic: (topic: string) => void;
}

export const useWebSocketStore = create<WebSocketStore>()((set, get) => ({
  isConnected: false,
  subscribedTopics: [],
  setConnected: (connected) => set({ isConnected: connected }),
  addTopic: (topic) => {
    const { subscribedTopics } = get();
    if (!subscribedTopics.includes(topic)) {
      set({ subscribedTopics: [...subscribedTopics, topic] });
    }
  },
  removeTopic: (topic) => {
    set({
      subscribedTopics: get().subscribedTopics.filter((t) => t !== topic),
    });
  },
}));
