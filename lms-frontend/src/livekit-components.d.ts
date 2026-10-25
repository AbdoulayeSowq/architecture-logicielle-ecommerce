declare module '@livekit/components-react' {
    import { FC, CSSProperties, ReactNode } from 'react';

    interface LiveKitRoomProps {
        token?: string;
        serverUrl?: string;
        room?: any;
        connect?: boolean;
        onDisconnected?: () => void;
        style?: CSSProperties;
        'data-lk-theme'?: string;
        children?: ReactNode;
    }

    export const LiveKitRoom: FC<LiveKitRoomProps>;
    export const VideoConference: FC<any>;
    export const RoomAudioRenderer: FC<any>;
    export const ControlBar: FC<any>;
    export const GridLayout: FC<any>;
    export const ParticipantTile: FC<any>;
    export const useRoomContext: () => any;
    export const RoomContext: any;
}

declare module '@livekit/components-styles';
