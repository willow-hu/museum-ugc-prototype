import { Artifact, ContentItem, ModeType } from './types';

// Data container, initially empty
let ARTIFACT_DATA: { 
  metadata: any, 
  ugc_content: any, 
  tour_route: Array<{id: string, transition_text?: { follow_me?: string, collective_story?: string }}> 
} = { metadata: {}, ugc_content: {}, tour_route: [] };

// --- MOCK USER DATABASE (Avatar Mapping) ---
// In a real app, this would come from a backend user service.
// We map special system users to fixed avatars.
const USER_AVATAR_MAP: Record<string, string> = {
  '我': 'https://api.dicebear.com/7.x/thumbs/svg?seed=Me&backgroundColor=e5e5e5', // Current User
  '小精灵': 'https://api.dicebear.com/9.x/identicon/svg?seed=Brooklynn'
};

/**
 * Helper to get an avatar. 
 * If defined in map, return it.
 * If not, generate a stable one based on the name.
 */
export const getUserAvatar = (name: string): string => {
  if (USER_AVATAR_MAP[name]) {
    return USER_AVATAR_MAP[name];
  }
  // Fallback for unknown users: generate a stable avatar based on name hash
  // Using 'adventurer' style for general users
  return `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(name)}`;
};

/**
 * Initializes the data by fetching the JSON file.
 */
