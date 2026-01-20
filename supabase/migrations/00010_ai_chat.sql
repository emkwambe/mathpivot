-- ============================================================================
-- MATHPIVOT TUTOROS - AI CHAT SYSTEM
-- Migration 00010: AI tutor chat conversations and messages
-- ============================================================================

-- Chat conversation status
CREATE TYPE chat_status AS ENUM ('active', 'archived', 'flagged');

-- AI Chat Conversations
CREATE TABLE ai_chat_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT,
    skill_context UUID REFERENCES skills(id),
    session_context UUID REFERENCES sessions(id),
    status chat_status NOT NULL DEFAULT 'active',
    message_count INTEGER NOT NULL DEFAULT 0,
    last_message_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- AI Chat Messages
CREATE TABLE ai_chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES ai_chat_conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    skill_references UUID[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    tokens_used INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Scheduling Suggestions (for intelligent scheduling)
CREATE TABLE scheduling_suggestions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    tutor_user_id UUID REFERENCES tutors_profile(user_id),
    suggested_date DATE NOT NULL,
    suggested_start_time TIME NOT NULL,
    suggested_end_time TIME NOT NULL,
    reason TEXT NOT NULL,
    score DECIMAL(3,2) NOT NULL DEFAULT 0.5, -- 0-1 confidence score
    is_accepted BOOLEAN,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 days'
);

-- Learning Analytics (for AI recommendations)
CREATE TABLE learning_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    metric_type TEXT NOT NULL, -- 'session_frequency', 'skill_progress', 'engagement', etc.
    metric_value DECIMAL(10,2) NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_ai_chat_conversations_student ON ai_chat_conversations(student_user_id);
CREATE INDEX idx_ai_chat_conversations_status ON ai_chat_conversations(status);
CREATE INDEX idx_ai_chat_messages_conversation ON ai_chat_messages(conversation_id);
CREATE INDEX idx_ai_chat_messages_created ON ai_chat_messages(created_at);
CREATE INDEX idx_scheduling_suggestions_student ON scheduling_suggestions(student_user_id);
CREATE INDEX idx_scheduling_suggestions_expires ON scheduling_suggestions(expires_at);
CREATE INDEX idx_learning_analytics_student ON learning_analytics(student_user_id);
CREATE INDEX idx_learning_analytics_type ON learning_analytics(metric_type);

-- Update triggers
CREATE TRIGGER update_ai_chat_conversations_updated_at
    BEFORE UPDATE ON ai_chat_conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update conversation stats after new message
CREATE OR REPLACE FUNCTION update_conversation_stats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE ai_chat_conversations
    SET
        message_count = message_count + 1,
        last_message_at = NEW.created_at
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_chat_message_insert
    AFTER INSERT ON ai_chat_messages
    FOR EACH ROW EXECUTE FUNCTION update_conversation_stats();

-- RLS Policies
ALTER TABLE ai_chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduling_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_analytics ENABLE ROW LEVEL SECURITY;

-- Students can only see their own conversations
CREATE POLICY "Students view own conversations" ON ai_chat_conversations
    FOR SELECT USING (auth.uid() = student_user_id);

CREATE POLICY "Students create own conversations" ON ai_chat_conversations
    FOR INSERT WITH CHECK (auth.uid() = student_user_id);

CREATE POLICY "Students update own conversations" ON ai_chat_conversations
    FOR UPDATE USING (auth.uid() = student_user_id);

-- Messages follow conversation access
CREATE POLICY "Users view messages in own conversations" ON ai_chat_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM ai_chat_conversations c
            WHERE c.id = conversation_id AND c.student_user_id = auth.uid()
        )
    );

CREATE POLICY "Users create messages in own conversations" ON ai_chat_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM ai_chat_conversations c
            WHERE c.id = conversation_id AND c.student_user_id = auth.uid()
        )
    );

-- Parents can see their children's conversations
CREATE POLICY "Parents view children conversations" ON ai_chat_conversations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM family_members fm1
            JOIN family_members fm2 ON fm1.family_id = fm2.family_id
            WHERE fm1.user_id = auth.uid()
            AND fm1.member_role = 'parent'
            AND fm2.user_id = student_user_id
        )
    );

-- Admins and tutors can view all conversations
CREATE POLICY "Admins view all conversations" ON ai_chat_conversations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users_profile
            WHERE id = auth.uid() AND role IN ('admin', 'tutor')
        )
    );

-- Scheduling suggestions policies
CREATE POLICY "Users view own scheduling suggestions" ON scheduling_suggestions
    FOR SELECT USING (
        student_user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM family_members fm
            WHERE fm.user_id = auth.uid()
            AND fm.family_id = scheduling_suggestions.family_id
        )
    );

-- Learning analytics policies
CREATE POLICY "Students view own analytics" ON learning_analytics
    FOR SELECT USING (auth.uid() = student_user_id);

CREATE POLICY "Parents view children analytics" ON learning_analytics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM family_members fm1
            JOIN family_members fm2 ON fm1.family_id = fm2.family_id
            WHERE fm1.user_id = auth.uid()
            AND fm1.member_role = 'parent'
            AND fm2.user_id = student_user_id
        )
    );

CREATE POLICY "Admins view all analytics" ON learning_analytics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users_profile
            WHERE id = auth.uid() AND role IN ('admin', 'tutor')
        )
    );
