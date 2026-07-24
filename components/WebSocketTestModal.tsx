"use client";

import { useState, useEffect, useRef } from "react";
import { X, Radio, Send, Play, Square, Activity, ArrowDownLeft, ArrowUpRight } from "lucide-react";

interface SocketFrame {
  id: string;
  direction: "in" | "out";
  data: any;
  timestamp: string;
}

interface WebSocketTestModalProps {
  onClose: () => void;
}

export function WebSocketTestModal({ onClose }: WebSocketTestModalProps) {
  const [connected, setConnected] = useState<boolean>(false);
  const [frames, setFrames] = useState<SocketFrame[]>([]);
  const [sendText, setSendText] = useState<string>(
    JSON.stringify({ action: "subscribe", channel: "ticker", symbol: "BTC-USD" }, null, 2)
  );

  const eventSourceRef = useRef<EventSource | null>(null);

  const handleConnect = () => {
    if (connected) {
      if (eventSourceRef.current) eventSourceRef.current.close();
      setConnected(false);
      return;
    }

    setConnected(true);
    const es = new EventSource("/api/v1/ws");
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        const newFrame: SocketFrame = {
          id: Math.random().toString(36).substring(2, 9),
          direction: "in",
          data: parsed,
          timestamp: new Date().toLocaleTimeString(),
        };
        setFrames((prev) => [newFrame, ...prev.slice(0, 49)]);
      } catch (err) {
        // ignore parse error
      }
    };

    es.onerror = () => {
      es.close();
      setConnected(false);
    };
  };

  const handleSendMessage = async () => {
    if (!sendText.trim()) return;
    let parsed: any = sendText;
    try {
      parsed = JSON.parse(sendText);
    } catch (e) {
      // string payload
    }

    const outFrame: SocketFrame = {
      id: Math.random().toString(36).substring(2, 9),
      direction: "out",
      data: parsed,
      timestamp: new Date().toLocaleTimeString(),
    };

    setFrames((prev) => [outFrame, ...prev.slice(0, 49)]);

    try {
      const res = await fetch("/api/v1/ws", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });
      const echoData = await res.json();
      const echoFrame: SocketFrame = {
        id: Math.random().toString(36).substring(2, 9),
        direction: "in",
        data: echoData,
        timestamp: new Date().toLocaleTimeString(),
      };
      setFrames((prev) => [echoFrame, ...prev.slice(0, 49)]);
    } catch (err) {
      // echo failed
    }
  };

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) eventSourceRef.current.close();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-mb-surface border border-mb-border rounded-xl max-w-2xl w-full p-6 space-y-5 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-mb-border pb-4 shrink-0">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-mb-text" />
            <h2 className="text-base font-semibold text-mb-text">Mock WebSocket Test Bench</h2>
            <span
              className={`text-3xs font-mono font-semibold px-2 py-0.5 rounded border ${
                connected
                  ? "bg-mb-surface text-mb-text border-mb-border"
                  : "bg-mb-surface text-mb-text-tertiary border-mb-border"
              }`}
            >
              {connected ? "● Connected (Streaming)" : "○ Disconnected"}
            </span>
          </div>
          <button onClick={onClose} className="text-mb-text-tertiary hover:text-mb-text transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Connection Control Bar */}
        <div className="flex items-center justify-between gap-3 p-3 bg-mb-bg border border-mb-border rounded-lg shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <Activity className="w-4 h-4 text-mb-text-tertiary shrink-0" />
            <span className="text-xs font-mono text-mb-text truncate">ws://localhost:3000/api/v1/ws</span>
          </div>
          <button
            onClick={handleConnect}
            className={`h-8 px-4 text-xs font-semibold inline-flex items-center gap-1.5 rounded transition-colors ${
              connected ? "bg-mb-surface border border-mb-border text-mb-text hover:bg-mb-surface-hover" : "mb-btn-primary"
            }`}
          >
            {connected ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{connected ? "Disconnect" : "Connect Socket"}</span>
          </button>
        </div>

        {/* Message Dispatcher & Frame Inspector Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-0">
          {/* Send Message Area */}
          <div className="space-y-2 flex flex-col">
            <label className="block text-3xs font-mono text-mb-text-tertiary uppercase">Send Client Frame (JSON)</label>
            <textarea
              value={sendText}
              onChange={(e) => setSendText(e.target.value)}
              rows={6}
              className="flex-1 w-full bg-mb-bg border border-mb-border rounded-md p-3 text-xs font-mono text-mb-text focus:outline-none leading-relaxed"
            />
            <button
              onClick={handleSendMessage}
              className="mb-btn-secondary h-8 px-3 text-xs inline-flex items-center justify-center gap-1.5 w-full"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Frame to Server</span>
            </button>
          </div>

          {/* Live Streaming Frames Stream */}
          <div className="space-y-2 flex flex-col min-h-0">
            <div className="flex items-center justify-between">
              <span className="text-3xs font-mono text-mb-text-tertiary uppercase">Real-Time Frames ({frames.length})</span>
              {frames.length > 0 && (
                <button onClick={() => setFrames([])} className="text-3xs text-mb-text-tertiary hover:text-mb-text">
                  Clear Logs
                </button>
              )}
            </div>
            <div className="flex-1 bg-mb-bg border border-mb-border rounded-md p-3 overflow-y-auto space-y-2 font-mono text-3xs">
              {frames.map((frame) => (
                <div key={frame.id} className="p-2 rounded bg-mb-surface border border-mb-border space-y-1">
                  <div className="flex items-center justify-between text-mb-text-tertiary">
                    <span className="flex items-center gap-1">
                      {frame.direction === "in" ? (
                        <ArrowDownLeft className="w-3 h-3 text-mb-text" />
                      ) : (
                        <ArrowUpRight className="w-3 h-3 text-mb-text-tertiary" />
                      )}
                      <span>{frame.direction === "in" ? "RECV (Server)" : "SENT (Client)"}</span>
                    </span>
                    <span>{frame.timestamp}</span>
                  </div>
                  <pre className="text-mb-text overflow-x-auto whitespace-pre-wrap leading-relaxed">
                    {JSON.stringify(frame.data, null, 2)}
                  </pre>
                </div>
              ))}

              {frames.length === 0 && (
                <div className="text-center py-10 text-mb-text-tertiary">
                  Click &quot;Connect Socket&quot; to begin receiving live WebSocket frames.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
