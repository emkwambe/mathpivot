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

// Smart AI response generator (replace with actual AI API call in production)
async function generateAIResponse(messages: Array<{ role: string; content: string }>): Promise<string> {
  // In production, this would call OpenAI, Anthropic, or another AI API
  // For now, we'll use a contextual response generator

  const lastUserMessage = messages.filter(m => m.role === 'user').pop()?.content || '';
  const previousMessages = messages.filter(m => m.role !== 'system');
  const systemPrompt = messages.find(m => m.role === 'system')?.content || '';

  // Extract student name from system prompt
  const nameMatch = systemPrompt.match(/helping (\w+),/);
  const studentName = nameMatch ? nameMatch[1] : 'there';

  // Get conversation context to avoid repetition
  const previousAssistantResponses = messages.filter(m => m.role === 'assistant').map(m => m.content);
  const isFollowUp = previousMessages.length > 2;

  const lowerMessage = lastUserMessage.toLowerCase().trim();

  // Check if this is a follow-up question about a method
  if (isFollowUp) {
    const lastAssistantMessage = previousAssistantResponses[previousAssistantResponses.length - 1] || '';

    // Quadratic formula follow-up
    if (lowerMessage.includes('quadratic formula') || lowerMessage === 'quadratic formula') {
      return `The **Quadratic Formula** is one of my favorites! Here it is:\n\n> **x = (-b ± √(b² - 4ac)) / 2a**\n\nFor any equation in the form **ax² + bx + c = 0**, you just plug in the values.\n\n**Let's practice!** Try this one:\n\n**x² + 5x + 6 = 0**\n\nCan you identify what a, b, and c are?`;
    }

    // Factoring follow-up
    if (lowerMessage.includes('factor') && lastAssistantMessage.includes('Factoring')) {
      return `**Factoring** is like reverse multiplication! Here's the process:\n\n**For x² + bx + c:**\n1. Find two numbers that **multiply** to c\n2. Those same numbers must **add** to b\n3. Write as (x + first number)(x + second number)\n\n**Example:** x² + 7x + 12\n- Need: multiply to 12, add to 7\n- Numbers: 3 and 4 ✓\n- Answer: **(x + 3)(x + 4)**\n\nWant to try one? Here's a practice problem:\n**x² + 5x + 6 = 0**`;
    }

    // Completing the square follow-up
    if (lowerMessage.includes('completing the square') || lowerMessage.includes('complete the square')) {
      return `**Completing the Square** transforms any quadratic into a perfect square form!\n\n**Steps:**\n1. Move the constant to the right side\n2. Take half of b, square it\n3. Add that value to both sides\n4. Factor the left side as a perfect square\n5. Solve by taking the square root\n\n**Example:** x² + 6x + 5 = 0\n\n1. x² + 6x = -5\n2. Half of 6 = 3, squared = 9\n3. x² + 6x + 9 = -5 + 9\n4. (x + 3)² = 4\n5. x + 3 = ±2, so x = -1 or x = -5\n\nWould you like to practice one together?`;
    }

    // Graphing follow-up
    if (lowerMessage.includes('graph')) {
      return `**Graphing quadratics** helps you visualize the solutions!\n\nQuadratic graphs are **parabolas** (U-shaped curves). Key points:\n\n- **Vertex** - the highest or lowest point\n- **x-intercepts** - where the parabola crosses the x-axis (these are your solutions!)\n- **y-intercept** - where it crosses the y-axis (when x=0)\n\n**To find solutions graphically:**\nLook for where the curve crosses the x-axis. Those x-values are your answers!\n\nShall I explain how to find the vertex, or would you like to try a specific problem?`;
    }
  }

  // Greeting
  if (lowerMessage.match(/^(hi|hello|hey|good morning|good afternoon|good evening)/)) {
    const greetings = [
      `Hey ${studentName}! 👋 Ready to tackle some math? What would you like to work on today?`,
      `Hello ${studentName}! 🌟 Great to see you! What math topic can I help you with?`,
      `Hi there, ${studentName}! 😊 I'm excited to help you learn. What's on your mind?`,
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  // Asking for help with a problem
  if (lowerMessage.includes('help') || lowerMessage.includes('stuck') || lowerMessage.includes("don't understand") || lowerMessage.includes("dont understand")) {
    return `I'm here for you, ${studentName}! 💪\n\nLet's work through this together. Tell me:\n\n1. **What's the problem or topic?**\n2. **What have you tried so far?**\n3. **Where exactly are you getting stuck?**\n\nRemember: being stuck means you're learning something new!`;
  }

  // Equation solving
  if (lowerMessage.includes('equation') || lowerMessage.includes('solve for') || (lowerMessage.includes('solve') && lowerMessage.includes('x'))) {
    return `Let's solve this equation! 🔢\n\n**Golden Rule:** Whatever you do to one side, do to the other!\n\n**Steps:**\n1. Simplify each side if needed\n2. Get all variables on one side\n3. Get all numbers on the other side\n4. Isolate the variable\n5. Check your answer by plugging it back in\n\nWhat equation are you working on? Share it and we'll solve it together!`;
  }

  // Fractions
  if (lowerMessage.includes('fraction') || lowerMessage.includes('numerator') || lowerMessage.includes('denominator')) {
    return `Fractions are just division in disguise! 🍕\n\n**Quick refresher:**\n- **Numerator** (top) = parts you have\n- **Denominator** (bottom) = total equal parts\n\n**Key operations:**\n- **Adding/Subtracting:** Need common denominators!\n- **Multiplying:** Multiply across (top × top, bottom × bottom)\n- **Dividing:** Flip the second fraction and multiply\n\nWhat operation are you working on?`;
  }

  // Geometry - Area
  if (lowerMessage.includes('area')) {
    return `**Area** measures the space inside a shape! 📐\n\n**Common formulas:**\n- **Rectangle:** A = length × width\n- **Triangle:** A = ½ × base × height\n- **Circle:** A = πr² (π times radius squared)\n- **Parallelogram:** A = base × height\n- **Trapezoid:** A = ½(b₁ + b₂) × height\n\nWhich shape are you working with?`;
  }

  // Geometry - Perimeter
  if (lowerMessage.includes('perimeter') || lowerMessage.includes('circumference')) {
    return `**Perimeter** is the distance around a shape! 📏\n\n**Formulas:**\n- **Rectangle:** P = 2(length + width)\n- **Square:** P = 4 × side\n- **Triangle:** P = side₁ + side₂ + side₃\n- **Circle (Circumference):** C = 2πr or πd\n\nWhat shape do you need help with?`;
  }

  // Triangle specific
  if (lowerMessage.includes('triangle')) {
    return `Triangles are fascinating! 🔺\n\n**Types by sides:**\n- **Equilateral** - all sides equal\n- **Isosceles** - two sides equal\n- **Scalene** - no sides equal\n\n**Types by angles:**\n- **Acute** - all angles < 90°\n- **Right** - one 90° angle\n- **Obtuse** - one angle > 90°\n\n**Key fact:** All angles add up to **180°**!\n\nWhat about triangles do you want to explore?`;
  }

  // Circle specific
  if (lowerMessage.includes('circle')) {
    return `Circles are all about **π** (pi ≈ 3.14159)! ⭕\n\n**Key terms:**\n- **Radius (r)** - center to edge\n- **Diameter (d)** - across through center (d = 2r)\n- **Circumference** - distance around: C = 2πr\n- **Area** - space inside: A = πr²\n\nWhat about circles do you need help with?`;
  }

  // Pythagorean theorem
  if (lowerMessage.includes('pythagorean') || lowerMessage.includes('pythagoras')) {
    return `The **Pythagorean Theorem** is a game-changer! 🎯\n\n> **a² + b² = c²**\n\nFor any **right triangle:**\n- a and b are the two shorter sides (legs)\n- c is the longest side (hypotenuse) - always opposite the right angle\n\n**Example:** If a = 3 and b = 4:\n- 3² + 4² = c²\n- 9 + 16 = c²\n- 25 = c²\n- c = 5 ✓\n\nWant to try one? What values do you have?`;
  }

  // Word problems
  if (lowerMessage.includes('word problem') || lowerMessage.includes('story problem')) {
    return `Word problems = detective work! 🕵️\n\n**My CUBES strategy:**\n- **C**ircle the numbers\n- **U**nderline the question\n- **B**ox key math words\n- **E**liminate unnecessary info\n- **S**olve and check!\n\n**Key words to look for:**\n- "total," "altogether," "sum" → Addition\n- "difference," "left," "remain" → Subtraction\n- "times," "product," "each" → Multiplication\n- "split," "per," "each" → Division\n\nShare your word problem and let's crack it!`;
  }

  // Quadratic equations
  if (lowerMessage.includes('quadratic') || lowerMessage.includes('x squared') || lowerMessage.includes('x^2') || lowerMessage.includes('x²')) {
    return `**Quadratic equations** have the form ax² + bx + c = 0 📈\n\n**Four ways to solve them:**\n\n1. **Factoring** - Quick when it works nicely\n2. **Quadratic Formula** - Works every time!\n3. **Completing the Square** - Great for vertex form\n4. **Graphing** - Visualize the solutions\n\nWhich method interests you? Pick one and I'll teach you step-by-step!`;
  }

  // Slope
  if (lowerMessage.includes('slope')) {
    return `**Slope** measures steepness! 📊\n\n**Formula:**\n> **m = (y₂ - y₁) / (x₂ - x₁)** = rise / run\n\n**Types of slopes:**\n- **Positive** ↗️ - goes up left to right\n- **Negative** ↘️ - goes down left to right\n- **Zero** → - horizontal line\n- **Undefined** ↕️ - vertical line\n\nDo you have two points to work with, or an equation?`;
  }

  // Linear equations / y = mx + b
  if (lowerMessage.includes('linear') || lowerMessage.includes('y = mx') || lowerMessage.includes('slope intercept')) {
    return `**Slope-Intercept Form:** y = mx + b 📉\n\n- **m** = slope (how steep)\n- **b** = y-intercept (where it crosses the y-axis)\n\n**Example:** y = 2x + 3\n- Slope = 2 (rises 2 for every 1 right)\n- Y-intercept = 3 (crosses y-axis at (0, 3))\n\nWhat would you like to do with linear equations?`;
  }

  // Exponents
  if (lowerMessage.includes('exponent') || lowerMessage.includes('power')) {
    return `**Exponents** are repeated multiplication! 💪\n\n**Key rules:**\n- **x^a × x^b = x^(a+b)** (multiply → add exponents)\n- **x^a ÷ x^b = x^(a-b)** (divide → subtract exponents)\n- **(x^a)^b = x^(ab)** (power of power → multiply)\n- **x^0 = 1** (anything to zero power = 1)\n- **x^(-n) = 1/x^n** (negative = reciprocal)\n\nWhich rule do you need to practice?`;
  }

  // Thank you
  if (lowerMessage.includes('thank') || lowerMessage.includes('thanks')) {
    const responses = [
      `You're welcome, ${studentName}! 🌟 You're doing great! What's next?`,
      `Anytime, ${studentName}! 💪 Keep up that awesome effort! Anything else?`,
      `Happy to help! 😊 Remember: every problem you solve makes you stronger!`,
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  // Yes/confirmation follow-up
  if (lowerMessage.match(/^(yes|yeah|yep|sure|ok|okay|please|let's|lets)$/)) {
    return `Great! Let's do it! 🚀\n\nTo get started, please share:\n- The specific problem or equation, OR\n- The concept you want to understand better\n\nI'll guide you through it step by step!`;
  }

  // Contains numbers (likely a specific problem)
  if (lastUserMessage.match(/\d+\s*[\+\-\*\/\=x²^]/)) {
    return `I see you have a problem to solve! 📝\n\nLet me help you work through: **${lastUserMessage}**\n\nFirst question: What type of problem is this?\n- An equation to solve?\n- An expression to simplify?\n- Something to calculate?\n\nOnce I know, I'll walk you through the steps!`;
  }

  // Explain/how questions
  if (lowerMessage.match(/^(how do|what is|explain|what's|whats|tell me)/)) {
    return `Great question! 🧠\n\nCould you be a bit more specific? Tell me:\n\n1. **The exact topic or concept**\n2. **What you already know about it**\n3. **What part confuses you**\n\nThis helps me give you the best explanation!`;
  }

  // Default fallback - make it helpful
  return `I'd love to help with that, ${studentName}! 📚\n\n**I can help you with:**\n- 🔢 **Algebra** - equations, expressions, functions\n- 📐 **Geometry** - shapes, area, angles, proofs\n- 📊 **Graphing** - slopes, lines, parabolas\n- 🧮 **Arithmetic** - fractions, decimals, percents\n- 📝 **Word Problems** - step-by-step strategies\n\nJust ask a question or share a problem, and we'll work through it together!`;
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
