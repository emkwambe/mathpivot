import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getCurrentUser } from "@/lib/auth";
import {
  getStudentContext,
  getOrCreateConversation,
  getConversationHistory,
  buildChatMessages,
  saveMessage,
  updateConversationTitle,
} from "@/lib/ai/tutor-chat";

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Fallback response when API is unavailable
function getFallbackResponse(
  messages: Array<{ role: string; content: string }>,
): string {
  const systemPrompt = messages.find((m) => m.role === "system")?.content || "";
  const nameMatch = systemPrompt.match(/helping (\w+),/);
  const studentName = nameMatch ? nameMatch[1] : "there";

  return `Hi ${studentName}! I'm your AI Math Coach, but I'm currently running in offline mode.

**I can help you with:**
- Algebra (equations, expressions, functions)
- Geometry (shapes, area, angles)
- Graphing (slopes, lines, parabolas)
- Arithmetic (fractions, decimals, percents)
- Word Problems (step-by-step strategies)

Please ask your teacher to ensure the AI service is configured, or try again later!`;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only students can use the chat (parents can view but not chat)
    if (user.role !== "student" && user.role !== "admin") {
      return NextResponse.json(
        { error: "Only students can use the AI tutor chat" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { message, conversationId } = body;

    if (
      !message ||
      typeof message !== "string" ||
      message.trim().length === 0
    ) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 },
      );
    }

    // Get student context - if not found, create a default context
    let context = await getStudentContext(user.id);
    if (!context) {
      // Use default context for students without a full profile
      context = {
        studentName: user.fullName?.split(" ")[0] || "there",
        gradeLevel: 9,
        courseTrack: "general_math",
        recentSkills: [],
        masteryLevels: {},
        goals: undefined,
      };
    }

    // Get or create conversation
    const convoId = await getOrCreateConversation(user.id, conversationId);

    // Get conversation history
    const history = await getConversationHistory(convoId);

    // Save user message
    await saveMessage(convoId, "user", message.trim());

    // Update title if this is the first message
    if (history.length === 0) {
      await updateConversationTitle(convoId, message.trim());
    }

    // Build messages for AI
    const messages = buildChatMessages(context, history, message.trim());

    // Check if API key is configured - use non-streaming fallback
    if (!process.env.ANTHROPIC_API_KEY) {
      console.warn("ANTHROPIC_API_KEY not set - using fallback response");
      const fallbackResponse = getFallbackResponse(messages);
      await saveMessage(convoId, "assistant", fallbackResponse);
      return NextResponse.json({
        conversationId: convoId,
        message: fallbackResponse,
      });
    }

    // Extract system prompt and conversation messages for streaming
    const systemPrompt =
      messages.find((m) => m.role === "system")?.content || "";
    const conversationMessages = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

    const encoder = new TextEncoder();

    // Create streaming response
    const stream = new ReadableStream({
      async start(controller) {
        let fullResponse = "";

        try {
          const anthropicStream = anthropic.messages.stream({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1024,
            system: systemPrompt,
            messages: conversationMessages,
          });

          for await (const event of anthropicStream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              const text = event.delta.text;
              fullResponse += text;
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ text })}\n\n`),
              );
            }
          }

          // Save complete response to database
          await saveMessage(convoId, "assistant", fullResponse);

          // Send completion event with conversationId
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ done: true, conversationId: convoId })}\n\n`,
            ),
          );
        } catch (error) {
          console.error("Streaming error:", error);
          // Send error event
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: "Failed to generate response" })}\n\n`,
            ),
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("AI Chat error:", error);
    return NextResponse.json(
      { error: "Failed to process chat message" },
      { status: 500 },
    );
  }
}

// GET: Retrieve conversation history
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversationId");

    if (conversationId) {
      // Get specific conversation
      const history = await getConversationHistory(conversationId);
      return NextResponse.json({ messages: history });
    }

    // Get list of conversations
    const { getStudentConversations } = await import("@/lib/ai/tutor-chat");
    const conversations = await getStudentConversations(user.id);
    return NextResponse.json({ conversations });
  } catch (error) {
    console.error("AI Chat GET error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve chat data" },
      { status: 500 },
    );
  }
}
