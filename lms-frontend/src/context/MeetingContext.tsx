import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Room, RoomEvent, ConnectionState } from 'livekit-client';

interface ActiveMeeting {
  meetingId: number;
  roomName: string;
  title: string;
  isHost: boolean;
}

interface MeetingContextType {
  room: Room | null;
  isConnected: boolean;
  activeMeeting: ActiveMeeting | null;
  joinMeeting: (token: string, serverUrl: string, meetingId: number, roomName: string, title: string, isHost: boolean) => Promise<Room>;
  leaveMeeting: () => Promise<void>;
  endMeetingForEveryone: () => Promise<void>;
  /** Appeler avant navigate() pour signaler une navigation volontaire (room reste active) */
  navigateAway: () => void;
}

const MeetingContext = createContext<MeetingContextType | undefined>(undefined);

export const MeetingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [room, setRoom] = useState<Room | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [activeMeeting, setActiveMeeting] = useState<ActiveMeeting | null>(null);

  /**
   * useRef synchrone (pas setState) pour éviter les problèmes de timing.
   * true = l'utilisateur navigue volontairement hors du meeting → on ignore le disconnect.
   */
  const isNavigatingAwayRef = useRef(false);

  /**
   * Attache les écouteurs d'état de connexion directement sur la room.
   * Cela évite de dépendre de onDisconnected de LiveKitRoom qui peut
   * être déclenché lors du démontage du composant.
   */
  const attachRoomListeners = useCallback((newRoom: Room) => {
    const onDisconnected = () => {
      if (isNavigatingAwayRef.current) {
        // Navigation volontaire : on ignore la déconnexion
        console.info('[MeetingContext] Navigation volontaire — room maintenue active');
        return;
      }
      // Vraie déconnexion (réseau, serveur, timeout)
      console.warn('[MeetingContext] Déconnexion réelle LiveKit détectée');
      setIsConnected(false);
      setRoom(null);
      setActiveMeeting(null);
    };

    const onReconnecting = () => {
      console.warn('[MeetingContext] LiveKit en cours de reconnexion...');
    };

    const onReconnected = () => {
      console.info('[MeetingContext] LiveKit reconnecté ✅');
      setIsConnected(true);
    };

    newRoom.on(RoomEvent.Disconnected, onDisconnected);
    newRoom.on(RoomEvent.Reconnecting, onReconnecting);
    newRoom.on(RoomEvent.Reconnected, onReconnected);

    // Retourne une fonction de nettoyage
    return () => {
      newRoom.off(RoomEvent.Disconnected, onDisconnected);
      newRoom.off(RoomEvent.Reconnecting, onReconnecting);
      newRoom.off(RoomEvent.Reconnected, onReconnected);
    };
  }, []);

  const joinMeeting = async (
    token: string,
    serverUrl: string,
    meetingId: number,
    roomName: string,
    title: string,
    isHost: boolean
  ): Promise<Room> => {
    // Si la room est déjà connectée à cette même réunion, on la réutilise
    if (room && activeMeeting?.meetingId === meetingId && room.state === ConnectionState.Connected) {
      isNavigatingAwayRef.current = false;
      return room;
    }

    // Si connecté à une autre réunion, quitter proprement d'abord
    if (room) {
      try { await room.disconnect(); } catch (_) {}
      setRoom(null);
      setIsConnected(false);
      setActiveMeeting(null);
    }

    const newRoom = new Room();
    const detachListeners = attachRoomListeners(newRoom);

    try {
      await newRoom.connect(serverUrl, token);

      // Privacy-first : micro et caméra désactivés par défaut
      try { await newRoom.localParticipant.setMicrophoneEnabled(false); } catch (_) {}
      try { await newRoom.localParticipant.setCameraEnabled(false); } catch (_) {}

      isNavigatingAwayRef.current = false;
      setRoom(newRoom);
      setIsConnected(true);
      setActiveMeeting({ meetingId, roomName, title, isHost });

      return newRoom;
    } catch (error) {
      detachListeners();
      console.error('[MeetingContext] Erreur connexion LiveKit:', error);
      setIsConnected(false);
      setRoom(null);
      setActiveMeeting(null);
      throw error;
    }
  };

  const leaveMeeting = async () => {
    isNavigatingAwayRef.current = false;
    if (room) {
      try { await room.disconnect(); } catch (_) {}
    }
    setRoom(null);
    setIsConnected(false);
    setActiveMeeting(null);
  };

  /**
   * Signaler une navigation volontaire — la room LiveKit reste connectée.
   * DOIT être appelé de façon synchrone AVANT navigate().
   */
  const navigateAway = () => {
    isNavigatingAwayRef.current = true;
  };

  const endMeetingForEveryone = async () => {
    if (activeMeeting?.meetingId) {
      try {
        const { endMeeting } = require('../services/api/meeting');
        // Optionnel : appeler l'API du meeting service si nécessaire
        await endMeeting(activeMeeting.meetingId);
      } catch (err) {
        console.warn('[MeetingContext] Erreur fermeture réunion:', err);
      }
    }
    await leaveMeeting();
  };

  // Nettoyage propre à la fermeture de l'onglet
  useEffect(() => {
    const handleUnload = () => {
      if (room) room.disconnect();
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [room]);

  return (
    <MeetingContext.Provider
      value={{
        room,
        isConnected,
        activeMeeting,
        joinMeeting,
        leaveMeeting,
        endMeetingForEveryone,
        navigateAway,
      }}
    >
      {children}
    </MeetingContext.Provider>
  );
};

export const useMeeting = () => {
  const context = useContext(MeetingContext);
  if (!context) {
    throw new Error('useMeeting doit être utilisé à l\'intérieur de MeetingProvider');
  }
  return context;
};
