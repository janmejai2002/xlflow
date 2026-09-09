import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

export function useMcpBridge({ onExecuteAction, localData }) {
  const [isConnected, setIsConnected] = useState(false);
  const [activeCommand, setActiveCommand] = useState(null);
  const socketRef = useRef(null);
  const actionHandlerRef = useRef(onExecuteAction);
  const localDataRef = useRef(localData);

  useEffect(() => {
    actionHandlerRef.current = onExecuteAction;
  }, [onExecuteAction]);

  useEffect(() => {
    localDataRef.current = localData;
    if (socketRef.current?.readyState === WebSocket.OPEN && localData) {
      socketRef.current.send(JSON.stringify({
        type: 'SNAPSHOT_UPDATE',
        payload: localData
      }));
    }
  }, [localData]);

  useEffect(() => {
    let socket = null;
    let reconnectTimer = null;
    let isUnmounted = false;

    const connect = () => {
      if (isUnmounted) return;
      try {
        socket = new WebSocket('ws://localhost:3100/ws');
        socketRef.current = socket;

        socket.onopen = () => {
          if (isUnmounted) return;
          setIsConnected(true);
          console.log('[MCP Bridge] Connected to localhost:3100/ws');
          if (localDataRef.current) {
            socket.send(JSON.stringify({
              type: 'SNAPSHOT_UPDATE',
              payload: localDataRef.current
            }));
          }
        };

        socket.onclose = () => {
          if (isUnmounted) return;
          setIsConnected(false);
          reconnectTimer = setTimeout(connect, 3000);
        };

        socket.onerror = () => {
          if (isUnmounted) return;
          setIsConnected(false);
        };

        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'EXECUTE_ACTION') {
              const { requestId, action, params } = data;

              const actionName = action.type || action.actionType || (typeof action === 'string' ? action : 'Action');
              const notif = {
                id: requestId,
                message: `${actionName} ${params?.tab || params?.courseCode || ''}`.trim()
              };
              setActiveCommand(notif);
              toast.info(`🤖 External AI: ${notif.message}`);
              setTimeout(() => setActiveCommand(null), 4000);

              // Execute local action
              let result = { status: 'success' };
              if (actionHandlerRef.current) {
                actionHandlerRef.current(action);
              }

              // Acknowledge back to MCP server
              if (socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({
                  type: 'RPC_RESPONSE',
                  requestId,
                  result
                }));
              }
            }
          } catch (e) {
            console.error('[MCP Bridge] Failed to parse socket message:', e);
          }
        };
      } catch (err) {
        if (!isUnmounted) {
          reconnectTimer = setTimeout(connect, 3000);
        }
      }
    };

    connect();

    return () => {
      isUnmounted = true;
      clearTimeout(reconnectTimer);
      if (socket) socket.close();
    };
  }, []);

  return { isConnected, activeCommand };
}
