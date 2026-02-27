'use client';

import React, { useRef, useEffect, useState } from 'react';
import { NMButton } from './NMButton';

interface Props {
    onClose: () => void;
}

export function Whiteboard({ onClose }: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState('#ff4b2b');

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Resize canvas to its container
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;

        ctx.lineCap = 'round';
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
    }, [color]);

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        setIsDrawing(true);
        const rect = canvas.getBoundingClientRect();
        const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
        const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
        const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const clear = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-black/40 backdrop-blur-sm">
            <div className="w-full max-w-4xl h-[80vh] bg-[var(--nm-bg)] rounded-3xl p-6 nm-flat flex flex-col space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold">Pizarra Interactiva</h2>
                    <div className="flex space-x-2">
                        <NMButton onClick={clear} className="text-sm">Limpiar</NMButton>
                        <NMButton onClick={onClose} variant="inset" className="text-sm">Cerrar</NMButton>
                    </div>
                </div>

                <div className="flex-1 nm-inset rounded-2xl bg-white overflow-hidden">
                    <canvas
                        ref={canvasRef}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                        className="w-full h-full cursor-crosshair"
                    />
                </div>

                <div className="flex space-x-4 justify-center">
                    {['#ff4b2b', '#1a1a1a', '#3b82f6', '#10b981', '#f59e0b'].map(c => (
                        <button
                            key={c}
                            onClick={() => setColor(c)}
                            className={`w-8 h-8 rounded-full nm-flat ${color === c ? 'nm-inset' : ''}`}
                            style={{ backgroundColor: c }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
