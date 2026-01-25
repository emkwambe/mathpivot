/**
 * AI Tutor Chat Service
 * Provides intelligent math tutoring assistance to students
 */

import { createClient } from '@/lib/supabase/server';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface StudentContext {
  studentName: string;
  gradeLevel: number;
  courseTrack: string;
  recentSkills: string[];
  masteryLevels: Record<string, string>;
  goals?: string;
}

// System prompt for the AI tutor
function buildSystemPrompt(context: StudentContext): string {
  return `You are MathPivot AI Tutor, a friendly and encouraging math tutor helping ${context.studentName}, a Grade ${context.gradeLevel} student studying ${context.courseTrack.replace('_', ' ')}.

Student's learning context:
- Recent topics: ${context.recentSkills.length > 0 ? context.recentSkills.join(', ') : 'Getting started'}
- Goals: ${context.goals || 'Improve math skills'}

TEACHING APPROACH - Be Helpful AND Educational:

1. CONTEXTUAL QUESTIONS (Ask FIRST when needed):
   - If the question is vague or could have multiple answers: Ask 1-2 clarifying questions
   - If you need to understand their level: "Which course are you in?"
   - If you need to know what they've tried: "What have you attempted so far?"
   - If scope is unclear: "Is this for homework, test prep, or general understanding?"

2. DIRECT ANSWERS (Then provide IMMEDIATELY):
   - Once context is clear, answer fully and helpfully
   - Show complete solutions with explanations
   - Don't withhold information or make them guess
   - Be thorough but appropriate to their level

3. FOLLOW-UP (Optional, not required):
   - After answering, you MAY ask 1 practice question to reinforce
   - But only if natural, not forced

4. LATEX FORMATTING (CRITICAL - ALL MATH MUST USE LATEX):
   - ALWAYS wrap ALL math in dollar sign delimiters
   - Inline math: $x^2 + 1$
   - Display equations: $$x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$$
   - NEVER output raw text like: -b±√(b²-4ac)/2a
   - NEVER use Unicode: ², ³, √, ±, ×, ÷, π, θ
   - Use \\frac{numerator}{denominator} for ALL fractions
   - Use \\sqrt{x} for square roots
   - Use \\pm for plus/minus
   - Use \\pi for pi, \\times for multiply, \\div for divide

Examples of CORRECT behavior:

GOOD - Clear question, answer directly:
Student: "What is the quadratic formula?"
You: "The quadratic formula is $x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$. It helps us solve any quadratic equation in the form $ax^2 + bx + c = 0$..."

GOOD - Vague question, clarify first:
Student: "Help me with equations"
You: "I'd love to help! Are you working on linear equations, quadratic equations, or something else? And is this for a specific assignment?"

BAD - Withholding when context is clear:
Student: "What is 2/3 + 1/4?"
You: "What do you think? Let me ask you first..." ❌
CORRECT: Show the solution: "To add $\\frac{2}{3} + \\frac{1}{4}$, we need a common denominator..."

Remember: Be encouraging, friendly, and HELPFUL. Your goal is to build understanding AND provide real help.`;
}

// Build messages for API call
export function buildChatMessages(
  context: StudentContext,
  conversationHistory: ChatMessage[],
  newMessage: string
): ChatMessage[] {
  const messages: ChatMessage[] = [
    { role: 'system', content: buildSystemPrompt(context) },
    ...conversationHistory.slice(-20), // Keep last 20 messages for context
    { role: 'user', content: newMessage },
  ];
  return messages;
}

// Get student context from database
export async function getStudentContext(studentUserId: string): Promise<StudentContext | null> {
  const supabase = await createClient();

  // Get student profile
  const { data: profile } = await supabase
    .from('users_profile')
    .select('full_name')
    .eq('id', studentUserId)
    .single();

  const { data: studentProfile } = await supabase
    .from('students_profile')
    .select('grade_level, course_track, goals')
    .eq('user_id', studentUserId)
    .single();

  if (!profile || !studentProfile) return null;

  // Get recent skills from sessions
  const { data: recentSessions } = await supabase
    .from('sessions')
    .select(`
      session_skills (
        skill:skills (name)
      )
    `)
    .eq('student_user_id', studentUserId)
    .order('created_at', { ascending: false })
    .limit(5);

  const recentSkills: string[] = [];
  recentSessions?.forEach(session => {
    const sessionSkills = session.session_skills as unknown as Array<{ skill: { name: string } | null }> | null;
    sessionSkills?.forEach(ss => {
      if (ss.skill?.name && !recentSkills.includes(ss.skill.name)) {
        recentSkills.push(ss.skill.name);
      }
    });
  });

  // Get mastery levels
  const { data: masteryData } = await supabase
    .from('student_skill_mastery')
    .select(`
      mastery_level,
      skill:skills (name)
    `)
    .eq('student_user_id', studentUserId);

  const masteryLevels: Record<string, string> = {};
  masteryData?.forEach(m => {
    const skill = m.skill as unknown as { name: string } | null;
    if (skill?.name) {
      masteryLevels[skill.name] = m.mastery_level;
    }
  });

  return {
    studentName: profile.full_name.split(' ')[0],
    gradeLevel: studentProfile.grade_level,
    courseTrack: studentProfile.course_track,
    recentSkills: recentSkills.slice(0, 5),
    masteryLevels,
    goals: studentProfile.goals || undefined,
  };
}

// Create or get conversation
export async function getOrCreateConversation(
  studentUserId: string,
  conversationId?: string
): Promise<string> {
  const supabase = await createClient();

  if (conversationId) {
    // Verify conversation belongs to student
    const { data } = await supabase
      .from('ai_chat_conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('student_user_id', studentUserId)
      .single();

    if (data) return data.id;
  }

  // Create new conversation
  const { data: newConvo, error } = await supabase
    .from('ai_chat_conversations')
    .insert({
      student_user_id: studentUserId,
      title: 'New Chat',
      status: 'active',
    })
    .select('id')
    .single();

  if (error) throw new Error(`Failed to create conversation: ${error.message}`);
  return newConvo.id;
}

// Get conversation history
export async function getConversationHistory(
  conversationId: string
): Promise<ChatMessage[]> {
  const supabase = await createClient();

  const { data: messages } = await supabase
    .from('ai_chat_messages')
    .select('role, content')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  return (messages || []).map(m => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }));
}

// Save message to database
export async function saveMessage(
  conversationId: string,
  role: 'user' | 'assistant',
  content: string,
  tokensUsed?: number
): Promise<void> {
  const supabase = await createClient();

  await supabase.from('ai_chat_messages').insert({
    conversation_id: conversationId,
    role,
    content,
    tokens_used: tokensUsed,
  });
}

// Update conversation title based on first message
export async function updateConversationTitle(
  conversationId: string,
  firstMessage: string
): Promise<void> {
  const supabase = await createClient();

  // Generate a short title from the first message
  const title = firstMessage.length > 50
    ? firstMessage.substring(0, 47) + '...'
    : firstMessage;

  await supabase
    .from('ai_chat_conversations')
    .update({ title })
    .eq('id', conversationId);
}

// Get student's conversations
export async function getStudentConversations(studentUserId: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from('ai_chat_conversations')
    .select('id, title, message_count, last_message_at, created_at')
    .eq('student_user_id', studentUserId)
    .eq('status', 'active')
    .order('last_message_at', { ascending: false, nullsFirst: false })
    .limit(20);

  return data || [];
}
