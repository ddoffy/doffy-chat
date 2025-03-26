"use client";
import { useState } from "react";
import ReactMarkdown from "react-markdown";

export default function Home() {
  const [message, setMessage] = useState("");
  const [id, setId] = useState("");
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [assistantRole, setAssistantRole] = useState(
    "You are a helpful assistant",
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

    eventSource.onclose = () => {
      setIsLoading(false);
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
      const room_id = await createARoom("Set assistant role and response to user to start the conversation");
      if (room_id) {
        msg_uri = `/api/chat/${room_id}/set_assistant`;
        await streaming(room_id);
      }
      else {
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
      setResponse((prev) => prev + "Failed to update assistant \n\n");
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
      setResponse((prev) => prev + "Failed to create a room \n\n");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setResponse((prev) => prev + "   \n\n\n ## User: " + message + "   \n\n");
    let msg_uri = "/api/create_room";

    let body = { question: message };
    if (id) {
      msg_uri = `/api/room/${id}/message`;
      body = { message: message };
      console.log("URI: " + msg_uri);
    }

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
      }

      await streaming(jsonData?.room_id ?? id);
    } catch (error) {
      setResponse("Failed to send message");
    } finally {
      setMessage("");
    }
  };

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <div className="w-full max-w-4xl backdrop-blur-sm rounded-lg shadow-md p-6 mb-8 border border-gray-100">
          <div className="prose prose-slate max-w-none">
            <ReactMarkdown
              components={{
                h2: ({ node, ...props }) => {
                  const content = props.children?.toString() || "";
                  if (content.includes("User:")) {
                    return (
                      <h2
                        className="font-medium text-blue-700 bg-blue-50 px-3 py-2 rounded-lg mt-6"
                        {...props}
                      />
                    );
                  } else if (content.includes("Assistant:")) {
                    return (
                      <h2
                        className="font-medium text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg mt-6"
                        {...props}
                      />
                    );
                  }
                  return <h2 {...props} />;
                },
                blockquote: ({ node, ...props }) => {
                  return (
                    <div
                      className="pl-4 border-l-4 border-emerald-300 my-2 text-gray-800"
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

        <div className="w-full max-w-4xl mb-6">
          <label
            htmlFor="role"
            className="block mb-2 text-sm font-medium text-gray-700"
          >
            Assistant Role
          </label>
          <textarea
            id="role"
            rows={2}
            value={assistantRole}
            disabled={isLoading}
            onChange={(e) => setAssistantRole(e.target.value)}
            placeholder="Define the assistant's personality and capabilities..."
            className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                updateAssistant(e);
              }
            }}
          />
        </div>

        <div className="w-full max-w-3xl">
          <form onSubmit={handleSubmit} className="relative flex items-center">
            <textarea
              rows={2}
              cols={50}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here..."
              className="w-full p-4 pr-12 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
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
              className="absolute right-3 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-2 transition-colors"
              aria-label="Send message"
            >
              {isLoading ? "Sending..." : "Send"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
