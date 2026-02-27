'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useWebRTC(roomId: string, role: 'teacher' | 'student') {
    const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'disconnected'>('idle');
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const pcRef = useRef<RTCPeerConnection | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);

    const configuration = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
        ],
    };

    useEffect(() => {
        const supabase = createClient();
        const pc = new RTCPeerConnection(configuration);
        pcRef.current = pc;
        let negotiating = false;

        // Remote stream setup
        const remote = new MediaStream();
        setRemoteStream(null);

        pc.ontrack = (event) => {
            event.streams[0].getTracks().forEach(track => {
                remote.addTrack(track);
            });
            setRemoteStream(remote);
        };

        pc.oniceconnectionstatechange = () => {
            const state = pc.iceConnectionState;
            if (state === 'connected' || state === 'completed') {
                setStatus('connected');
            } else if (state === 'disconnected' || state === 'failed' || state === 'closed') {
                setStatus('disconnected');
            } else {
                setStatus('connecting');
            }
        };

        // Get camera
        const startCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                setLocalStream(stream);
                localStreamRef.current = stream;
                stream.getTracks().forEach(track => pc.addTrack(track, stream));
                return stream;
            } catch (err) {
                console.error('Error accessing camera:', err);
                return null;
            }
        };

        // Create and send offer (teacher only)
        const createAndSendOffer = async (channel: ReturnType<typeof supabase.channel>) => {
            if (negotiating || role !== 'teacher') return;
            negotiating = true;

            try {
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                channel.send({
                    type: 'broadcast',
                    event: 'signal',
                    payload: { type: 'offer', content: offer },
                });
                console.log('[Teacher] Offer sent');
            } catch (e) {
                console.error('Error creating offer:', e);
            } finally {
                negotiating = false;
            }
        };

        const channel = supabase.channel(`room-${roomId}`, {
            config: { broadcast: { self: false } },
        });

        // ICE candidates
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                channel.send({
                    type: 'broadcast',
                    event: 'signal',
                    payload: { type: 'candidate', content: event.candidate },
                });
            }
        };

        // Signal handler
        channel.on('broadcast', { event: 'signal' }, async ({ payload }: { payload: { type: string; content: unknown } }) => {
            const { type, content } = payload;

            try {
                if (type === 'offer' && role === 'student') {
                    // Student receives offer → set remote description and create answer
                    console.log('[Student] Received offer');
                    // Reset if we had a previous description (re-negotiation)
                    if (pc.signalingState !== 'stable') {
                        await Promise.all([
                            pc.setLocalDescription({ type: 'rollback' }),
                        ]);
                    }
                    await pc.setRemoteDescription(new RTCSessionDescription(content as RTCSessionDescriptionInit));
                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);
                    channel.send({
                        type: 'broadcast',
                        event: 'signal',
                        payload: { type: 'answer', content: answer },
                    });
                    console.log('[Student] Answer sent');

                } else if (type === 'answer' && role === 'teacher') {
                    // Teacher receives answer
                    console.log('[Teacher] Received answer');
                    if (pc.signalingState === 'have-local-offer') {
                        await pc.setRemoteDescription(new RTCSessionDescription(content as RTCSessionDescriptionInit));
                    }

                } else if (type === 'candidate') {
                    if (pc.remoteDescription) {
                        await pc.addIceCandidate(new RTCIceCandidate(content as RTCIceCandidateInit));
                    }

                } else if (type === 'student-ready' && role === 'teacher') {
                    // Student just joined → teacher re-sends offer
                    console.log('[Teacher] Student joined, sending new offer');
                    // Create a fresh peer connection state for re-negotiation
                    negotiating = false;
                    if (pc.signalingState !== 'stable') {
                        // If we're in an unstable state, rollback first
                        try {
                            await pc.setLocalDescription({ type: 'rollback' });
                        } catch {
                            // Rollback might fail if stable, that's fine
                        }
                    }
                    await createAndSendOffer(channel);
                }
            } catch (e) {
                console.warn('Signal handling error:', e);
            }
        });

        // Subscribe and init
        channel.subscribe(async (channelStatus: string) => {
            if (channelStatus === 'SUBSCRIBED') {
                console.log(`[${role}] Channel subscribed`);

                await startCamera();

                if (role === 'teacher') {
                    // Teacher sends offer immediately
                    // Small delay to let camera tracks be added to the PC
                    setTimeout(() => createAndSendOffer(channel), 500);
                } else {
                    // Student tells teacher they're ready
                    // Small delay so teacher's listener is ready
                    setTimeout(() => {
                        channel.send({
                            type: 'broadcast',
                            event: 'signal',
                            payload: { type: 'student-ready', content: {} },
                        });
                        console.log('[Student] Sent ready signal');
                    }, 1000);
                }
            }
        });

        return () => {
            pc.close();
            pcRef.current = null;
            channel.unsubscribe();
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(track => track.stop());
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roomId, role]);

    const startScreenShare = async () => {
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
    };

    const recorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    const toggleRecording = () => {
        if (recorderRef.current && recorderRef.current.state === 'recording') {
            recorderRef.current.stop();
            return false;
        }

        const streamToRecord = remoteStream || localStream;
        if (!streamToRecord) return false;

        const mixedStream = new MediaStream();

        // 1. Añadir el track de video principal
        streamToRecord.getVideoTracks().forEach(track => mixedStream.addTrack(track));

        // 2. Mezclar los audios (Local y Remoto) usando AudioContext
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

        // 3. Iniciar la grabación con el stream mezclado
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
    };

    return {
        status,
        localStream,
        remoteStream,
        startScreenShare,
        toggleRecording,
        pc: pcRef.current
    };
}
