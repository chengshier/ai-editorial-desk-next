import type { ChatSnapshot } from '@deepseek-ai/dsh-client-runtime/client'

declare module '@deepseek-ai/dsh-client-runtime/client' {
  /**
   * exact-pin `99f6f02...` declares the merge-extensible
   * `ConversationViewSnapshotMap` in client-runtime itself. The stock Chat
   * target already exists at runtime, but its declaration merge is not pulled
   * into this out-of-tree spike's TypeScript program, so record that existing
   * target here for a type-safe `snapshot.views.get('chat')` read.
   */
  interface ConversationViewSnapshotMap {
    chat: ChatSnapshot
  }
}
