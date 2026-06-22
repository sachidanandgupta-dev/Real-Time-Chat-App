import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./useAuth";
import { API_URL } from "../api/axios";
import { SocketContext } from "./socket-context-base";

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!user || !token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clearing the socket on logout is intentional
      setSocket(null);
      return;
    }

    const newSocket = io(API_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    newSocket.on("connect", () => setConnected(true));
    newSocket.on("disconnect", () => setConnected(false));
    newSocket.on("connect_error", (err) => {
      console.error("Socket connection error:", err.message);
      setConnected(false);
    });
    newSocket.on("online_users", (ids) => setOnlineUserIds(ids));

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id]);

  const value = { socket, connected, onlineUserIds };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}
