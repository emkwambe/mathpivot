import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import {
  getStudentContext,
  getOrCreateConversation,
  getConversationHistory,
  buildChatMessages,
  saveMessage,
  updateConversationTitle,
} from '@/lib/ai/tutor-chat';

// Simple AI response generator (replace with actual AI API call in production)
async function generateAIResponse(messages: Array<{ role: string; content: string }>): Promise<string> {
  // In production, this would call OpenAI, Anthropic, or another AI API
  // For now, we'll use a smart response generator

  const lastUserMessage = messages.filter(m => m.role === 'user').pop()?.content || '';
  const systemPrompt = messages.find(m => m.role === 'system')?.content || '';

  // Extract student name from system prompt
  const nameMatch = systemPrompt.match(/helping (\w+),/);
  const studentName = nameMatch ? nameMatch[1] : 'there';

  // Detect intent and generate appropriate response
  const lowerMessage = lastUserMessage.toLowerCase();

  // Greeting
  if (lowerMessage.match(/^(hi|hello|hey|good morning|good afternoon)/)) {
    return `Hey ${studentName}! 👋 Great to see you! What math topic would you like to work on today? I'm here to help you understand and practice.`;
  }

  // Asking for help with a problem
  if (lowerMessage.includes('help') || lowerMessage.includes('stuck') || lowerMessage.includes("don't understand")) {
    return `I'd love to help you, ${studentName}! 🎯\n\nCan you tell me more about what you're working on? Share the problem or concept you're stuck on, and we'll work through it together step by step.\n\nRemember, getting stuck is part of learning - it means you're challenging yourself!`;
  }

  // Algebra-related
  if (lowerMessage.includes('equation') || lowerMessage.includes('solve for') || lowerMessage.includes('variable')) {
    return `Great question about equations! 📐\n\nLet's think about this step by step:\n\n1. **First**, identify what we're solving for\n2. **Then**, we'll isolate that variable\n3. **Finally**, we'll verify our answer\n\nCan you share the specific equation you're working with? I'll guide you through each step!`;
  }

  // Fractions
  if (lowerMessage.includes('fraction') || lowerMessage.includes('numerator') || lowerMessage.includes('denominator')) {
    return `Fractions can be tricky, but you've got this! 🍕\n\nThink of a fraction like slices of pizza:\n- The **denominator** (bottom) tells us how many equal slices the pizza is cut into\n- The **numerator** (top) tells us how many slices we have\n\nWhat specific operation with fractions are you working on? Adding? Multiplying? Simplifying?`;
  }

  // Geometry
  if (lowerMessage.includes('area') || lowerMessage.includes('perimeter') || lowerMessage.includes('triangle') || lowerMessage.includes('circle')) {
    return `I love geometry! 📐\n\nVisualizing shapes really helps with these problems. Let me know:\n- What shape are you working with?\n- What measurements do you have?\n- What are you trying to find?\n\nOnce I know these details, I can help you pick the right formula and work through it!`;
  }

  // Word problems
  if (lowerMessage.includes('word problem') || lowerMessage.includes('story problem')) {
    return `Word problems are like puzzles - let's crack this one together! 🧩\n\n**My strategy for word problems:**\n1. Read it twice - once to understand, once to find the facts\n2. Identify what we need to find (the question)\n3. List the given information\n4. Choose the operation(s) needed\n5. Solve and check if the answer makes sense\n\nShare the problem with me and we'll use this strategy!`;
  }

  // Quadratic equations
  if (lowerMessage.includes('quadratic') || lowerMessage.includes('x squared') || lowerMessage.includes('x^2')) {
    return `Quadratic equations are powerful! 📈\n\nWe have several methods to solve them:\n- **Factoring** - works well when the equation factors nicely\n- **Quadratic Formula** - works for any quadratic\n- **Completing the Square** - useful for certain forms\n- **Graphing** - helps visualize the solutions\n\nWhich method would you like to explore, or would you like help deciding which to use?`;
  }

  // General math question
  if (lowerMessage.includes('how do') || lowerMessage.includes('what is') || lowerMessage.includes('explain')) {
    return `Great question, ${studentName}! I can see you're thinking critically. 🤔\n\nTo give you the best explanation, can you:\n1. Tell me the specific concept or problem?\n2. Share what you already know about it?\n3. Let me know where you're getting confused?\n\nThis helps me tailor my explanation to exactly what you need!`;
  }

  // Thank you
  if (lowerMessage.includes('thank') || lowerMessage.includes('thanks')) {
    return `You're very welcome, ${studentName}! 🌟\n\nKeep up the great work! Remember:\n- Every problem you solve makes you stronger\n- It's okay to make mistakes - that's how we learn\n- I'm always here when you need help\n\nIs there anything else you'd like to work on?`;
  }

  // Default response for math questions
  if (lastUserMessage.match(/\d/) || lowerMessage.match(/(calculate|compute|find|what|how|solve)/)) {
    return `Let's work on this together, ${studentName}! 📝\n\nI want to make sure I understand your question correctly. Can you:\n1. Share the complete problem or equation?\n2. Tell me what you've tried so far?\n3. Point out where you're getting stuck?\n\nThis way, I can guide you to the solution rather than just giving you the answer - that's how real learning happens!`;
  }

  // Default fallback
  return `I'm here to help you with math, ${studentName}! 🎓\n\nYou can ask me about:\n- **Algebra** - equations, expressions, functions\n- **Geometry** - shapes, areas, angles\n- **Fractions & Decimals** - operations, conversions\n- **Word Problems** - breaking down real-world scenarios\n- **And much more!**\n\nWhat topic would you like to explore today?`;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only students can use the chat (parents can view but not chat)
    if (user.role !== 'student' && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only students can use the AI tutor chat' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { message, conversationId } = body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Get student context - if not found, create a default context
    let context = await getStudentContext(user.id);
    if (!context) {
      // Use default context for students without a full profile
      context = {
        studentName: user.fullName?.split(' ')[0] || 'there',
        gradeLevel: 9,
        courseTrack: 'general_math',
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
    await saveMessage(convoId, 'user', message.trim());

    // Update title if this is the first message
    if (history.length === 0) {
      await updateConversationTitle(convoId, message.trim());
    }

    // Build messages for AI
    const messages = buildChatMessages(context, history, message.trim());

    // Generate AI response
    const aiResponse = await generateAIResponse(messages);

    // Save AI response
    await saveMessage(convoId, 'assistant', aiResponse);

    return NextResponse.json({
      conversationId: convoId,
      message: aiResponse,
    });

  } catch (error) {
    console.error('AI Chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}

// GET: Retrieve conversation history
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');

    if (conversationId) {
      // Get specific conversation
      const history = await getConversationHistory(conversationId);
      return NextResponse.json({ messages: history });
    }

    // Get list of conversations
    const { getStudentConversations } = await import('@/lib/ai/tutor-chat');
    const conversations = await getStudentConversations(user.id);
    return NextResponse.json({ conversations });

  } catch (error) {
    console.error('AI Chat GET error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve chat data' },
      { status: 500 }
    );
  }
}
