import type { ChatSnapshot } from '@deepseek-ai/dsh-client-runtime/client'

declare module '@deepseek-ai/dsh-client-ui-conversation/client' {
  /**
   * exact-pin `99f6f02...` keeps the stock Chat snapshot type in client-runtime,
   * while the merge-extensible ConversationViewSnapshotMap is declared by
   * ui-conversation. The stock package does not expose this augmentation to
   * out-of-tree client plugins through its public type surface, so the spike
   * records the already-existing `chat` target here for type-safe reads.
   */
  interface ConversationViewSnapshotMap {
    chat: ChatSnapshot
  }
}
