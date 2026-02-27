'use client';

import { useEffect } from 'react';

export function useRemoteControl(pc: RTCPeerConnection | null, role: 'teacher' | 'student') {
    useEffect(() => {
        if (!pc) return;

        let dataChannel: RTCDataChannel;

        if (role === 'teacher') {
            dataChannel = pc.createDataChannel('remote-control');

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
            pc.ondatachannel = (event) => {
                const channel = event.channel;
                if (channel.label === 'remote-control') {
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
                            console.warn('Local agent not detected. Run profemeet_agent.py on your machine.');
                        }
                    };
                }
            };
        }
    }, [pc, role]);
}
