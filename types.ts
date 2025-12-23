
export type ChatStatus = 'IDLE' | 'SEARCHING' | 'CONNECTED' | 'DISCONNECTED';

export interface Message {
  id: string;
  sender: 'me' | 'partner' | 'system';
  text: string;
  timestamp: Date;
}

export interface SignalingMessage {
  type: 'offer' | 'answer' | 'candidate';
  data: RTCSessionDescriptionInit | RTCIceCandidateInit;
}
