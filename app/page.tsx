"use client";

import { FormEvent, useState } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const OLLAMA_URL =
  typeof window === "undefined"
    ? "http://localhost:11434"
    : `http://${window.location.hostname}:11434`;

export default function Home() {
  const [model, setModel] = useState("llama3.2:3b");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [connection, setConnection] = useState<"idle" | "connected" | "offline">("idle");

  const connectionDotClasses = {
    idle: "h-2.5 w-2.5 rounded-full bg-stone-300",
    connected: "h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.12)]",
    offline: "h-2.5 w-2.5 rounded-full bg-red-400",
  } as const;

  async function checkConnection() {
    try {
      const response = await fetch(`${OLLAMA_URL}/api/tags`);
      setConnection(response.ok ? "connected" : "offline");
    } catch {
      setConnection("offline");
    }
  }

  async function sendMessage() {
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
        setConnection("connected");
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error ?? "Ollama returned an error");
      }
      const data = await response.json();
      setMessages([...nextMessages, { role: "assistant", content: data.message?.content ?? "No response received." }]);
      setConnection("connected");
    } catch (error: unknown) {
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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage();
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-6 sm:px-7 lg:px-8">
      <a
        href="/.auth/login/aad"
        className="mb-5 inline-flex self-start rounded-xl border border-stone-200 bg-white/70 px-3 py-2 text-sm font-medium text-stone-700 shadow-sm transition hover:border-stone-300 hover:text-stone-900"
      >
        Sign in with Microsoft
      </a>

      <header className="flex items-center gap-3 rounded-2xl border border-stone-200/80 bg-white/80 px-4 py-3 shadow-sm backdrop-blur-sm">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#292722] text-lg text-[#f7f5ef] shadow-[0_4px_14px_rgba(30,28,24,0.15)]">
          ✦
        </div>
        <div className="min-w-0">
          <h1 className="m-0 text-[15px] font-semibold tracking-[-0.01em] text-stone-900">Local chat</h1>
          <p className="mt-1 text-xs text-stone-500">Ollama workspace</p>
        </div>

        <div className="ml-auto flex items-center gap-2 text-xs text-stone-500">
          <span className={connectionDotClasses[connection]} aria-hidden="true" />
          <span>
            {connection === "connected"
              ? "Connected"
              : connection === "offline"
                ? "Offline"
                : "Not checked"}
          </span>
          <button
            className="border-0 bg-transparent p-0 text-xs font-medium text-stone-800 underline decoration-from-font underline-offset-4"
            onClick={checkConnection}
            type="button"
          >
            Check
          </button>
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-start px-0 pb-8 pt-8 sm:pt-10" aria-live="polite">
        {messages.length === 0 ? (
          <div className="pt-[12vh] text-center">
            <div className="mx-auto mb-5 grid h-12 w-12 place-items-center rounded-[17px] bg-[#292722] text-2xl text-[#f7f5ef] shadow-[0_4px_14px_rgba(30,28,24,0.15)]">
              ✦
            </div>
            <h2 className="m-0 text-balance text-[clamp(22px,4vw,30px)] font-semibold tracking-[-0.04em] text-stone-900">
              What would you like to explore?
            </h2>
            <p className="mt-2.5 text-sm text-stone-500">
              Chat privately with a model running on your machine.
            </p>
          </div>
        ) : (
          messages.map((message, index) => (
            <article
              className={`mb-7 rounded-2xl border border-stone-200/80 bg-white/80 p-4 text-[15px] leading-7 text-stone-800 shadow-sm ${
                message.role === "user" ? "ml-4 border-l-4 border-stone-300 pl-5" : "mr-4"
              }`}
              key={`${message.role}-${index}`}
            >
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.08em] text-stone-500">
                {message.role === "user" ? "You" : "Ollama"}
              </span>
              <p className="m-0 whitespace-pre-wrap">{message.content}</p>
            </article>
          ))
        )}

        {isLoading && (
          <div className="flex gap-1.5 py-2">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-stone-400 [animation-delay:0ms]" />
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-stone-400 [animation-delay:150ms]" />
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-stone-400 [animation-delay:300ms]" />
          </div>
        )}
      </section>

      <form
        className="mx-auto mt-auto flex w-full max-w-3xl flex-col rounded-[25px] border border-stone-300/90 bg-white/70 p-4 shadow-[0_12px_35px_rgba(54,48,37,0.08),inset_0_0_0_4px_rgba(255,255,255,0.33)] backdrop-blur-md"
        onSubmit={handleSubmit}
      >
        <textarea
          aria-label="Message"
          className="block max-h-40 min-h-[28px] w-full resize-y border-0 bg-transparent px-1 py-1 text-[15px] leading-6 text-stone-900 outline-none placeholder:text-stone-400"
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

        <div className="mt-2.5 flex items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-[11px] text-stone-500">
            <span>Model</span>
            <input
              aria-label="Ollama model"
              className="w-[115px] rounded-xl border border-stone-300 bg-white/60 px-2.5 py-1.5 text-[12px] text-stone-800 outline-none transition focus:border-stone-500"
              onChange={(event) => setModel(event.target.value)}
              value={model}
            />
          </label>

          <button
            aria-label="Send message"
            className="grid h-8 w-8 place-items-center rounded-xl bg-[#292722] text-xl text-white transition hover:bg-[#1f1c18] disabled:cursor-default disabled:opacity-30"
            disabled={!input.trim() || isLoading}
            onClick={() => void sendMessage()}
            type="button"
          >
            ↑
          </button>
        </div>
      </form>

      <p className="mt-3 text-center text-xs text-stone-500">Your messages stay on this device.</p>
    </main>
  );
}
