'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Canvas, Rect, Circle, Line, Path, IText, FabricImage, PencilBrush, util } from 'fabric';
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

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !fabricCanvasRef.current) return;

        const reader = new FileReader();
        reader.onload = (f) => {
            const data = f.target?.result as string;
            // Create a fabric image object from URL
            FabricImage.fromURL(data).then((img) => {
                // Scale down if image is too large
                const canvas = fabricCanvasRef.current;
                if (!canvas) return;

                if (img.width && img.height) {
                    const maxWidth = canvas.width ? canvas.width * 0.8 : 800;
                    const maxHeight = canvas.height ? canvas.height * 0.8 : 600;

                    if (img.width > maxWidth || img.height > maxHeight) {
                        const scale = Math.min(maxWidth / img.width, maxHeight / img.height);
                        img.scaleX = scale;
                        img.scaleY = scale;
                    }
                }

                // Center image
                if (canvas.width && canvas.height && img.width && img.height) {
                    img.set({
                        left: (canvas.width - img.width * img.scaleX) / 2,
                        top: (canvas.height - img.height * img.scaleY) / 2,
                    });
                } else {
                    img.set({ left: 100, top: 100 });
                }

                img.set({
                    hasControls: true,
                    hasBorders: true,
                    selectable: true,
                });

                canvas.add(img);
                canvas.setActiveObject(img);
                canvas.renderAll();
                emitElement(img);
            });
        };
        reader.readAsDataURL(file);

        // Reset the input value so user can upload the same image again if needed
        e.target.value = '';
    };

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

    // Handle delete keyboard interactions dynamically 
    useEffect(() => {
        if (!fabricCanvasRef.current) return;
        const canvas = fabricCanvasRef.current;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Delete' || e.key === 'Backspace') {
                const activeObjects = canvas.getActiveObjects();
                if (activeObjects.length > 0) {
                    const isEditing = activeObjects.some((obj: any) => obj.isEditing);
                    const activeElement = document.activeElement;
                    const isInputFocused = activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA';

                    if (!isEditing && !isInputFocused) {
                        activeObjects.forEach((obj: any) => {
                            if (obj.id && socket && roomId) {
                                socket.emit('delete-shape', { roomId, id: obj.id });
                            }
                            canvas.remove(obj);
                        });
                        canvas.discardActiveObject();
                        canvas.renderAll();
                    }
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [socket, roomId]);

    // Set canvas cursor based on tool
    useEffect(() => {
        if (!fabricCanvasRef.current) return;

        const canvas = fabricCanvasRef.current;
        const isPencil = activeTool === 'pencil';

        canvas.isDrawingMode = isPencil;
        if (isPencil) {
            if (!canvas.freeDrawingBrush) {
                canvas.freeDrawingBrush = new PencilBrush(canvas);
            }
            canvas.freeDrawingBrush.color = '#2EFF85';
            canvas.freeDrawingBrush.width = 4;
        }

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

        canvas.defaultCursor = cursorMap[activeTool] || 'default';
    }, [activeTool]);

    const emitElement = useCallback(
        (element: any) => {
            if (!element.id) {
                element.id = Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
            }
            if (socket && roomId) {
                const data = element.toJSON();
                // Ensure id is part of the serialization if needed, or stick it directly onto the payload.
                data.id = element.id;

                socket.emit('draw', {
                    roomId,
                    element: {
                        id: element.id,
                        type: element.type,
                        left: element.left,
                        top: element.top,
                        width: element.width,
                        height: element.height,
                        fill: element.fill,
                        stroke: element.stroke,
                        strokeWidth: element.strokeWidth,
                        data: data,
                    },
                });
            }
        },
        [socket, roomId]
    );

    // Track when user modifies anything
    useEffect(() => {
        if (!fabricCanvasRef.current) return;
        const canvas = fabricCanvasRef.current;

        const onObjectModified = (e: any) => {
            if (e.target) {
                emitElement(e.target);
            }
        };

        canvas.on('object:modified', onObjectModified);

        return () => {
            canvas.off('object:modified', onObjectModified);
        };
    }, [emitElement]);

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

            if (activeTool === 'text') {
                const textNode = new IText('Type something...', {
                    left: pointer.x,
                    top: pointer.y,
                    fontSize: 20,
                    fill: '#2EFF85',
                    fontFamily: 'sans-serif',
                    hasControls: true,
                    hasBorders: true,
                    selectable: true,
                });

                canvas.add(textNode);
                canvas.setActiveObject(textNode);
                textNode.enterEditing();
                textNode.selectAll();
                canvas.renderAll();
                emitElement(textNode);

                // Return early so we don't start drawing lines/shapes
                return;
            }

            if (activeTool === 'pencil') {
                // Native Fabric drawing mode handles this
                return;
            }

            setIsDrawing(true);
        };

        const onMouseMove = (e: any) => {
            if (!isDrawing) return;

            const pointer = canvas.getScenePoint(e);

            if (activeTool === 'pencil') {
                return;
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

                if (activeTool === 'arrow') {
                    const dx = pointer.x - startPointRef.current.x;
                    const dy = pointer.y - startPointRef.current.y;
                    const angle = Math.atan2(dy, dx);
                    const headlen = 15; // length of head in pixels

                    const x2 = pointer.x;
                    const y2 = pointer.y;
                    const x1 = startPointRef.current.x;
                    const y1 = startPointRef.current.y;

                    const pathData = `M ${x1} ${y1} L ${x2} ${y2} M ${x2} ${y2} L ${x2 - headlen * Math.cos(angle - Math.PI / 6)} ${y2 - headlen * Math.sin(angle - Math.PI / 6)} M ${x2} ${y2} L ${x2 - headlen * Math.cos(angle + Math.PI / 6)} ${y2 - headlen * Math.sin(angle + Math.PI / 6)}`;

                    const arrow = new Path(pathData, {
                        stroke: '#2EFF85',
                        strokeWidth: 2,
                        fill: null,
                        strokeUniform: true,
                        hasControls: false,
                        hasBorders: false,
                        selectable: false,
                    });

                    canvas.add(arrow);
                    previewObjectRef.current = arrow;
                } else {
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
                }

                canvas.renderAll();
            }
        };

        const onMouseUp = (e: any) => {
            const pointer = canvas.getScenePoint(e);

            if (activeTool === 'pencil') {
                return;
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

        const onPathCreated = (e: any) => {
            if (activeTool === 'pencil') {
                const path = e.path;
                path.set({
                    strokeUniform: true,
                    selectable: true,
                    hasControls: true,
                    hasBorders: true,
                });
                emitElement(path);
            }
        };

        canvas.on('mouse:down', onMouseDown);
        canvas.on('mouse:move', onMouseMove);
        canvas.on('mouse:up', onMouseUp);
        canvas.on('path:created', onPathCreated);

        return () => {
            canvas.off('mouse:down', onMouseDown);
            canvas.off('mouse:move', onMouseMove);
            canvas.off('mouse:up', onMouseUp);
            canvas.off('path:created', onPathCreated);
        };
    }, [activeTool, emitElement, isDrawing]);

    // Listen for incoming drawings
    useEffect(() => {
        if (!socket || !roomId || !fabricCanvasRef.current) return;

        const canvas = fabricCanvasRef.current;

        const handleIncomingDraw = (data: any) => {
            const { element } = data;

            // Find if this object already exists
            const existingObjects = canvas.getObjects() as any[];
            const existingObj = existingObjects.find(o => o.id === element.id || (o as any).data?.id === element.id);

            // Basic object reconstruction
            util.enlivenObjects([element.data]).then((enlivenedObjects: any) => {
                if (enlivenedObjects && enlivenedObjects.length > 0) {
                    const obj = enlivenedObjects[0];
                    obj.id = element.id;  // preserve id
                    obj.set({
                        hasControls: true,
                        hasBorders: true,
                        selectable: true,
                    });

                    if (existingObj) {
                        // Replace existing object with updated one
                        canvas.remove(existingObj);
                    }

                    canvas.add(obj);
                    canvas.renderAll();
                }
            });
        };

        const handleCanvasData = (shapes: any[]) => {
            canvas.clear();
            const shapeDatas = shapes.map(s => s.data);
            util.enlivenObjects(shapeDatas).then((enlivenedObjects: any) => {
                enlivenedObjects.forEach((obj: any, index: number) => {
                    obj.id = shapes[index].id; // preserve id from server
                    obj.set({
                        hasControls: true,
                        hasBorders: true,
                        selectable: true,
                    });
                    canvas.add(obj);
                });
                canvas.renderAll();
            });
        };

        const handleIncomingDelete = (id: string) => {
            const existingObjects = canvas.getObjects() as any[];
            const existingObj = existingObjects.find(o => o.id === id || (o as any).data?.id === id);

            if (existingObj) {
                canvas.remove(existingObj);
                canvas.renderAll();
            }
        };

        const handleConnect = () => {
            socket.emit('get-canvas', roomId);
        };

        socket.on('connect', handleConnect);

        // Trigger immediately if already connected
        if (socket.connected) {
            socket.emit('get-canvas', roomId);
        }

        socket.on('draw', handleIncomingDraw);
        socket.on('canvas-data', handleCanvasData);
        socket.on('delete-shape', handleIncomingDelete);

        return () => {
            socket.off('connect', handleConnect);
            socket.off('draw', handleIncomingDraw);
            socket.off('canvas-data', handleCanvasData);
            socket.off('delete-shape', handleIncomingDelete);
        };
    }, [socket, roomId]);

    return (
        <>
            <canvas
                ref={canvasRef}
                className="w-full h-full"
                style={{ display: 'block' }}
            />
            <input
                type="file"
                id="canvas-image-upload"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
            />
        </>
    );
};

export default DrawingCanvas;
