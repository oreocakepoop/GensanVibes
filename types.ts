export enum PostType {
  TEXT = 'TEXT',
  PHOTO = 'PHOTO',
  QUOTE = 'QUOTE',
  LINK = 'LINK',
  CHAT = 'CHAT',
  AUDIO = 'AUDIO',
  VIDEO = 'VIDEO',
  REPOST = 'REPOST',
}

export enum NotificationType {
  LIKE = 'LIKE',
  COMMENT = 'COMMENT',
  FOLLOW = 'FOLLOW',
  REPOST = 'REPOST',
}

export interface Post {
  id: string; // Firebase key
  userId: string;
  type: PostType;
  title?: string;
  body?: string;
  imageUrl?: string;
  quote?: string;
  source?: string;
  linkUrl?: string;
  chat?: { author: string; line: string }[];
  tags?: string[];
  likesCount: number;
  commentsCount: number;
  repostsCount?: number;
  likes?: { [userId: string]: boolean };
  barangay?: string;
  createdAt: string; // ISO 8601 format
  originalPostId?: string; // For reposts
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  body: string;
  createdAt: string; // ISO 8601 format
  likesCount?: number;
  likes?: { [userId: string]: boolean };
  parentId?: string; // ID of the parent comment
  replyCount?: number;
}

export interface UserProfile {
  username: string;
  email: string;
  createdAt: string;
  followersCount: number;
  followingCount: number;
  postsCount?: number; // Added for badge logic
  city?: string;
  barangay?: string;
  avatarStyle: string;
  bio?: string;
  followers?: { [userId:string]: boolean };
  following?: { [userId: string]: boolean };
  badges?: { [badgeId: string]: string }; // Badge ID -> ISO Timestamp
  commentsMadeCount?: number;
  eventsAttendedCount?: number;
  barangayChatMessagesCount?: number;
  visitedBarangays?: { [barangayName: string]: boolean };
  vibePoints?: number;
  selectedBorder?: string;
}

export interface Notification {
  id: string;
  senderId: string;
  recipientId: string;
  type: NotificationType;
  postId?: string; // for likes, comments, and reposts
  createdAt: string; // ISO 8601 format
  read: boolean;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  iconName: string;
  tier: number;
}

export interface KaganapanEvent {
    id: string;
    title: string;
    description: string;
    eventDate: string; // ISO 8601 Format
    location: string;
    creatorId: string;
    creatorUsername: string;
    creatorAvatarStyle: string;
    createdAt: string; // ISO 8601 Format
    attendeesCount: number;
    attendees: { [userId: string]: boolean };
}

export interface ChatMessage {
    id: string;
    userId: string;
    text: string;
    createdAt: string; // ISO 8601 Format
    username: string;
    avatarStyle: string;
}

export interface DirectMessage {
    id: string;
    senderId: string;
    text: string;
    createdAt: string; // ISO 8601
}

export interface Conversation {
    id: string;
    participants: { [userId: string]: boolean };
    participantDetails: {
        [userId: string]: {
            username: string;
            avatarStyle: string;
        }
    };
    lastMessage?: {
        text: string;
        createdAt: string;
        senderId: string;
    };
    createdAt: string; // ISO 8601
    updatedAt: string; // ISO 8601
}


export type View =
  | { type: 'dashboard'; filter?: { type: 'explore' } | { type: 'tag'; value: string } | { type: 'barangay'; name: string } }
  | { type: 'profile'; userId: string }
  | { type: 'post'; postId: string }
  | { type: 'events' }
  | { type: 'eventDetail'; eventId: string }
  | { type: 'barangayChat'; barangayName: string }
  | { type: 'barangayHub'; barangayName: string }
  | { type: 'foodTripPlanner' }
  | { type: 'dms' }
  | { type: 'dmConversation'; conversationId: string };