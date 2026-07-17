"use client";

import { Chat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useAppStore } from "@/store/useAppStore";
import type { AppUIMessage } from "@/types";

/**
 * Module-level chat session. useChat's default state lives inside the
 * component, so navigating to another tab unmounted the assistant page and
 * erased the conversation. Hoisting the Chat instance to module scope keeps
 * messages alive for the whole browser session — you can check a transaction
 * on another tab and come back to the answer. Created lazily (not at import
 * time) so nothing runs during SSR module evaluation.
 *
 * Deliberately NOT persisted to localStorage: a financial answer surviving a
 * reload could be grounded in a snapshot that no longer matches the store.
 */
let chatSession: Chat<AppUIMessage> | null = null;

export function getChatSession(): Chat<AppUIMessage> {
  if (!chatSession) {
    chatSession = new Chat<AppUIMessage>({
      transport: new DefaultChatTransport({
        api: "/api/chat",
        // body is a function so each request snapshots the store at send
        // time. getState() reads outside React — no subscription needed.
        body: () => {
          const { balance, threshold, creditScore, transactions } =
            useAppStore.getState();
          return {
            financialContext: { balance, threshold, creditScore, transactions },
          };
        },
      }),
      // Mirror the server pipeline's lifecycle into the Zustand state engine
      onData: (part) => {
        if (part.type === "data-agent-trace") {
          useAppStore.getState().setRoutingState(part.data.stage);
        }
      },
      onFinish: () => useAppStore.getState().setRoutingState("idle"),
      onError: () => useAppStore.getState().setRoutingState("idle"),
    });
  }
  return chatSession;
}

/** Wipes the conversation (dev-panel "Reset demo state"). Clears messages on
 *  the live instance so a mounted assistant page empties immediately. */
export function resetChatSession(): void {
  if (chatSession) {
    chatSession.messages = [];
  }
}
