import React, { useState, useEffect, useRef } from "react";
import { Mic, Send, X, Square, MessageCircle, Play } from "lucide-react";
import canarinhoAvatar from "@/assets/canarinho.png";

export interface Message {
  id: string;
  sender: "user" | "bot";
  type: "text" | "audio";
  content: string;
  audioUrl?: string;
}

interface AssistantChatProps {
  onClose: () => void;
}

export default function AssistantChat({ onClose }: AssistantChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      sender: "bot",
      type: "text",
      content: "Olá! Sou o Canarinho, seu ajudante no CAR. Mande uma mensagem de texto ou grave um áudio se estiver com dúvidas!",
    },
  ]);
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  useEffect(() => {
    // Disable body scroll when chat is open
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const simulateBotResponse = () => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: "bot",
          type: "text",
          content: "Legal! Como este é um protótipo, eu ainda estou aprendendo, mas lembre-se: a aba 'Cadastrar' é onde tudo começa no SICAR!",
        },
      ]);
    }, 1500);
  };

  const handleSendText = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        sender: "user",
        type: "text",
        content: input.trim(),
      },
    ]);
    setInput("");
    simulateBotResponse();
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            sender: "user",
            type: "audio",
            content: "Áudio enviado",
            audioUrl,
          },
        ]);
        
        // Cleanup stream tracks
        stream.getTracks().forEach((track) => track.stop());
        simulateBotResponse();
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      alert("Não foi possível acessar o microfone. Verifique as permissões.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="fixed inset-0 z-[10000] flex flex-col bg-background animate-in slide-in-from-bottom-full duration-300 sm:items-center sm:justify-end sm:bg-foreground/40 sm:p-5">
      <div className="flex h-full w-full flex-col bg-background sm:max-h-[85vh] sm:max-w-md sm:rounded-3xl sm:shadow-2xl overflow-hidden relative">
        
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border/40 px-5 py-4 bg-white">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img src={canarinhoAvatar} alt="Canarinho" className="h-10 w-10 drop-shadow-sm" />
              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500"></span>
            </div>
            <div>
              <h2 className="text-sm font-black tracking-wider text-foreground">Canarinho Virtual</h2>
              <p className="text-xs font-bold text-primary">Online agora</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full bg-muted p-2 text-muted-foreground hover:bg-muted/80">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Message List */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto bg-[oklch(0.97_0.01_200)] p-5 space-y-4">
          {messages.map((msg) => {
            const isBot = msg.sender === "bot";
            return (
              <div key={msg.id} className={`flex w-full ${isBot ? "justify-start" : "justify-end"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                    isBot
                      ? "rounded-tl-sm border border-border/40 bg-white text-foreground"
                      : "rounded-tr-sm bg-primary text-primary-foreground"
                  }`}
                >
                  {msg.type === "text" ? (
                    <p className="text-sm font-semibold leading-snug">{msg.content}</p>
                  ) : (
                    <div className="flex items-center gap-3">
                      <button className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20">
                        <Play className="h-4 w-4 fill-current" />
                      </button>
                      <div className="h-2 flex-1 rounded-full bg-white/30 w-24">
                        <div className="h-full w-1/3 rounded-full bg-white"></div>
                      </div>
                      <span className="text-xs font-bold">{msg.content}</span>
                      {/* Hidden audio element just to store the blob if we wanted to actually play it */}
                      {msg.audioUrl && <audio src={msg.audioUrl} className="hidden" />}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {isTyping && (
            <div className="flex w-full justify-start">
              <div className="rounded-2xl rounded-tl-sm border border-border/40 bg-white px-4 py-3 shadow-sm">
                <div className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary/60"></span>
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary/60" style={{ animationDelay: "150ms" }}></span>
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary/60" style={{ animationDelay: "300ms" }}></span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="shrink-0 border-t border-border/40 bg-white p-4">
          {isRecording ? (
            <div className="flex items-center justify-between rounded-full bg-destructive/10 px-4 py-2">
              <div className="flex items-center gap-3">
                <div className="relative flex h-8 w-8 items-center justify-center">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75"></span>
                  <span className="relative inline-flex h-4 w-4 rounded-full bg-destructive"></span>
                </div>
                <span className="text-sm font-black text-destructive tracking-widest">{formatTime(recordingTime)}</span>
              </div>
              <button
                onClick={stopRecording}
                className="flex h-10 items-center gap-2 rounded-full bg-destructive px-4 text-xs font-black uppercase text-white shadow-[0_3px_0_0_#991b1b] active:translate-y-0.5 active:shadow-none"
              >
                <Square className="h-4 w-4 fill-current" />
                Parar
              </button>
            </div>
          ) : (
            <form onSubmit={handleSendText} className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Diga algo pro Canarinho..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 rounded-full border-2 border-border bg-muted/30 px-5 py-3 text-sm font-bold placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-0"
              />
              {input.trim() ? (
                <button
                  type="submit"
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_3px_0_0_var(--color-primary-shadow)] active:translate-y-0.5 active:shadow-none transition-transform"
                >
                  <Send className="h-5 w-5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startRecording}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_3px_0_0_var(--color-primary-shadow)] active:translate-y-0.5 active:shadow-none transition-transform"
                >
                  <Mic className="h-5 w-5" />
                </button>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
