"use client";
import { useState } from "react";
import ReactMarkdown from "react-markdown";

export default function Home() {
  const [message, setMessage] = useState("");
  const [id, setId] = useState("");
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [assistantRole, setAssistantRole] = useState(
    "You are an English professor/teacher. You are going to correct my grammar and make my tone sound natural and native. I also like using American slang. I am Vietnamese, so you should explain to me why I was wrong with that grammar, then point me to how to use it correctly. With strange words, you should explain it in Vietnamese"
  );

  const streaming = async (room_id) => {
    setResponse((prev) => prev + "   \n\n\n ## Assistant:     \n\n");

    if (!room_id) {
      room_id = id;
    }
    const path = `/api/chat/${room_id}`;
    const eventSource = new EventSource(path); // Connect to the SSE endpoint

    eventSource.onmessage = (event) => {
      // setResponse((prev) => prev + event.data); // Append streamed data
      setResponse((prev) => prev + event.data.replace(/\n/g, "\n> "));
    };

    eventSource.onerror = () => {
      console.log("Connection closed");
      eventSource.close(); // Close the connection on error
      setIsLoading(false);
    };

    eventSource.onopen = () => {
      console.log("Connection opened");
    };
  };

  const updateAssistant = async (e) => {
    // endpoint to update assistant
    // POST /api/chat/{id}/set_assistant
    e.preventDefault();
    setIsLoading(true);
    let msg_uri = `/api/chat/${id}/set_assistant`;

    if (!id) {
      const room_id = await createARoom(
        "Set assistant role and response to user to start the conversation"
      );
      if (room_id) {
        msg_uri = `/api/chat/${room_id}/set_assistant`;
        await streaming(room_id);
      } else {
        setResponse((prev) => prev + "Failed to create a room \n\n");
        setIsLoading(false);
        return;
      }
    }

    const body = { assistant: assistantRole };

    try {
      const res = await fetch(msg_uri, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        throw new Error("Failed to update assistant");
      }
    } catch (error) {
      setResponse(
        (prev) => prev + "Failed to update assistant" + error + "\n\n"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const createARoom = async (msg) => {
    const msg_uri = "/api/create_room";

    const body = { question: msg, assistant: assistantRole };

    try {
      const res = await fetch(msg_uri, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        throw new Error("Failed to send message");
      }

      const jsonData = await res.json();

      if (jsonData?.room_id) {
        setId(jsonData.room_id);
        return jsonData.room_id;
      }
    } catch (error) {
      setResponse((prev) => prev + "Failed to create a room " + error + "\n\n");
    }
  };

  const send_message = async (room_id, msg) => {
    const msg_uri = `/api/room/${room_id}/message`;

    const body = { message: msg };

    try {
      const res = await fetch(msg_uri, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        throw new Error("Failed to send message");
      }
    } catch (error) {
      setResponse((prev) => prev + "Failed to send message " + error + "\n\n");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setResponse((prev) => prev + "   \n\n\n ## User: " + message + "   \n\n");
    let msg_uri = "/api/create_room";

    var body = { question: message, assistant: assistantRole };
    let room_id = id;
    if (id) {
      await send_message(id, message);
    } else {
      room_id = await createARoom(message);
    }

    setMessage("");

    await streaming(room_id);

    setIsLoading(false);
  };

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-4 pb-20 gap-8 sm:p-10 w-full font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center w-full max-w-5xl">
        <div className="w-full backdrop-blur-sm rounded-lg shadow-md p-4 sm:p-6 mb-4 border border-gray-100">
          <div className="prose prose-slate w-full max-w-none">
            <ReactMarkdown
              components={{
                h2: ({ ...props }) => {
                  const content = props.children?.toString() || "";
                  if (content.includes("User:")) {
                    return (
                      <h2
                        className="font-medium text-blue-700 bg-blue-100 px-3 py-2 rounded-lg mt-6"
                        {...props}
                      />
                    );
                  } else if (content.includes("Assistant:")) {
                    return (
                      <h2
                        className="font-medium text-emerald-700 bg-emerald-100 px-3 py-2 rounded-lg mt-6"
                        {...props}
                      />
                    );
                  }
                  return <h2 {...props} />;
                },
                blockquote: ({ ...props }) => {
                  return (
                    <blockquote
                      className="pl-4 border-l-4 border-emerald-400 my-2 text-gray-700 bg-gray-50 rounded-md p-2"
                      {...props}
                    />
                  );
                },
              }}
            >
              {response}
            </ReactMarkdown>
          </div>
        </div>

        <div className="w-full mb-4">
          <label
            htmlFor="role"
            className="block mb-2 text-sm font-medium text-gray-700"
          >
            Assistant Role
          </label>
          <div className="relative">
            <textarea
              id="role"
              rows={3}
              value={assistantRole}
              disabled={isLoading}
              onChange={(e) => setAssistantRole(e.target.value)}
              placeholder="Define the assistant's personality and capabilities..."
              className="w-full p-3 pr-12 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  updateAssistant(e);
                }
              }}
            />
            <button
              type="button"
              onClick={updateAssistant}
              disabled={isLoading}
              className="absolute bottom-3 right-3 bg-green-500 hover:bg-green-600 text-white rounded-full p-2 transition-colors disabled:bg-green-300"
              aria-label="Set assistant role"
            >
              {isLoading ? "..." : "Set"}
            </button>
          </div>
        </div>

        <div className="w-full">
          <form onSubmit={handleSubmit} className="relative">
            <label
              htmlFor="message"
              className="block mb-2 text-sm font-medium text-gray-700"
            >
              Your Message
            </label>
            <div className="relative">
              <textarea
                id="message"
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={isLoading}
                placeholder="Type your message here..."
                className="w-full p-3 pr-12 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />
              <button
                type="submit"
                disabled={isLoading}
                className="absolute bottom-3 right-3 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-2 transition-colors disabled:bg-blue-300"
                aria-label="Send message"
              >
                {isLoading ? "..." : "Send"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
