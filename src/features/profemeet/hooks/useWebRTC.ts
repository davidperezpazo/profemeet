'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useWebRTC(roomId: string, role: 'teacher' | 'student') {
    const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'disconnected'>('idle');
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [remoteScreenStream, setRemoteScreenStream] = useState<MediaStream | null>(null);
    const pcRef = useRef<RTCPeerConnection | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);

    const configuration: RTCConfiguration = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' },
            { urls: 'stun:stun4.l.google.com:19302' },
            { urls: 'stun:stun.services.mozilla.com' },
            { urls: 'stun:global.stun.twilio.com:3478' },
        ],
        iceCandidatePoolSize: 10,
    };

    useEffect(() => {
        const supabase = createClient();
        const pc = new RTCPeerConnection(configuration);
        pcRef.current = pc;

        // Queue para ICE candidates que llegan ANTES de setRemoteDescription
        const pendingCandidates: RTCIceCandidateInit[] = [];
        let hasRemoteDescription = false;

        const flushCandidates = async () => {
            while (pendingCandidates.length > 0) {
                const candidate = pendingCandidates.shift()!;
                try {
                    await pc.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (e) {
                    console.warn('[ICE] Error adding queued candidate:', e);
                }
            }
        };

        const remoteCameraStreamIdRef = { current: '' as string };

        // Remote stream
        pc.ontrack = (event) => {
            console.log(`[${role}] Track received:`, event.track.kind, 'Stream count:', event.streams?.length);
            if (event.streams && event.streams[0]) {
                const stream = event.streams[0];
                // El primer stream que recibimos siempre asume que es la cámara
                if (!remoteCameraStreamIdRef.current) {
                    remoteCameraStreamIdRef.current = stream.id;
                    setRemoteStream(stream);
                } else if (stream.id === remoteCameraStreamIdRef.current) {
                    // Sigue siendo el stream de la cámara (por ejemplo, acaba de llegar el audio o segundo track)
                    setRemoteStream(stream);
                } else {
                    // Es un stream distinto (pantalla compartida)
                    setRemoteScreenStream(stream);

                    // Si el track termina (el usuario deja de compartir), lo limpiamos
                    event.track.onended = () => {
                        console.log(`[${role}] Remote screen track ended`);
                        setRemoteScreenStream(null);
                    };
                }
            }
        };

        pc.oniceconnectionstatechange = () => {
            const state = pc.iceConnectionState;
            console.log(`[${role}] ICE state:`, state);
            if (state === 'connected' || state === 'completed') {
                setStatus('connected');
            } else if (state === 'failed') {
                console.log(`[${role}] ICE failed, attempting restart...`);
                setStatus('disconnected');
                pc.restartIce();
            } else if (state === 'disconnected') {
                setStatus('disconnected');
                setTimeout(() => {
                    if (pc.iceConnectionState === 'disconnected') {
                        console.log(`[${role}] Still disconnected, restarting ICE...`);
                        pc.restartIce();
                    }
                }, 3000);
            } else {
                setStatus('connecting');
            }
        };

        pc.onconnectionstatechange = () => {
            const state = pc.connectionState;
            console.log(`[${role}] Connection state:`, state);
            if (state === 'failed' || state === 'disconnected') {
                setStatus('disconnected');
                // Force a full renegotiation on hard failure
                if (role === 'teacher') {
                    console.log('[Teacher] Hard connection failure, re-creating offer');
                    setTimeout(() => createOffer(), 1000);
                }
            }
        };

        pc.onicegatheringstatechange = () => {
            console.log(`[${role}] ICE gathering state:`, pc.iceGatheringState);
        };

        // Camera
        const startCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                setLocalStream(stream);
                localStreamRef.current = stream;
                stream.getTracks().forEach(track => pc.addTrack(track, stream));
                console.log(`[${role}] Camera started, tracks added to PC`);
                return stream;
            } catch (err) {
                console.error('Error accessing camera:', err);
                return null;
            }
        };

        // Channel
        const channel = supabase.channel(`room-${roomId}`, {
            config: { broadcast: { self: false } },
        });

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                channel.send({
                    type: 'broadcast',
                    event: 'signal',
                    payload: { type: 'candidate', content: event.candidate.toJSON() },
                });
            }
        };

        // Create offer (teacher)
        const createOffer = async () => {
            try {
                // Reset state if needed
                if (pc.signalingState !== 'stable') {
                    console.log(`[Teacher] Resetting signaling state from ${pc.signalingState}`);
                }

                const offer = await pc.createOffer({ iceRestart: true });
                await pc.setLocalDescription(offer);
                channel.send({
                    type: 'broadcast',
                    event: 'signal',
                    payload: { type: 'offer', content: pc.localDescription!.toJSON() },
                });
                console.log('[Teacher] Offer sent');
            } catch (e) {
                console.error('[Teacher] Error creating offer:', e);
            }
        };

        // Signal handler
        channel.on('broadcast', { event: 'signal' }, async ({ payload }: { payload: { type: string; content: Record<string, unknown> } }) => {
            const { type, content } = payload;
            console.log(`[${role}] Received signal: ${type}`);

            try {
                if (type === 'offer' && role === 'student') {
                    await pc.setRemoteDescription(new RTCSessionDescription(content as unknown as RTCSessionDescriptionInit));
                    hasRemoteDescription = true;
                    await flushCandidates();

                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);
                    channel.send({
                        type: 'broadcast',
                        event: 'signal',
                        payload: { type: 'answer', content: pc.localDescription!.toJSON() },
                    });
                    console.log('[Student] Answer sent');

                } else if (type === 'answer' && role === 'teacher') {
                    if (pc.signalingState === 'have-local-offer') {
                        await pc.setRemoteDescription(new RTCSessionDescription(content as unknown as RTCSessionDescriptionInit));
                        hasRemoteDescription = true;
                        await flushCandidates();
                        console.log('[Teacher] Remote description set');
                    }

                } else if (type === 'candidate') {
                    const candidateInit = content as unknown as RTCIceCandidateInit;
                    if (hasRemoteDescription && pc.remoteDescription) {
                        try {
                            await pc.addIceCandidate(new RTCIceCandidate(candidateInit));
                        } catch (e) {
                            console.warn('[ICE] Error adding candidate:', e);
                        }
                    } else {
                        // Encolar hasta que tengamos remote description
                        console.log(`[${role}] Queuing ICE candidate (no remote desc yet)`);
                        pendingCandidates.push(candidateInit);
                    }

                } else if (type === 'student-ready' && role === 'teacher') {
                    console.log('[Teacher] Student is ready, sending offer...');
                    // Reset para nuevo intento
                    hasRemoteDescription = false;
                    pendingCandidates.length = 0;
                    await createOffer();
                }
            } catch (e) {
                console.error(`[${role}] Signal error:`, e);
            }
        });

        // Subscribe
        let pingInterval: NodeJS.Timeout;

        channel.subscribe(async (channelStatus: string) => {
            if (channelStatus === 'SUBSCRIBED') {
                console.log(`[${role}] Channel SUBSCRIBED`);
                setStatus('connecting');

                await startCamera();

                if (role === 'teacher') {
                    // Teacher sends initial offer after camera is ready, but also waits for student-ready
                    setTimeout(() => createOffer(), 800);
                } else {
                    // Student repeatedly tells teacher they're ready until they receive an offer
                    const sendReadySignal = () => {
                        if (!hasRemoteDescription && pc.connectionState !== 'connected') {
                            channel.send({
                                type: 'broadcast',
                                event: 'signal',
                                payload: { type: 'student-ready', content: {} },
                            });
                            console.log('[Student] Ready signal (ping) sent');
                        }
                    };

                    setTimeout(sendReadySignal, 1500);
                    pingInterval = setInterval(sendReadySignal, 4000);
                }
            }
        });

        return () => {
            console.log(`[${role}] Cleaning up WebRTC`);
            if (pingInterval) clearInterval(pingInterval);
            pc.close();
            pcRef.current = null;
            channel.unsubscribe();
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(track => track.stop());
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roomId, role]);

    const startScreenShare = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: true
            });
            localStreamRef.current = stream;
            stream.getTracks().forEach(track => {
                if (pcRef.current) {
                    pcRef.current.addTrack(track, stream);
                }
            });
            return stream;
        } catch (err) {
            console.error('Error sharing screen:', err);
            return null;
        }
    }, []);

    const recorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    const toggleRecording = useCallback(() => {
        if (recorderRef.current && recorderRef.current.state === 'recording') {
            recorderRef.current.stop();
            return false;
        }

        const streamToRecord = remoteStream || localStream;
        if (!streamToRecord) return false;

        const mixedStream = new MediaStream();
        streamToRecord.getVideoTracks().forEach(track => mixedStream.addTrack(track));

        try {
            const audioContext = new window.AudioContext();
            const destination = audioContext.createMediaStreamDestination();

            if (localStream && localStream.getAudioTracks().length > 0) {
                const localSource = audioContext.createMediaStreamSource(localStream);
                localSource.connect(destination);
            }

            if (remoteStream && remoteStream.getAudioTracks().length > 0) {
                const remoteSource = audioContext.createMediaStreamSource(remoteStream);
                remoteSource.connect(destination);
            }

            destination.stream.getAudioTracks().forEach(track => mixedStream.addTrack(track));
        } catch (e) {
            console.warn('No se pudo mezclar el audio avanzado, usando fallback', e);
            streamToRecord.getAudioTracks().forEach(track => mixedStream.addTrack(track));
        }

        const options = { mimeType: 'video/webm;codecs=vp8,opus' };
        const recorder = new MediaRecorder(mixedStream, MediaRecorder.isTypeSupported(options.mimeType) ? options : undefined);

        recorderRef.current = recorder;
        chunksRef.current = [];

        recorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunksRef.current.push(e.data);
        };

        recorder.onstop = () => {
            const blob = new Blob(chunksRef.current, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `profemeet-clase-${new Date().toISOString()}.webm`;
            a.click();
            recorderRef.current = null;
        };

        recorder.start();
        return true;
    }, [localStream, remoteStream]);

    return {
        status,
        localStream,
        remoteStream,
        remoteScreenStream,
        startScreenShare,
        toggleRecording,
        pc: pcRef.current
    };
}
