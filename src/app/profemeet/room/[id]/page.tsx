'use client';

import React from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useWebRTC } from '@/features/profemeet/hooks/useWebRTC';
import { useRemoteControl } from '@/features/profemeet/hooks/useRemoteControl';
import { NMCard } from '@/features/profemeet/components/NMCard';
import { NMButton } from '@/features/profemeet/components/NMButton';

export default function RoomPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const roomId = params.id as string;
    const role = searchParams.get('role') as 'teacher' | 'student';

    const { status, localStream, remoteStream, startScreenShare, pc } = useWebRTC(roomId, role);
    useRemoteControl(pc, role);

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
                    <NMButton className="h-10 w-10 !p-0" variant="inset">
                        ⚙️
                    </NMButton>
                </div>
            </header>

            <main className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4">
                {/* Vista Principal (Pantalla Compartida) */}
                <NMCard className="lg:col-span-3 h-full flex items-center justify-center relative overflow-hidden min-h-[400px]">
                    {remoteStream ? (
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
                        {role === 'teacher' && (
                            <NMButton onClick={() => { }}>
                                Tomar Control
                            </NMButton>
                        )}
                    </div>
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

                    <NMCard className="h-1/3 flex flex-col">
                        <h3 className="text-sm font-semibold opacity-60 uppercase tracking-wider mb-2">Herramientas</h3>
                        <div className="grid grid-cols-2 gap-2">
                            <NMButton className="text-xs !p-2">Pizarra</NMButton>
                            <NMButton className="text-xs !p-2">Grabar</NMButton>
                        </div>
                    </NMCard>
                </div>
            </main>
        </div>
    );
}
