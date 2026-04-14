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
            // Configure selection styling
            selectionColor: 'rgba(46, 255, 133, 0.1)',
            selectionBorderColor: '#2EFF85',
            selectionLineWidth: 2,
            selectionCornerSize: 8,
            selectionCornerStyle: 'square',
            selectionDashArray: undefined,
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

    // Attach event listeners only once on mount, never detach/reattach
    useEffect(() => {
        if (!fabricCanvasRef.current) return;

        const canvas = fabricCanvasRef.current;

        // Handler wrappers that will persist throughout component lifetime
        const onMouseDown = (e: any) => {
            const pointer = canvas.getScenePoint(e);
            startPointRef.current = { x: pointer.x, y: pointer.y };
            pointsRef.current = [];

            if (activeTool === 'pointer') {
                return;
            }

            // If the user clicked on an existing object, allow them to move/interact rather than drawing a new one
            if (e.target) {
                return;
            }

            if (activeTool === 'pencil') {
                pointsRef.current = [{ x: pointer.x, y: pointer.y }];
            }

            setIsDrawing(true);
        };

        const onMouseMove = (e: any) => {
            if (!isDrawing) return;

            const pointer = canvas.getScenePoint(e);

            if (activeTool === 'pencil') {
                pointsRef.current.push({ x: pointer.x, y: pointer.y });
            } else if (activeTool === 'rect') {
                const width = Math.abs(pointer.x - startPointRef.current.x);
                const height = Math.abs(pointer.y - startPointRef.current.y);
                const left = Math.min(startPointRef.current.x, pointer.x);
                const top = Math.min(startPointRef.current.y, pointer.y);

                if (previewObjectRef.current) {
                    canvas.remove(previewObjectRef.current);
                }

                const rect = new Rect({
                    left,
                    top,
                    width,
                    height,
                    fill: null,
                    stroke: '#2EFF85',
                    strokeWidth: 2,
                    strokeUniform: true,
                    originX: 'left',
                    originY: 'top',
                    hasControls: false,
                    hasBorders: false,
                    selectable: false,
                });

                canvas.add(rect);
                previewObjectRef.current = rect;
                canvas.renderAll();
            } else if (activeTool === 'circle') {
                const width = Math.abs(pointer.x - startPointRef.current.x);
                const height = Math.abs(pointer.y - startPointRef.current.y);

                const diameter = Math.max(width, height);
                const radius = diameter / 2;

                const left = Math.min(startPointRef.current.x, pointer.x);
                const top = Math.min(startPointRef.current.y, pointer.y);

                if (previewObjectRef.current) {
                    canvas.remove(previewObjectRef.current);
                }

                const circle = new Circle({
                    left,
                    top,
                    radius,
                    fill: null,
                    stroke: '#2EFF85',
                    strokeWidth: 2,
                    strokeUniform: true,
                    originX: 'left',
                    originY: 'top',
                    hasControls: false,
                    hasBorders: false,
                    selectable: false,
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
                        strokeUniform: true,
                        hasControls: false,
                        hasBorders: false,
                        selectable: false,
                    }
                );

                canvas.add(line);
                previewObjectRef.current = line;
                canvas.renderAll();
            }
        };

        const onMouseUp = (e: any) => {
            const pointer = canvas.getScenePoint(e);

            if (activeTool === 'pencil' && pointsRef.current.length > 2) {
                const pathData = pointsRef.current.reduce((acc, point, idx) => {
                    return acc + (idx === 0 ? `M ${point.x} ${point.y}` : ` L ${point.x} ${point.y}`);
                }, '');

                const path = new Path(pathData, {
                    stroke: '#2EFF85',
                    strokeWidth: 2,
                    fill: null,
                    strokeUniform: true,
                    hasControls: true,
                    hasBorders: true,
                    selectable: true,
                });

                canvas.add(path);
                emitElement(path);
            } else {
                if (previewObjectRef.current) {
                    const preview = previewObjectRef.current;
                    preview.set({
                        hasControls: true,
                        hasBorders: true,
                        selectable: true,
                    });
                    canvas.setActiveObject(preview);
                    emitElement(preview);
                    previewObjectRef.current = null;
                }
            }

            canvas.renderAll();
            setIsDrawing(false);
            pointsRef.current = [];
        };

        const onCanvasClick = (e: any) => {
            if (activeTool !== 'text') return;

            const pointer = canvas?.getScenePoint(e);
            if (!pointer) return;

            const text = prompt('Enter text:');
            if (text) {
                const fabricText = new FabricText(text, {
                    left: pointer.x,
                    top: pointer.y,
                    fontSize: 16,
                    fill: '#2EFF85',
                    hasControls: true,
                    hasBorders: true,
                    selectable: true,
                });

                canvas?.add(fabricText);
                canvas?.renderAll();
                emitElement(fabricText);
            }
        };

        canvas.on('mouse:down', onMouseDown);
        canvas.on('mouse:move', onMouseMove);
        canvas.on('mouse:up', onMouseUp);
        canvas.on('mouse:dblclick', onCanvasClick);

        return () => {
            canvas.off('mouse:down', onMouseDown);
            canvas.off('mouse:move', onMouseMove);
            canvas.off('mouse:up', onMouseUp);
            canvas.off('mouse:dblclick', onCanvasClick);
        };
    }, [activeTool, emitElement, isDrawing]);

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
