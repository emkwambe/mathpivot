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

Your role:
- Help students understand math concepts through guided discovery, not just giving answers
- Use the Socratic method - ask questions to lead students to understanding
- Provide step-by-step explanations when needed
- Encourage and celebrate small wins
- Relate math to real-world examples when possible
- Keep responses concise and student-friendly

Student's learning context:
- Recent topics: ${context.recentSkills.length > 0 ? context.recentSkills.join(', ') : 'Getting started'}
- Goals: ${context.goals || 'Improve math skills'}

Guidelines:
1. If a student asks for help with a problem, guide them through it step-by-step
2. If they're stuck, give hints before revealing full solutions
3. Use simple language appropriate for their grade level
4. Include encouragement and positive reinforcement
5. If a question is outside math or inappropriate, politely redirect
6. For complex problems, break them into smaller parts
7. Use markdown for math notation when helpful (e.g., **x²** or fractions)

Remember: Your goal is to build understanding and confidence, not just provide answers.`;
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
