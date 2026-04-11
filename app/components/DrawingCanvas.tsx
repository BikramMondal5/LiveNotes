'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Canvas, Rect, Circle, Line, Path, Text as FabricText } from 'fabric';
import { Socket } from 'socket.io-client';

export type DrawingTool = 'pointer' | 'rect' | 'circle' | 'arrow' | 'line' | 'pencil' | 'text' | 'image';

interface DrawingCanvasProps {
    activeTool: DrawingTool;
    socket?: Socket;
    roomId?: string;
}

const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ activeTool, socket, roomId }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fabricCanvasRef = useRef<Canvas | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const startPointRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const pointsRef = useRef<{ x: number; y: number }[]>([]);
    const previewObjectRef = useRef<any>(null);

    // Initialize Fabric Canvas
    useEffect(() => {
        if (!canvasRef.current) return;

        const canvas = new Canvas(canvasRef.current, {
            width: canvasRef.current.parentElement?.clientWidth || 800,
            height: canvasRef.current.parentElement?.clientHeight || 600,
            backgroundColor: 'transparent',
        });

        fabricCanvasRef.current = canvas;

        // Handle window resize
        const handleResize = () => {
            if (canvasRef.current?.parentElement) {
                canvas.setDimensions({
                    width: canvasRef.current.parentElement.clientWidth,
                    height: canvasRef.current.parentElement.clientHeight,
                });
                canvas.renderAll();
            }
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            canvas.dispose();
        };
    }, []);

    // Set canvas cursor based on tool
    useEffect(() => {
        if (!fabricCanvasRef.current) return;

        const cursorMap: Record<DrawingTool, string> = {
            pointer: 'default',
            rect: 'crosshair',
            circle: 'crosshair',
            arrow: 'crosshair',
            line: 'crosshair',
            pencil: 'crosshair',
            text: 'text',
            image: 'copy',
        };

        fabricCanvasRef.current.defaultCursor = cursorMap[activeTool] || 'default';
    }, [activeTool]);

    const emitElement = useCallback(
        (element: any) => {
            if (socket && roomId) {
                socket.emit('draw', {
                    roomId,
                    element: {
                        type: element.type,
                        left: element.left,
                        top: element.top,
                        width: element.width,
                        height: element.height,
                        fill: element.fill,
                        stroke: element.stroke,
                        strokeWidth: element.strokeWidth,
                        data: element.toJSON(),
                    },
                });
            }
        },
        [socket, roomId]
    );

    // Mouse Down
    const handleMouseDown = useCallback(
        (e: any) => {
            if (!fabricCanvasRef.current) return;

            const pointer = fabricCanvasRef.current.getScenePoint(e);
            startPointRef.current = { x: pointer.x, y: pointer.y };
            pointsRef.current = [];

            if (activeTool === 'pointer') {
                return;
            }

            if (activeTool === 'pencil') {
                pointsRef.current = [{ x: pointer.x, y: pointer.y }];
            }

            setIsDrawing(true);
        },
        [activeTool]
    );

    // Mouse Move
    const handleMouseMove = useCallback(
        (e: any) => {
            if (!fabricCanvasRef.current || !isDrawing) return;

            const pointer = fabricCanvasRef.current.getScenePoint(e);
            const canvas = fabricCanvasRef.current;

            if (activeTool === 'pencil') {
                pointsRef.current.push({ x: pointer.x, y: pointer.y });
            } else if (activeTool === 'rect') {
                const width = Math.abs(pointer.x - startPointRef.current.x);
                const height = Math.abs(pointer.y - startPointRef.current.y);
                const left = Math.min(startPointRef.current.x, pointer.x);
                const top = Math.min(startPointRef.current.y, pointer.y);

                // Remove previous preview
                if (previewObjectRef.current) {
                    canvas.remove(previewObjectRef.current);
                }

                const rect = new Rect({
                    left,
                    top,
                    width,
                    height,
                    fill: 'transparent',
                    stroke: '#2EFF85',
                    strokeWidth: 2,
                });

                canvas.add(rect);
                previewObjectRef.current = rect;
                canvas.renderAll();
            } else if (activeTool === 'circle') {
                const dx = pointer.x - startPointRef.current.x;
                const dy = pointer.y - startPointRef.current.y;
                const radius = Math.sqrt(dx * dx + dy * dy) / 2;
                const left = startPointRef.current.x - radius;
                const top = startPointRef.current.y - radius;

                if (previewObjectRef.current) {
                    canvas.remove(previewObjectRef.current);
                }

                const circle = new Circle({
                    left,
                    top,
                    radius,
                    fill: 'transparent',
                    stroke: '#2EFF85',
                    strokeWidth: 2,
                });

                canvas.add(circle);
                previewObjectRef.current = circle;
                canvas.renderAll();
            } else if (activeTool === 'line' || activeTool === 'arrow') {
                if (previewObjectRef.current) {
                    canvas.remove(previewObjectRef.current);
                }

                const line = new Line(
                    [startPointRef.current.x, startPointRef.current.y, pointer.x, pointer.y],
                    {
                        stroke: '#2EFF85',
                        strokeWidth: 2,
                    }
                );

                canvas.add(line);
                previewObjectRef.current = line;
                canvas.renderAll();
            }
        },
        [isDrawing, activeTool]
    );

    // Mouse Up
    const handleMouseUp = useCallback(
        (e: any) => {
            if (!fabricCanvasRef.current) return;

            const canvas = fabricCanvasRef.current;
            const pointer = canvas.getScenePoint(e);

            if (activeTool === 'pencil' && pointsRef.current.length > 2) {
                const pathData = pointsRef.current.reduce((acc, point, idx) => {
                    return acc + (idx === 0 ? `M ${point.x} ${point.y}` : ` L ${point.x} ${point.y}`);
                }, '');

                const path = new Path(pathData, {
                    stroke: '#2EFF85',
                    strokeWidth: 2,
                    fill: 'transparent',
                });

                canvas.add(path);
                emitElement(path);
            } else {
                const objects = canvas.getObjects();
                if (objects.length > 0 && previewObjectRef.current === objects[objects.length - 1]) {
                    const preview = objects[objects.length - 1];
                    emitElement(preview);
                    previewObjectRef.current = null;
                }
            }

            canvas.renderAll();
            setIsDrawing(false);
            pointsRef.current = [];
        },
        [activeTool, emitElement]
    );

    // Text tool click handler
    const handleCanvasClick = useCallback(
        (e: any) => {
            if (activeTool !== 'text') return;

            const pointer = fabricCanvasRef.current?.getScenePoint(e);
            if (!pointer) return;

            const text = prompt('Enter text:');
            if (text) {
                const fabricText = new FabricText(text, {
                    left: pointer.x,
                    top: pointer.y,
                    fontSize: 16,
                    fill: '#2EFF85',
                });

                fabricCanvasRef.current?.add(fabricText);
                fabricCanvasRef.current?.renderAll();
                emitElement(fabricText);
            }
        },
        [activeTool, emitElement]
    );

    // Attach event listeners
    useEffect(() => {
        if (!fabricCanvasRef.current) return;

        const canvas = fabricCanvasRef.current;
        canvas.on('mouse:down', handleMouseDown);
        canvas.on('mouse:move', handleMouseMove);
        canvas.on('mouse:up', handleMouseUp);
        canvas.on('mouse:dblclick', handleCanvasClick);

        return () => {
            canvas.off('mouse:down', handleMouseDown);
            canvas.off('mouse:move', handleMouseMove);
            canvas.off('mouse:up', handleMouseUp);
            canvas.off('mouse:dblclick', handleCanvasClick);
        };
    }, [handleMouseDown, handleMouseMove, handleMouseUp, handleCanvasClick]);

    // Listen for incoming drawings
    useEffect(() => {
        if (!socket || !fabricCanvasRef.current) return;

        const handleIncomingDraw = (data: any) => {
            // Reconstruct fabric object from data and add to canvas
            console.log('Incoming draw:', data);
        };

        socket.on('draw', handleIncomingDraw);

        return () => {
            socket.off('draw', handleIncomingDraw);
        };
    }, [socket]);

    return (
        <canvas
            ref={canvasRef}
            className="w-full h-full"
            style={{ display: 'block' }}
        />
    );
};

export default DrawingCanvas;
