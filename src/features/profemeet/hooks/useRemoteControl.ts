'use client';

import { useEffect } from 'react';

export function useRemoteControl(pc: RTCPeerConnection | null, role: 'teacher' | 'student', isEnabled: boolean) {
    useEffect(() => {
        if (!pc || !isEnabled) return;

        let dataChannel: RTCDataChannel;

        if (role === 'teacher') {
            // Check if datachannel already exists or is being created
            dataChannel = pc.createDataChannel('remote-control', { negotiated: true, id: 1 });

            const handleMouseMove = (e: MouseEvent) => {
                if (dataChannel.readyState === 'open') {
                    const payload = {
                        type: 'mousemove',
                        x: e.clientX / window.innerWidth,
                        y: e.clientY / window.innerHeight
                    };
                    dataChannel.send(JSON.stringify(payload));
                }
            };

            const handleClick = (e: MouseEvent) => {
                if (dataChannel.readyState === 'open') {
                    dataChannel.send(JSON.stringify({ type: 'click' }));
                }
            };

            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('click', handleClick);

            return () => {
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('click', handleClick);
            };
        } else {
            const channel = pc.createDataChannel('remote-control', { negotiated: true, id: 1 });
            channel.onmessage = async (e) => {
                const data = JSON.parse(e.data);
                console.log('Remote Command Received:', data);
                try {
                    await fetch('http://localhost:8080/exec', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                    });
                } catch (err) {
                    // Silently fail if agent not running
                }
            };
        }
    }, [pc, role, isEnabled]);
}
