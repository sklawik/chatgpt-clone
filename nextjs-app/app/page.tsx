"use client";

import { FormEvent, useState } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const OLLAMA_URL = "http://localhost:11434";

export default function Home() {
  const [model, setModel] = useState("llama3.2:3b");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [connection, setConnection] = useState<"idle" | "connected" | "offline">("idle");

  async function checkConnection() {
    try {
      const response = await fetch(`${OLLAMA_URL}/api/tags`);
      setConnection(response.ok ? "connected" : "offline");
    } catch {
      setConnection("offline");
    }
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = input.trim();
    if (!content || isLoading) return;

    const nextMessages = [...messages, { role: "user" as const, content }];
    setMessages(nextMessages);
    setInput("");
    setIsLoading(true);
    setConnection("idle");

    try {
      const response = await fetch(`${OLLAMA_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model, messages: nextMessages, stream: false }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error ?? "Ollama returned an error");
      }
      const data = await response.json();
      setMessages([...nextMessages, { role: "assistant", content: data.message?.content ?? "No response received." }]);
      setConnection("connected");
    } catch(error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown Ollama error";
      setMessages([
        ...nextMessages,
        { role: "assistant", content: `Ollama error: ${errorMessage}` },
      ]);
      setConnection("offline");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="chat-shell">
      <header className="topbar">
        <div className="brand-mark">✦</div>
        <div>
          <h1>Local chat</h1>
          <p>Ollama workspace</p>
        </div>
        <div className="connection-wrap">
          <span className={`status-dot ${connection}`} />
          <span>{connection === "connected" ? "Connected" : connection === "offline" ? "Offline" : "Not checked"}</span>
          <button className="check-button" onClick={checkConnection} type="button">Check</button>
        </div>
      </header>

      <section className="conversation" aria-live="polite">
        {messages.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">✦</div>
            <h2>What would you like to explore?</h2>
            <p>Chat privately with a model running on your machine.</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <article className={`message ${message.role}`} key={`${message.role}-${index}`}>
              <span className="message-label">{message.role === "user" ? "You" : "Ollama"}</span>
              <p>{message.content}</p>
            </article>
          ))
        )}
        {isLoading && <div className="thinking"><span /> <span /> <span /></div>}
      </section>

      <form className="composer" onSubmit={sendMessage}>
        <textarea
          aria-label="Message"
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
            }
          }}
          placeholder="Message your local model..."
          value={input}
          rows={1}
        />
        <div className="composer-footer">
          <label className="model-picker">
            <span>Model</span>
            <input aria-label="Ollama model" onChange={(event) => setModel(event.target.value)} value={model} />
          </label>
          <button className="send-button" disabled={!input.trim() || isLoading} aria-label="Send message" type="submit">↑</button>
        </div>
      </form>
      <p className="privacy-note">Your messages stay on this device.</p>
    </main>
  );
}
