'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { NMCard } from '../components/NMCard';
import { NMButton } from '../components/NMButton';

export default function ProfeMeetLanding() {
    const router = useRouter();
    const [roomId, setRoomId] = useState('');

    const handleCreateRoom = () => {
        const newRoomId = Math.random().toString(36).substring(2, 9);
        router.push(`/profemeet/room/${newRoomId}?role=teacher`);
    };

    const handleJoinRoom = (e: React.FormEvent) => {
        e.preventDefault();
        if (roomId) {
            router.push(`/profemeet/room/${roomId}?role=student`);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 space-y-12">
            <header className="text-center space-y-4">
                <h1 className="text-5xl font-bold text-[var(--nm-accent)] tracking-tight">ProfeMeet</h1>
                <p className="text-[var(--nm-text)] opacity-80 text-lg">
                    Enseñanza remota, directa y táctil.
                </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
                {/* Sección Profesor */}
                <NMCard className="flex flex-col items-center text-center space-y-6">
                    <div className="w-16 h-16 rounded-full nm-inset flex items-center justify-center text-3xl">
                        👨‍🏫
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-semibold">Soy Profesor</h2>
                        <p className="text-sm opacity-70">
                            Crea una sala y comparte el enlace con tu alumno para empezar.
                        </p>
                    </div>
                    <NMButton onClick={handleCreateRoom} fullWidth>
                        Crear Nueva Clase
                    </NMButton>
                </NMCard>

                {/* Sección Alumno */}
                <NMCard className="flex flex-col items-center text-center space-y-6">
                    <div className="w-16 h-16 rounded-full nm-inset flex items-center justify-center text-3xl">
                        🎓
                    </div>
                    <div className="space-y-2 w-full">
                        <h2 className="text-2xl font-semibold">Soy Alumno</h2>
                        <p className="text-sm opacity-70 mb-4">
                            Pega el ID de la sala que te ha dado tu profesor.
                        </p>
                        <form onSubmit={handleJoinRoom} className="space-y-4">
                            <input
                                type="text"
                                placeholder="ID de la Sala"
                                value={roomId}
                                onChange={(e) => setRoomId(e.target.value)}
                                className="w-full nm-inset p-3 bg-transparent border-none outline-none rounded-xl text-center focus:nm-flat transition-all"
                            />
                            <NMButton type="submit" variant="secondary" fullWidth disabled={!roomId}>
                                Unirse a la Clase
                            </NMButton>
                        </form>
                    </div>
                </NMCard>
            </div>

            <footer className="opacity-50 text-xs mt-12">
                ProfeMeet v1.0 • Diseño Neumórfico • Privacidad P2P
            </footer>
        </div>
    );
}
