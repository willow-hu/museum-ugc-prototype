import { ContentItem, ModeType, ChatMessage, NarrativeState } from '../types';
import { getUserAvatar } from '../data';

/**
 * SessionStore
 * explicitly separates storage for the 4 distinct modes.
 */
class SessionStore {
  // Current User Profile (Mock)
  private currentUser = {
    name: '我',
    avatarUrl: getUserAvatar('我')
  };

  // 1. Comment Board Storage (Key: artifactId)
  private commentBoardData: Map<string, ContentItem[]> = new Map();

  // 2. Crowd Chat Storage (Key: artifactId)
  private crowdChatData: Map<string, ContentItem[]> = new Map();

  // 3. Follow Me Storage (Key: 'global' - single instance)
  private followMeState: NarrativeState | null = null;

  // 4. Collective Story Storage (Key: 'global' - single instance)
  private collectiveStoryState: NarrativeState | null = null;

  // --- User Methods ---
  getCurrentUser() {
    return this.currentUser;
  }

  // --- Comment Board Methods ---
  addComment(artifactId: string, item: ContentItem) {
    // Inject current user avatar if not present
    if (!item.avatarUrl) {
      item.avatarUrl = this.currentUser.avatarUrl;
    }
    const current = this.commentBoardData.get(artifactId) || [];
    this.commentBoardData.set(artifactId, [item, ...current]); 
  }

  getComments(artifactId: string): ContentItem[] {
    return this.commentBoardData.get(artifactId) || [];
  }

  // --- Crowd Chat Methods ---
  addChatMessage(artifactId: string, item: ContentItem) {
    // Inject current user avatar if not present
    if (!item.avatarUrl) {
      item.avatarUrl = this.currentUser.avatarUrl;
    }
    const current = this.crowdChatData.get(artifactId) || [];
    this.crowdChatData.set(artifactId, [...current, item]);
  }

  getChatMessages(artifactId: string): ContentItem[] {
    return this.crowdChatData.get(artifactId) || [];
  }

  // --- Follow Me Methods ---
  saveFollowMeState(state: NarrativeState) {
    this.followMeState = state;
  }

  getFollowMeState(): NarrativeState | undefined {
    return this.followMeState || undefined;
  }

  // --- Collective Story Methods ---
  saveCollectiveStoryState(state: NarrativeState) {
    this.collectiveStoryState = state;
  }

  getCollectiveStoryState(): NarrativeState | undefined {
    return this.collectiveStoryState || undefined;
  }
}

export const sessionStore = new SessionStore();