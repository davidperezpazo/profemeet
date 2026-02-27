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

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });
            setLocalStream(stream);
            stream.getTracks().forEach(track => {
                if (pcRef.current) pcRef.current.addTrack(track, stream);
            });
            return stream;
        } catch (err) {
            console.error('Error accessing camera:', err);
            return null;
        }
    };

    useEffect(() => {
        const pc = new RTCPeerConnection(configuration);
        pcRef.current = pc;

        // Auto-start camera
        startCamera();

        pc.oniceconnectionstatechange = () => {
            setStatus(pc.iceConnectionState as any);
        };

        pc.ontrack = (event) => {
            if (event.streams && event.streams[0]) {
                setRemoteStream(event.streams[0]);
            }
        };

        const supabase = createClient();
        const channel = supabase.channel(`room-${roomId}`, {
            config: {
                broadcast: { self: false },
            },
        });

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                channel.send({
                    type: 'broadcast',
                    event: 'signal',
                    payload: { type: 'candidate', content: event.candidate },
                });
            }
        };

        channel.on('broadcast', { event: 'signal' }, async ({ payload }: { payload: { type: string, content: any } }) => {
            const { type, content } = payload;

            if (type === 'offer' && role === 'student' && !pc.remoteDescription) {
                await pc.setRemoteDescription(new RTCSessionDescription(content));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                channel.send({
                    type: 'broadcast',
                    event: 'signal',
                    payload: { type: 'answer', content: answer },
                });
            } else if (type === 'answer' && role === 'teacher' && !pc.remoteDescription) {
                await pc.setRemoteDescription(new RTCSessionDescription(content));
            } else if (type === 'candidate') {
                try {
                    await pc.addIceCandidate(new RTCIceCandidate(content));
                } catch (e) {
                    console.warn('Error adding ICE candidate', e);
                }
            }
        });

        channel.subscribe(async (status: string) => {
            if (status === 'SUBSCRIBED' && role === 'teacher') {
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                channel.send({
                    type: 'broadcast',
                    event: 'signal',
                    payload: { type: 'offer', content: offer },
                });
            }
        });

        return () => {
            pc.close();
            channel.unsubscribe();
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(track => track.stop());
            }
        };
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
            // Creamos un contexto de audio (requiere interacción previa del usuario, que ya tenemos al hacer click en el botón)
            const audioContext = new window.AudioContext();
            const destination = audioContext.createMediaStreamDestination();

            // Añadir audio local (micrófono del profesor)
            if (localStream && localStream.getAudioTracks().length > 0) {
                const localSource = audioContext.createMediaStreamSource(localStream);
                localSource.connect(destination);
            }

            // Añadir audio remoto (micrófono del alumno o audio del sistema)
            if (remoteStream && remoteStream.getAudioTracks().length > 0) {
                const remoteSource = audioContext.createMediaStreamSource(remoteStream);
                remoteSource.connect(destination);
            }

            // Añadir el track de audio mezclado al stream final
            destination.stream.getAudioTracks().forEach(track => mixedStream.addTrack(track));
        } catch (e) {
            console.warn('No se pudo mezclar el audio avanzado, usando fallback', e);
            // Fallback: solo coger los audios disponibles en el stream principal
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