export const initData = async (): Promise<void> => {
  try {
    const response = await fetch('public/data/ugc_data.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    ARTIFACT_DATA = await response.json();
    console.log('[Data] Loaded successfully');
  } catch (error) {
    console.error('[Data] Failed to load artifact data:', error);
    ARTIFACT_DATA = { metadata: {}, ugc_content: {}, tour_route: [] };
  }
};

// Map ModeType to JSON keys
const MODE_KEY_MAP: Record<ModeType, string> = {
  [ModeType.COMMENT_BOARD]: 'comment_board',
  [ModeType.FOLLOW_ME]: 'follow-me',
  [ModeType.CROWD_CHAT]: 'crowd_chat',
  [ModeType.COLLECTIVE_STORY]: 'collective_story'
};

// --- Helper Functions ---

/**
 * Returns the artifacts list.
 * NOW USES TOUR_ROUTE to determine order.
 */
export const getArtifactsList = (): Artifact[] => {
  const meta = ARTIFACT_DATA.metadata || {};
  const route = ARTIFACT_DATA.tour_route || [];
  
  if (route.length > 0) {
    return route.map(item => {
      const data = meta[item.id];
      if (!data) return { id: item.id, name: 'Unknown', imageUrl: '' };
      return {
        id: item.id,
        name: data.offical_name,
        imageUrl: data.avatar_img
      };
    });
  }

  // Fallback to old method if no route defined
  return Object.keys(meta).map(key => ({
    id: key,
    name: meta[key].offical_name,
    imageUrl: meta[key].avatar_img
  }));
};

export const getArtifactDetails = (artifactId: string): Artifact | null => {
  const meta = ARTIFACT_DATA.metadata || {};
  const data = meta[artifactId];
  if (!data) return null;
  return {
    id: artifactId,
    name: data.offical_name,
    imageUrl: data.avatar_img
  };
};

/**
 * Returns the content list for a specific artifact and mode.
 * Injects avatar URLs based on the user name.
 */
export const getArtifactContent = (artifactId: string, mode: ModeType): ContentItem[] => {
  const contentMap = ARTIFACT_DATA.ugc_content || {};
  const artifactContent = contentMap[artifactId];
  if (!artifactContent) return [];

  const key = MODE_KEY_MAP[mode];
  const rawList = artifactContent[key];

  if (!Array.isArray(rawList)) return [];

  return rawList.map((item: any, index: number) => {
    // Handle user being string or array of strings
    const rawUser = item.user;
    let speakerName = '小精灵';
    let avatarKey = '小精灵';
    let contributingUsers: string[] = [];

    if (rawUser) {
        if (Array.isArray(rawUser)) {
            speakerName = rawUser.join(', ');
            avatarKey = rawUser[0]; // Use first user for main avatar if needed
            contributingUsers = rawUser;
        } else {
            speakerName = rawUser;
            avatarKey = rawUser;
            contributingUsers = [rawUser];
        }
    }

    return {
      id: `${artifactId}-${mode}-${index}`,
      artifactId: artifactId,
      mode: mode,
      speaker: speakerName,
      content: item.text,
      isUser: false,
      timestamp: '2023',
      avatarUrl: getUserAvatar(avatarKey),
      contributingUsers: contributingUsers,
      topic: item.topic || undefined // Extract topic
    };
  });
};

/**
 * Gets the profile of the "Follow Me" guide.
 * Assumes the first valid user found in the 'follow-me' data is the main guide.
 */
export const getFollowMeGuideProfile = (): { name: string; avatarUrl: string } => {
  const DEFAULT_GUIDE = '跟TA走';
  const contentMap = ARTIFACT_DATA.ugc_content || {};
  
  // Try to find the first real user in the data
  for (const artId of Object.keys(contentMap)) {
    const rawContent = contentMap[artId]?.['follow-me']?.[0];
    if (rawContent && rawContent.user) {
      const name = Array.isArray(rawContent.user) ? rawContent.user[0] : rawContent.user;
      return {
        name: name,
        avatarUrl: getUserAvatar(name)
      };
    }
  }

  return {
    name: DEFAULT_GUIDE,
    avatarUrl: getUserAvatar(DEFAULT_GUIDE)
  };
};

export const getFollowMeScript = (): { artifact: Artifact, content: ContentItem }[] => {
  const script: { artifact: Artifact, content: ContentItem }[] = [];
  const meta = ARTIFACT_DATA.metadata || {};
  const contentMap = ARTIFACT_DATA.ugc_content || {};
  const route = ARTIFACT_DATA.tour_route || [];
  const DEFAULT_GUIDE = '跟TA走';
  
  // Use Route for iteration
  route.forEach((routeItem) => {
    const artId = routeItem.id;
    const artMeta = meta[artId];
    const artContent = contentMap[artId];
    
    if (artMeta && artContent) {
      const artifactInfo: Artifact = {
        id: artId,
        name: artMeta.offical_name,
        imageUrl: artMeta.avatar_img
      };
      
      const rawContent = artContent['follow-me']?.[0]; 
      if (rawContent) {
         // Use specific user if available, otherwise default
         let speakerName = rawContent.user || DEFAULT_GUIDE;
         if (Array.isArray(speakerName)) speakerName = speakerName[0];

         script.push({
           artifact: artifactInfo,
           content: {
             id: `script-${artId}`,
             artifactId: artId,
             mode: ModeType.FOLLOW_ME,
             speaker: speakerName,
             content: rawContent.text,
             isUser: false,
             avatarUrl: getUserAvatar(speakerName),
             transitionText: routeItem.transition_text?.follow_me // INJECT TRANSITION
           }
         });
      }
    }
  });
  
  return script;
};

export const getCollectiveStoryScript = (): { artifact: Artifact, content: ContentItem }[] => {
  const script: { artifact: Artifact, content: ContentItem }[] = [];
  const meta = ARTIFACT_DATA.metadata || {};
  const contentMap = ARTIFACT_DATA.ugc_content || {};
  const route = ARTIFACT_DATA.tour_route || [];
  const GUIDE_NAME = '跟TA们走';
  
  // Use Route for iteration
  route.forEach((routeItem) => {
    const artId = routeItem.id;
    const artMeta = meta[artId];
    const artContent = contentMap[artId];
    
    if (artMeta && artContent) {
      const artifactInfo: Artifact = {
        id: artId,
        name: artMeta.offical_name,
        imageUrl: artMeta.avatar_img
      };
      
      const rawContent = artContent['collective_story']?.[0]; 
      if (rawContent) {
         let rawUser = rawContent.user || GUIDE_NAME;
         let speakerStr = GUIDE_NAME;
         let contributingUsers: string[] = [];

         // Handle array of users (common in collective story)
         if (Array.isArray(rawUser)) {
            contributingUsers = rawUser;
         } else {
            contributingUsers = [rawUser];
         }

         script.push({
           artifact: artifactInfo,
           content: {
             id: `script-${artId}-col`,
             artifactId: artId,
             mode: ModeType.COLLECTIVE_STORY,
             speaker: speakerStr,
             content: rawContent.text,
             isUser: false,
             avatarUrl: getUserAvatar(speakerStr),
             contributingUsers: contributingUsers, // Pass the list
             transitionText: routeItem.transition_text?.collective_story // INJECT TRANSITION
           }
         });
      }
    }
  });
  
  return script;
};