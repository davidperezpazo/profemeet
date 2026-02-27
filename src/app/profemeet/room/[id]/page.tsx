'use client';

import React, { useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useWebRTC } from '@/features/profemeet/hooks/useWebRTC';
import { useRemoteControl } from '@/features/profemeet/hooks/useRemoteControl';
import { NMCard } from '@/features/profemeet/components/NMCard';
import { NMButton } from '@/features/profemeet/components/NMButton';
import { Whiteboard } from '@/features/profemeet/components/Whiteboard';

export default function RoomPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const roomId = params.id as string;
    const role = searchParams.get('role') as 'teacher' | 'student';

    const [isWhiteboardOpen, setIsWhiteboardOpen] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [isRemoteEnabled, setIsRemoteEnabled] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    const { status, localStream, remoteStream, remoteScreenStream, startScreenShare, toggleRecording, pc } = useWebRTC(roomId, role);
    useRemoteControl(pc, role, isRemoteEnabled);

    const handleToggleRecording = () => {
        const started = toggleRecording();
        setIsRecording(started);
    };

    const copyRoomLink = () => {
        const studentUrl = `${window.location.origin}/profemeet/room/${roomId}?role=student`;
        navigator.clipboard.writeText(studentUrl);
        alert('Enlace para el alumno copiado al portapapeles');
    };

    return (
        <div className="min-h-screen bg-[var(--nm-bg)] p-4 flex flex-col space-y-4">
            <header className="flex justify-between items-center px-4 py-2">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 nm-inset flex items-center justify-center text-xl">
                        {role === 'teacher' ? '👨‍🏫' : '🎓'}
                    </div>
                    <div>
                        <h1 className="font-bold text-lg">Sala: {roomId}</h1>
                        <p className="text-xs opacity-50 capitalize">{role}</p>
                    </div>
                </div>

                <div className="flex items-center space-x-4">
                    <div className={`px-3 py-1 rounded-full text-xs font-medium nm-inset ${status === 'connected' ? 'text-green-500' : 'text-orange-500'
                        }`}>
                        {status === 'idle' ? 'Esperando...' : status}
                    </div>
                    <NMButton className="h-10 w-10 !p-0" variant={showSettings ? "inset" : "primary"} onClick={() => setShowSettings(!showSettings)}>
                        ⚙️
                    </NMButton>
                </div>
            </header>

            {showSettings && (
                <NMCard className="mx-4 p-4 flex flex-wrap gap-4 items-center justify-between border-2 border-[var(--nm-accent)]/20 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center space-x-4">
                        <NMButton onClick={copyRoomLink} className="text-sm">Copiar Enlace de Clase</NMButton>
                        <NMButton onClick={() => window.location.href = '/'} variant="inset" className="text-sm border-red-200">Salir de la Clase</NMButton>
                    </div>
                    <p className="text-xs opacity-50">Configuraciones rápidas para ProfeMeet</p>
                </NMCard>
            )}

            <main className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4">
                {/* Vista Principal (Pantalla Compartida o Cámara si no hay pantalla) */}
                <NMCard className="lg:col-span-3 h-full flex items-center justify-center relative overflow-hidden min-h-[400px]">
                    {remoteScreenStream ? (
                        <video
                            autoPlay
                            playsInline
                            ref={v => { if (v) v.srcObject = remoteScreenStream; }}
                            className="w-full h-full object-contain"
                        />
                    ) : remoteStream ? (
                        <video
                            autoPlay
                            playsInline
                            ref={v => { if (v) v.srcObject = remoteStream; }}
                            className="w-full h-full object-contain"
                        />
                    ) : (
                        <div className="text-center space-y-4 opacity-30">
                            <div className="text-6xl">📺</div>
                            <p>Esperando señal de video...</p>
                        </div>
                    )}

                    {/* Controles Flotantes */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-4">
                        {role === 'student' && (
                            <NMButton onClick={startScreenShare}>
                                Compartir mi pantalla
                            </NMButton>
                        )}
                        {role === 'teacher' && status === 'connected' && (
                            <NMButton
                                variant={isRemoteEnabled ? "inset" : "primary"}
                                onClick={() => setIsRemoteEnabled(!isRemoteEnabled)}
                                className={isRemoteEnabled ? "text-[var(--nm-accent)] font-bold" : ""}
                            >
                                {isRemoteEnabled ? "🖱️ Control Activo" : "Tomar Control"}
                            </NMButton>
                        )}
                    </div>

                    {isRecording && (
                        <div className="absolute top-4 left-4 flex items-center space-x-2 px-3 py-1 bg-red-500 text-white rounded-full animate-pulse text-xs font-bold">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                            <span>GRABANDO</span>
                        </div>
                    )}
                </NMCard>

                {/* Sidebar (Cámaras y Chat) */}
                <div className="space-y-4 flex flex-col h-full">
                    <NMCard className="flex-1 space-y-4">
                        <h3 className="text-sm font-semibold opacity-60 uppercase tracking-wider">Cámaras</h3>
                        <div className="aspect-video nm-inset rounded-xl overflow-hidden bg-gray-200">
                            {/* Mi Cámara */}
                            {localStream && (
                                <video
                                    autoPlay
                                    playsInline
                                    muted
                                    ref={v => { if (v) v.srcObject = localStream; }}
                                    className="w-full h-full object-cover scale-x-[-1]"
                                />
                            )}
                        </div>
                        <div className="aspect-video nm-inset rounded-xl overflow-hidden bg-gray-200">
                            {/* Cámara Remota */}
                            {remoteStream && (
                                <video
                                    autoPlay
                                    playsInline
                                    ref={v => { if (v) v.srcObject = remoteStream; }}
                                    className="w-full h-full object-cover"
                                />
                            )}
                        </div>
                    </NMCard>

                    <NMCard className="flex flex-col">
                        <h3 className="text-sm font-semibold opacity-60 uppercase tracking-wider mb-2">Herramientas</h3>
                        <div className="grid grid-cols-2 gap-2">
                            <NMButton
                                className="text-xs !p-2"
                                onClick={() => setIsWhiteboardOpen(true)}
                            >
                                Pizarra
                            </NMButton>
                            <NMButton
                                className={`text-xs !p-2 ${isRecording ? "text-red-500 nm-inset" : ""}`}
                                onClick={handleToggleRecording}
                            >
                                {isRecording ? "Detener" : "Grabar"}
                            </NMButton>
                        </div>
                    </NMCard>
                </div>
            </main>

            {isWhiteboardOpen && <Whiteboard onClose={() => setIsWhiteboardOpen(false)} />}
        </div>
    );
}
